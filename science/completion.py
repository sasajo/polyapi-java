import copy
import requests
import openai
import flask
from requests import Response
from typing import List, Dict, Optional, Set, Tuple
from prisma import get_client
from prisma.models import ConversationMessage, SystemPrompt
from utils import ChatGptChoice, log

# TODO change to relative imports
from constants import FINE_TUNE_MODEL, NODE_API_URL
from keywords import extract_keywords, keywords_similar
from utils import (
    FunctionDto,
    MessageDict,
    WebhookDto,
    clear_conversation,
    func_path_with_args,
    func_path,
    store_message,
)


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


def answer_processing(choice: ChatGptChoice, match_count: int) -> Tuple[str, bool]:
    content = choice["message"]["content"]

    if choice["finish_reason"] == "length":
        # incomplete model output due to max_tokens parameter or token limi
        # let's append a message explaining to the user answer is incomplete
        content += "\n\nTOKEN LIMIT HIT\n\nPoly has hit the ChatGPT token limit for this conversation. Conversation reset. Please try again to see the full answer."
        return content, True

    if match_count:
        moderation_answer = poly_moderation(content)
        if moderation_answer:
            return moderation_answer, False

        # ok! if we make it here we don't detect any "bad answers" coming back
        # so we can just return what openai sent us
        return content, False
    else:
        return f"We weren't able to find any Poly functions to do that.\n\nBeyond Poly, here's what we think:\n\n{content}", False


def poly_moderation(content: str) -> str:
    """let's "moderate" the response received back from Poly
    for now this just means we will detect if the answer says "no functions found"
    and return a message to that effect

    ChatGPT on its own will try to tell the user how to go outside Poly
    and use external APIs to do what they want
    """
    lowered = content.strip().lower()

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

    # return empty string if we don't want to moderate this
    return ""


def get_function_completion_answer(user_id: int, question: str) -> str:
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


def log_matches(question: str, type: str, matches: int, total: int):
    log(f"{type}: {matches} out of {total} matched: {question}")


def query_node_server(type: str) -> Response:
    db = get_client()
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"{NODE_API_URL}/{type}", headers=headers)
    assert resp.status_code == 200, resp.content
    return resp


def get_question_message_dict(question, match_count) -> MessageDict:
    if match_count > 0:
        # let's ask it to give us one of the matching functions!
        question_msg = MessageDict(role="user", content="From the Poly API Library, " + question)
    else:
        # there are no matches, let's just ask the question to ChatGPT in general
        question_msg = MessageDict(role="user", content=question)
    return question_msg


def get_function_message_dict(
    *,
    already_defined: Optional[Set[str]] = None,
    keywords: str = "",
) -> Tuple[Optional[MessageDict], int]:
    """get all matching functions that need to be injected into the prompt
    """
    already_defined = already_defined or set()

    preface = "Here are some functions in the Poly API library,"
    parts: List[str] = [preface]

    resp = query_node_server("functions")

    public_ids = []
    items: List[FunctionDto] = resp.json()

    match_count = 0
    for item in items:
        keyword_match = keywords_similar(keywords, item)
        if keyword_match:
            match_count += 1

        if item["id"] not in already_defined and keyword_match:
            parts.append(f"// {item['description']}\n{func_path_with_args(item)}")
            public_ids.append(item["id"])

    if keywords:
        log_matches(keywords, "functions", match_count, len(items))

    if not public_ids:
        # all the functions are already defined!
        # let's go ahead and skip
        return None, match_count

    return {
        "role": "assistant",
        "content": "\n\n".join(parts),
        "function_ids": public_ids,
    }, match_count


def get_webhook_message_dict(
    *,
    already_defined: Optional[Set[str]] = None,
    keywords: str = "",
) -> Tuple[Optional[MessageDict], int]:
    """get all matching webhooks that need to be injected into the prompt
    """
    already_defined = already_defined or set()

    preface = "Here are some event handlers in the Poly API library,"
    parts: List[str] = [preface]

    resp = query_node_server("webhooks")

    public_ids = []
    items: List[WebhookDto] = resp.json()

    match_count = 0
    for item in items:
        keyword_match = keywords_similar(keywords, item)
        if keyword_match:
            match_count += 1

        if item["id"] not in already_defined and keyword_match:
            parts.append(webhook_prompt(item))
            public_ids.append(item["id"])

    if keywords:
        log_matches(keywords, "webhooks", match_count, len(items))

    if not public_ids:
        # all the webhooks are already defined!
        # let's go ahead and skip
        return None, match_count

    return {
        "role": "assistant",
        "content": "\n\n".join(parts),
        "webhook_ids": public_ids,
    }, match_count


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
    for url in hook.get("urls", []):
        if hook["id"] in url:
            continue
        parts.append(f"url: {url}")
    return "\n".join(parts)


def get_conversation_answer(
    user_id: int, messages: List[ConversationMessage], question: str
):
    # prepare payload
    priors: List[MessageDict] = []
    for message in messages:
        priors.append({"role": message.role, "content": message.content})

    new_messages, match_count = get_new_conversation_messages(messages, question)

    # get
    try:
        resp = get_chat_completion(priors + new_messages)
    except openai.InvalidRequestError as e:
        # our conversation is probably too long! let's transparently nuke it and start again
        flask.current_app.log_exception(e)  # type: ignore
        clear_conversation(user_id)
        return get_completion_answer(user_id, question)

    answer, hit_token_limit = answer_processing(resp["choices"][0], match_count)

    if hit_token_limit:
        # if we hit the token limit, let's just clear the conversation and start over
        clear_conversation(user_id)
    else:
        # store
        for message in new_messages:
            store_message(user_id, message)
        store_message(user_id, {"role": "assistant", "content": answer})

    return answer


def get_new_conversation_messages(
    old_messages: List[ConversationMessage], question: str
) -> Tuple[List[MessageDict], int]:
    """get all the new messages that should be added to an existing conversation"""
    rv = []

    old_msg_ids = [m.id for m in old_messages]

    db = get_client()
    old_function_ids = {
        f.functionPublicId
        for f in db.functiondefined.find_many(where={"messageId": {"in": old_msg_ids}})
    }
    old_webhook_ids = {
        w.webhookPublicId
        for w in db.webhookdefined.find_many(where={"messageId": {"in": old_msg_ids}})
    }

    keywords = extract_keywords(question)

    new_functions, function_count = get_function_message_dict(
        already_defined=old_function_ids, keywords=keywords
    )
    if new_functions:
        rv.append(new_functions)

    new_webhooks, webhook_count = get_webhook_message_dict(
        already_defined=old_webhook_ids, keywords=keywords
    )
    if new_webhooks:
        rv.append(new_webhooks)

    match_count = function_count + webhook_count
    question_msg = get_question_message_dict(question, match_count)
    rv.append(question_msg)

    return rv, match_count


def get_chat_completion(messages: List[MessageDict]) -> Dict:
    """send the messages to OpenAI and get a response"""
    stripped = copy.deepcopy(messages)
    for s in stripped:
        # pop off all the data we use internally before sending the messages to OpenAI
        s.pop("function_ids", None)
        s.pop("webhook_ids", None)

    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=stripped,
    )


def get_completion_prompt_messages(question: str) -> Tuple[List[MessageDict], int]:
    keywords = extract_keywords(question)
    function_message, function_count = get_function_message_dict(keywords=keywords)
    webhook_message, webhook_count = get_webhook_message_dict(keywords=keywords)

    rv = [
        # from the OpenAI docs:
        # gpt-3.5-turbo-0301 does not always pay strong attention to system messages. Future models will be trained to pay stronger attention to system messages.
        # let's try user!
        MessageDict(
            role="user",
            content="Only include actual payload elements and function arguments in the example. Be concise.",
        ),
        MessageDict(
            role="user",
            content="To import the Poly API library, use `import poly from 'polyapi';`",
        ),
    ]

    if function_message:
        rv.append(function_message)

    if webhook_message:
        rv.append(webhook_message)

    match_count = function_count + webhook_count
    question_msg = get_question_message_dict(question, match_count)
    rv.append(question_msg)

    system_prompt = get_system_prompt()
    if system_prompt and system_prompt.content:
        rv.insert(0, {"role": "system", "content": system_prompt.content})
    return rv, match_count


def get_system_prompt() -> Optional[SystemPrompt]:
    # HACK for now this is just one system-wide
    # but in future there will be multiple types, multiple orgs, etc
    db = get_client()
    system_prompt = db.systemprompt.find_first(order={"createdAt": "desc"})
    return system_prompt


def get_completion_answer(user_id: int, question: str) -> str:
    messages, match_count = get_completion_prompt_messages(question)
    resp = get_chat_completion(messages)
    answer, hit_token_limit = answer_processing(resp["choices"][0], match_count)

    if hit_token_limit:
        # if we hit the token limit, let's just clear the conversation and start over
        clear_conversation(user_id)
    else:
        for message in messages:
            store_message(
                user_id,
                message,
            )
        store_message(user_id, {"role": "assistant", "content": answer})

    return answer
