import requests
import openai
from typing import List, Optional
from prisma import get_client

# TODO change to relative imports
from constants import FINE_TUNE_MODEL, NODE_API_URL

from utils import (
    FunctionDto,
    WebhookDto,
    func_path_with_args,
    get_completion_answer,
    get_completion_question,
    get_conversation_answer,
    webhook_prompt,
)


def get_function_completion_answer(user_id: Optional[int], question: str) -> str:
    db = get_client()
    completion_question = get_completion_question(question)

    messages = (
        db.conversationmessage.find_many(where={"userId": user_id}) if user_id else None
    )
    if messages:
        return get_conversation_answer(db, user_id, messages, completion_question)
    else:
        functions = get_function_prompt()
        webhooks = get_webhook_prompt()
        return get_completion_answer(db, user_id, functions, webhooks, completion_question)


def get_function_prompt() -> str:
    how_to_import = "To import the Poly API library, use `import poly from 'polyapi';`"
    preface = "Here are the functions in the Poly API library,"
    parts: List[str] = [how_to_import, preface]

    db = get_client()
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"{NODE_API_URL}/functions/", headers=headers)
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