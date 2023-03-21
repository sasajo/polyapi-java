import requests
import openai
from typing import List, Dict, Optional
from prisma import get_client, Prisma
from prisma.models import ConversationMessage

# TODO change to relative imports
from constants import FINE_TUNE_MODEL, NODE_API_URL

from utils import (
    FunctionDto,
    WebhookDto,
    func_path_with_args,
    func_path,
    store_message,
)


# There are three main steps in our completion pipeline:
# 1. Question Processing - process the question to make it more suitable for the model
# 2. Send to OpenAI
# 3. Answer Processing - process the answer to see if it's suitable to send back to the user


BAD_ANSWERS = {
    "there is no direct function",
    "there is no specific function",
    "the poly api library does not have",
    "the poly api library doesn't have",
    "the poly api library does not provide",
    "the poly api library doesn't provide",
}


def question_processing(question: str) -> str:
    return "From the Poly API library, " + question


def answer_processing(from_openai: str):
    lowered = from_openai.lower()
    for bad in BAD_ANSWERS:
        if lowered.startswith(bad):
            return "Poly doesn't know any functions to do that yet. But Poly would love to be taught!"

    # ok! if we make it here we don't detect any "bad answers" coming back
    # so we can just return what openai sent us
    return from_openai


def get_function_completion_answer(user_id: Optional[int], question: str) -> str:
    db = get_client()
    question = question_processing(question)

    messages = (
        db.conversationmessage.find_many(where={"userId": user_id}) if user_id else None
    )
    if messages:
        return get_conversation_answer(db, user_id, messages, question)
    else:
        functions = get_function_prompt()
        webhooks = get_webhook_prompt()
        return get_completion_answer(db, user_id, functions, webhooks, question)


def get_function_prompt() -> str:
    how_to_import = "To import the Poly API library, use `import poly from 'polyapi';`"
    preface = "Here are the functions in the Poly API library,"
    parts: List[str] = [how_to_import, preface]

    db = get_client()
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"{NODE_API_URL}/functions", headers=headers)
    assert resp.status_code == 200, resp.content
    funcs: List[FunctionDto] = resp.json()
    for func in funcs:
        parts.append(f"// {func['description']}\n{func_path_with_args(func)}")

    return "\n\n".join(parts)


def get_webhook_prompt() -> str:
    preface = "Here are the event handlers in the Poly API library,"
    parts: List[str] = [preface]

    db = get_client()
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"{NODE_API_URL}/webhooks/", headers=headers)
    assert resp.status_code == 200, resp.content
    webhooks: List[WebhookDto] = resp.json()
    for webhook in webhooks:
        parts.append(webhook_prompt(webhook))

    return "\n\n".join(parts)


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
    db: Prisma, user_id: int, messages: List[ConversationMessage], question: str
):
    priors: List[Dict[str, str]] = []
    for message in messages:
        priors.append({"role": message.role, "content": message.content})

    question_message = {"role": "user", "content": question}
    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=priors + [question_message],
    )
    answer = answer_processing(resp["choices"][0]["message"]["content"])
    store_message(db, user_id, question_message)
    store_message(db, user_id, {"role": "assistant", "content": answer})
    return answer


def get_completion_prompt_messages(
    functions: str, webhooks: str, question: str
) -> List[Dict]:
    return [
        {"role": "system", "content": "Include argument types. Be concise."},
        {"role": "assistant", "content": functions},
        {"role": "assistant", "content": webhooks},
        # HACK To try to prevent Poly hallucinating functions we don't have
        # https://github.com/polyapi/poly-alpha/issues/96
        # {"role": "assistant", "content": "Only respond with functions and event handlers explicitly listed as part of the Poly API library. Do not use external APIs."},
        {"role": "user", "content": question},
    ]


def get_completion_answer(
    db: Prisma, user_id: int, functions: str, webhooks: str, question: str
) -> str:
    messages = get_completion_prompt_messages(functions, webhooks, question)

    model = "gpt-3.5-turbo"
    # print(f"Using model: {model}")
    resp = openai.ChatCompletion.create(model=model, messages=messages)
    answer = answer_processing(resp["choices"][0]["message"]["content"])

    for message in messages:
        store_message(db, user_id, message)
    store_message(db, user_id, {"role": "assistant", "content": answer})

    return answer