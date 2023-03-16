#!/usr/bin/env python3
import os
from typing import Dict, List, Optional
import requests
import openai
from flask import Flask, request
from prisma import Prisma, register
from utils import (
    FunctionDto,
    WebhookDto,
    func_path_with_args,
    get_completion_answer,
    get_completion_question,
    get_conversation_answer,
    webhook_prompt,
)

# port of the nestjs server
PORT = os.environ.get("PORT", "80")

# Fine tune model sucks for now, just use ChatGPT
FINE_TUNE_MODEL = os.environ.get("FINE_TUNE_MODEL")


app = Flask(__name__)
db = Prisma()
db.connect()
register(db)


@app.route("/")
def home():
    readme_link = "<a href='https://github.com/polyapi/poly-alpha/blob/main/science/README.md'>README</a>"
    return f"<h1>Hello, World!</h1>\n<div>You probably want `POST /function_completion`! See the {readme_link} for details"


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


@app.route("/function-completion", methods=["POST"])  # type: ignore
def function_completion() -> str:
    data: Dict = request.get_json(force=True)
    question: str = data["question"].strip()
    completion_question = get_completion_question(question)

    user_id: Optional[int] = data.get("user_id")
    if user_id and question == "clear":
        _clear_conversation(user_id)
        return "Conversation cleared"

    messages = (
        db.conversationmessage.find_many(where={"userId": user_id}) if user_id else None
    )
    if messages:
        return get_conversation_answer(db, user_id, messages, completion_question)
    else:
        functions = get_function_prompt()
        webhooks = get_webhook_prompt()
        return get_completion_answer(db, user_id, functions, webhooks, completion_question)


@app.route("/clear-conversation", methods=["POST"])
def clear_conversation() -> str:
    user_id = request.get_json(force=True)["user_id"]
    _clear_conversation(user_id)
    return "Conversation Cleared"


def _clear_conversation(user_id: int):
    db.conversationmessage.delete_many(where={"userId": user_id})


def get_function_prompt() -> str:
    how_to_import = "To import the Poly API library, use `import poly from 'polyapi';`"
    preface = "Here are the functions in the Poly API library,"
    parts: List[str] = [how_to_import, preface]

    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"http://localhost:{PORT}/functions/", headers=headers)
    assert resp.status_code == 200, resp.content
    funcs: List[FunctionDto] = resp.json()
    for func in funcs:
        parts.append(f"// {func['description']}\n{func_path_with_args(func)}")

    return "\n\n".join(parts)


def get_webhook_prompt() -> str:
    preface = "Here are the event handlers in the Poly API library,"
    parts: List[str] = [preface]

    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        raise NotImplementedError("ERROR: no admin user, cannot access Node API")

    headers = {"Content-Type": "application/json", "X-PolyApiKey": user.apiKey}
    resp = requests.get(f"http://localhost:{PORT}/webhooks/", headers=headers)
    assert resp.status_code == 200, resp.content
    webhooks: List[WebhookDto] = resp.json()
    for webhook in webhooks:
        parts.append(webhook_prompt(webhook))

    return "\n\n".join(parts)


if __name__ == "__main__":
    # handy for testing
    # comment out app.run!
    # print(get_base_prompt())
    app.run(port=5000)
