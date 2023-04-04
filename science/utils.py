import json
from typing import Dict, List, Tuple, Optional, Union
from typedefs import FunctionDto, WebhookDto, MessageDict
from prisma import get_client
from prisma.models import ConversationMessage, UrlFunction


# HACK should have better name
def func_path(func: Union[FunctionDto, WebhookDto]) -> str:
    """get the functions path as it will be exposed in the poly library"""
    if func["context"]:
        path = func["context"] + "." + func["name"]
    else:
        path = func["name"]
    return "poly." + path


def func_args(func: FunctionDto) -> Tuple[List[str], Dict[str, str]]:
    """get the args for a function from the headers and url"""
    arg_strings = []
    payload = {}
    for arg in func["arguments"]:
        if arg.get("payload"):
            payload[arg["name"]] = arg["type"]
        else:
            arg_strings.append(arg["name"] + ": " + arg["type"])
    return arg_strings, payload


def func_path_with_args(func: FunctionDto) -> str:
    args, payload = func_args(func)
    if payload and args:
        return f"const payload = {json.dumps(payload)}\n{func_path(func)}({', '.join(args)}, payload)"
    elif payload:
        return f"const payload = {json.dumps(payload)}\n{func_path(func)}(payload)"
    else:
        return f"{func_path(func)}({', '.join(args)})"


def url_function_path(func: UrlFunction) -> str:
    return f"{func.context}.{func.name}"


def log(*args, **kwargs) -> None:
    print(*args, **kwargs, flush=True)


def store_message(
    user_id: Optional[int], data: MessageDict
) -> Optional[ConversationMessage]:
    if not user_id:
        return None

    db = get_client()
    create_input = {"userId": user_id, "role": data["role"], "content": data["content"]}

    if data.get("function_ids"):
        create_input["functions"] = {
            "create": [{"functionPublicId": fid} for fid in data["function_ids"]]
        }
    if data.get("webhook_ids"):
        create_input["webhooks"] = {
            "create": [{"webhookPublicId": wid} for wid in data["webhook_ids"]]
        }

    rv = db.conversationmessage.create(data=create_input)  # type: ignore
    return rv


def clear_conversation(user_id: int):
    db = get_client()
    db.functiondefined.delete_many(where={"message": {"userId": user_id}})  # type: ignore
    db.webhookdefined.delete_many(where={"message": {"userId": user_id}})  # type: ignore
    db.conversationmessage.delete_many(where={"userId": user_id})
