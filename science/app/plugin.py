import os
import json
import logging
from flask import abort
import requests

from app.conversation import get_plugin_conversation_lookback, get_recent_messages

assert requests
from typing import Dict, List, Tuple
from openai import OpenAI
from openai.types.chat.chat_completion import Choice
from openai.types.chat.chat_completion_message_tool_call import ChatCompletionMessageToolCall
from prisma import get_client
from prisma.models import ConversationMessage, ApiKey

from app.constants import CHAT_GPT_MODEL, MessageType
from app.typedefs import MessageDict
from app.log import log
from app.utils import (
    get_tenant_openai_key,
    msgs_to_msg_dicts,
    store_messages,
    strip_type_and_info,
)

logger = logging.getLogger(__name__)


def _get_openapi_url(plugin_id: int) -> str:
    db = get_client()
    plugin = db.gptplugin.find_unique(
        where={"id": plugin_id}, include={"environment": True}
    )
    if not plugin or not plugin.environment:
        raise NotImplementedError(f"Plugin with id {plugin_id} doesn't exist, how?")
    if os.environ.get("LOCAL_PLUGIN_DEBUG"):
        url = "http://localhost:8000/plugins/megatronical/openapi"
    else:
        domain = os.environ.get("HOST_URL", "https://na1.polyapi.io").strip("https://")
        url = f"https://{plugin.slug}-{plugin.environment.subdomain}.{domain}/plugins/{plugin.slug}/openapi"
    return url


def _get_openapi_spec(plugin_id: int) -> Dict:
    openapi_url = _get_openapi_url(plugin_id)
    resp = requests.get(openapi_url)
    assert resp.status_code == 200, resp.content
    return resp.json()


def _get_body_schema_name(post: Dict) -> str:
    try:
        schema_ref: str = post["requestBody"]["content"]["application/json"]["schema"][
            "$ref"
        ]
        schema_name = schema_ref.rsplit("/", 1)[1]
    except Exception as e:
        log(f"_get_body_schema_problem:{e}\n{post}")
        return ""
    return schema_name


def openapi_to_openai_functions(openapi: Dict) -> List[Dict]:
    rv = []
    for path, data in openapi["paths"].items():
        post = data["post"]
        func = {"name": post["operationId"], "description": post["summary"]}
        schema_name = _get_body_schema_name(post)
        if schema_name:
            func["parameters"] = openapi["components"]["schemas"][schema_name]
        else:
            # TODO maybe this is a non-schema one?
            func["parameters"] = {"type": "object", "properties": {}}
        rv.append(func)

    return rv


def _get_previous_messages(
    conversation_id: str, db_api_key: ApiKey
) -> List[ConversationMessage]:
    db = get_client()
    conversation = db.conversation.find_first(where={"id": conversation_id})
    if conversation:
        if conversation.userId and conversation.userId != db_api_key.userId:
            abort(
                401,
                {
                    "message": "Not authorized. User id and conversation user id mismatch."
                },
            )
        elif (
            conversation.applicationId
            and conversation.applicationId != db_api_key.applicationId
        ):
            abort(
                401,
                {
                    "message": "Not authorized. Application and conversation application mismatch."
                },
            )

        prev_msgs = get_recent_messages(
            conversation_id, None, get_plugin_conversation_lookback()
        )
    else:
        conversation = db.conversation.create(
            data={
                "id": conversation_id,
                "userId": db_api_key.userId,
                "applicationId": db_api_key.applicationId,
            }
        )
        prev_msgs = []
    return prev_msgs


def _choose_tool(openai_api_key: str | None, **kwargs):
    client = OpenAI(api_key=openai_api_key)
    return client.chat.completions.create(model=CHAT_GPT_MODEL, **kwargs)


def _functions_to_tools(functions: List[Dict]) -> List[Dict]:
    return [{"type": "function", "function": f} for f in functions]


def _get_tools(plugin_id: int) -> Tuple[List[Dict], Dict]:
    openapi = _get_openapi_spec(plugin_id)
    functions = openapi_to_openai_functions(openapi)
    tools = _functions_to_tools(functions)
    return tools, openapi


def get_plugin_chat(
    api_key: str,
    api_key_id: str,
    plugin_id: int,
    conversation_id: str,
    message: str,
) -> Dict:
    """chat with a plugin"""
    db = get_client()
    db_api_key = db.apikey.find_unique(where={"id": api_key_id})
    assert db_api_key

    prev_msgs = _get_previous_messages(conversation_id, db_api_key)

    tools, openapi = _get_tools(plugin_id)

    messages = [
        MessageDict(role="user", content=message, type=MessageType.plugin.value)
    ]
    openai_api_key = get_tenant_openai_key(
        user_id=db_api_key.userId, application_id=db_api_key.applicationId
    )
    resp = _choose_tool(
        openai_api_key,
        messages=strip_type_and_info(msgs_to_msg_dicts(prev_msgs) + messages),  # type: ignore
        tools=tools,  # type: ignore
        temperature=0.2,
    )

    for _ in range(4):
        # resp is the variable that should change every iteration of this loop
        choice: Choice = resp.choices[0]
        if not choice.message:
            raise NotImplementedError(f"Got weird OpenAI response: {choice}")

        tool_calls = choice.message.tool_calls
        if tool_calls:
            tool_call = tool_calls[0]
            # lets execute the function_call and return the results
            execute_msg = execute_function(api_key, openapi, tool_call)
            tool_call_msg = choice.message.model_dump()
            del tool_call_msg["function_call"]
            messages.extend([tool_call_msg, execute_msg])  # type: ignore
            resp2 = _choose_tool(
                openai_api_key,
                messages=strip_type_and_info(msgs_to_msg_dicts(prev_msgs) + messages),  # type: ignore
                tools=tools,
                temperature=0.2,
            )
            # lets line up response for possible function_call execution
            resp = resp2
        else:
            # no function call so stop processing and return OpenAI's answer
            answer_msg: MessageDict = choice.message.model_dump()  # type: ignore
            answer_msg["type"] = MessageType.plugin.value
            messages.append(answer_msg)
            break

    store_messages(conversation_id, messages)
    return {"conversationGuid": conversation_id, "messages": _serialize(messages)}


def _serialize(messages: List[MessageDict]) -> List[MessageDict]:
    rv = []
    for message in messages:
        rv.append(message)
    return rv


def _get_name_path_map(openapi: Dict) -> Dict:
    rv = {}
    for path, data in openapi["paths"].items():
        rv[data["post"]["operationId"]] = path
    return rv


def execute_function(api_key: str, openapi: Dict, tool_call: ChatCompletionMessageToolCall) -> Dict:
    assert tool_call.type == "function"
    function_call = tool_call.function
    func_name = function_call.name
    assert func_name
    name_path_map = _get_name_path_map(openapi)
    path = name_path_map[func_name]
    if os.environ.get("LOCAL_PLUGIN_DEBUG"):
        domain = "https://megatronical.pagekite.me"  # DEBUG DOMAIN for local pagekite
    else:
        domain = os.environ.get("HOST_URL", "https://na1.polyapi.io")
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.post(
        domain + path, json=json.loads(function_call.arguments), headers=headers
    )

    execute_msg = dict(
        tool_call_id=tool_call.id,
        role="tool",
        name=func_name,
        content=resp.text)

    return execute_msg
