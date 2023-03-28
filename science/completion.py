import copy
import requests
import openai
import flask
from typing import List, Dict, Optional, Set
from prisma import get_client
from prisma.models import ConversationMessage, SystemPrompt

# TODO change to relative imports
from constants import FINE_TUNE_MODEL, NODE_API_URL

from utils import (
    FunctionDto,
    MessageDict,
    WebhookDto,
    clear_conversation,
    func_path_with_args,
    func_path,
    store_message,
)


# There are three main steps in our completion pipeline:
# 1. Question Processing - process the question to make it more suitable for the model
# 2. Send to OpenAI
# 3. Answer Processing - process the answer to see if it's suitable to send back to the user


NO_FUNCTION_RESPONSE = {
    "there is currently no function",  # maybe replace currently with a regex?
    "there is not currently a function",
    "there isn't currently a function",
    "there is no function",
    "there isn't a function",
    "there is no direct function",
    "there isn't a direct function",
    "there is no specific function",
    "there isn't a specific function",
    "the poly api library does not have",
    "the poly api library doesn't have",
    "the poly api library does not provide",
    "the poly api library doesn't provide",
}
NO_FUNCTION_ANSWER = (
    "Poly doesn't know any functions to do that yet. But Poly would love to be taught!"
)


ADVERBS = {
    "unfortunately",
}


def question_processing(question: str) -> str:
    return "From the Poly API library, " + question
    # return question


def answer_processing(from_openai: str) -> str:
    lowered = from_openai.strip().lower()

    # first strip off any common adverbs
    for adverb in ADVERBS:
        if lowered.startswith(adverb):
            lowered = lowered.lstrip(adverb)
            lowered = lowered.lstrip(",")
            lowered = lowered.strip()

    # now lets detect bad answers
    for bad in NO_FUNCTION_RESPONSE:
        if lowered.startswith(bad):
            return NO_FUNCTION_ANSWER

    # ok! if we make it here we don't detect any "bad answers" coming back
    # so we can just return what openai sent us
    return from_openai


def get_function_completion_answer(user_id: Optional[int], question: str) -> str:
    question = question_processing(question)

    messages = get_conversations_for_user(user_id)
    if messages:
        return get_conversation_answer(user_id, messages, question)
    else:
        return get_completion_answer(user_id, question)


def get_conversations_for_user(user_id: Optional[int]) -> List[ConversationMessage]:
    if not user_id:
        return []

    db = get_client()
    return list(
        db.conversationmessage.find_many(
            where={"userId": user_id}, order={"createdAt": "asc"}
        )
    )


def get_function_message_dict(
    already_defined: Optional[Set[str]] = None,
) -> Optional[MessageDict]:
    """get all functions (if any) that are not yet defined in the prompt
    :param already_defined: a list of function public ids that are already defined
    """
    already_defined = already_defined or set()

    preface = "Here are some functions in the Poly API library,"
    parts: List[str] = [preface]

    db = get_client()
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"{NODE_API_URL}/functions", headers=headers)
    assert resp.status_code == 200, resp.content
    funcs: List[FunctionDto] = resp.json()

    public_ids = []
    for func in funcs:
        if func["id"] in already_defined:
            continue

        parts.append(f"// {func['description']}\n{func_path_with_args(func)}")
        public_ids.append(func["id"])

    content = "\n\n".join(parts)
    return {"role": "assistant", "content": content, "function_ids": public_ids}


def get_webhook_message_dict(
    already_defined: Optional[Set[str]] = None,
) -> Optional[MessageDict]:
    """get all webhooks (if any) that are not yet defined in the prompt
    :param already_defined: a list of webhook public ids that are already defined
    """
    already_defined = already_defined or set()

    preface = "Here are some event handlers in the Poly API library,"
    parts: List[str] = [preface]

    db = get_client()
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"{NODE_API_URL}/webhooks/", headers=headers)
    assert resp.status_code == 200, resp.content

    public_ids = []
    webhooks: List[WebhookDto] = resp.json()

    for webhook in webhooks:
        if webhook["id"] in already_defined:
            continue

        parts.append(webhook_prompt(webhook))
        public_ids.append(webhook["id"])

    if not public_ids:
        # all the webhooks are already defined!
        # let's go ahead and skip
        return None

    return {
        "role": "assistant",
        "content": "\n\n".join(parts),
        "webhook_ids": public_ids,
    }


def get_fine_tune_answer(question: str):
    # Fine tune model sucks for now, just use ChatGPT
    resp = openai.Completion.create(
        temperature=0.2,
        model=FINE_TUNE_MODEL,
        max_tokens=200,
        frequency_penalty=0.8,
        prompt=question,
    )

    prefix = f"USING FINE TUNE MODEL: {FINE_TUNE_MODEL}\n\n"
    return prefix + resp["choices"][0]["text"]


def webhook_prompt(hook: WebhookDto) -> str:
    parts = [func_path(hook)]
    for url in hook["urls"]:
        if hook["id"] in url:
            continue
        parts.append(f"url: {url}")
    return "\n".join(parts)


def get_conversation_answer(
    user_id: Optional[int], messages: List[ConversationMessage], question: str
):
    # prepare payload
    priors: List[MessageDict] = []
    for message in messages:
        priors.append({"role": message.role, "content": message.content})

    new_messages = get_new_conversation_messages(messages, question)

    # get
    try:
        resp = get_chat_completion(priors + new_messages)
    except openai.InvalidRequestError as e:
        # our conversation is probably too long! let's transparently nuke it and start again
        flask.current_app.log_exception(e)  # type: ignore
        clear_conversation(user_id)
        return get_completion_answer(user_id, question)

    answer = answer_processing(resp["choices"][0]["message"]["content"])

    # store
    for message in new_messages:
        store_message(user_id, message)
    store_message(user_id, {"role": "assistant", "content": answer})

    return answer


def get_new_conversation_messages(old_messages: List[ConversationMessage], question: str) -> List[MessageDict]:
    """ get all the new messages that should be added to an existing conversation
    """
    rv = []

    old_msg_ids = [m.id for m in old_messages]

    db = get_client()
    old_function_ids = {f.functionPublicId for f in db.functiondefined.find_many(where={"messageId": {"in": old_msg_ids}})}
    old_webhook_ids = {w.webhookPublicId for w in db.webhookdefined.find_many(where={"messageId": {"in": old_msg_ids}})}

    new_functions = get_webhook_message_dict(old_function_ids)
    if new_functions:
        rv.append(new_functions)

    new_webhooks = get_webhook_message_dict(old_webhook_ids)
    if new_webhooks:
        rv.append(new_webhooks)

    question_msg = MessageDict(role="user", content=question)
    rv.append(question_msg)
    return rv


def get_chat_completion(messages: List[MessageDict]) -> Dict:
    """ send the messages to OpenAI and get a response
    """
    stripped = copy.deepcopy(messages)
    for s in stripped:
        # pop off all the data we use internally before sending the messages to OpenAI
        s.pop("function_ids", None)
        s.pop("webhook_ids", None)

    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=stripped,
    )


def get_completion_prompt_messages(question: str) -> List[MessageDict]:
    function_message = get_function_message_dict()
    webhook_message = get_webhook_message_dict()

    rv = [
        MessageDict(role="system", content="Include argument types. Be concise."),
        MessageDict(
            role="assistant",
            content="To import the Poly API library, use `import poly from 'polyapi';`",
        ),
        function_message,
        webhook_message,
        MessageDict(role="user", content=question),
    ]

    system_prompt = get_system_prompt()
    if system_prompt and system_prompt.content:
        rv.insert(0, {"role": "system", "content": system_prompt.content})
    return rv


def get_system_prompt() -> Optional[SystemPrompt]:
    # HACK for now this is just one system-wide
    # but in future there will be multiple types, multiple orgs, etc
    db = get_client()
    system_prompt = db.systemprompt.find_first(order={"createdAt": "desc"})
    return system_prompt


def get_completion_answer(user_id: Optional[int], question: str) -> str:
    messages = get_completion_prompt_messages(question)
    resp = get_chat_completion(messages)
    answer = answer_processing(resp["choices"][0]["message"]["content"])

    for message in messages:
        store_message(
            user_id,
            message,
            function_ids=message.get("function_ids", []),
            webhook_ids=message.get("webhook_ids", []),
        )
    store_message(user_id, {"role": "assistant", "content": answer})

    return answer
