#!/usr/bin/env python3
from typing import Dict, Optional
from flask import Flask, request
from prisma import Prisma, register
from completion import get_function_completion_answer
from description import get_function_description
from utils import FunctionDto


app = Flask(__name__)
db = Prisma()
db.connect()
register(db)


@app.route("/")
def home():
    readme_link = "<a href='https://github.com/polyapi/poly-alpha/blob/main/science/README.md'>README</a>"
    return f"<h1>Hello, World!</h1>\n<div>You probably want `POST /function_completion`! See the {readme_link} for details"


@app.route("/function-completion", methods=["POST"])  # type: ignore
def function_completion() -> str:
    data: Dict = request.get_json(force=True)
    question: str = data["question"].strip()

    user_id: Optional[int] = data.get("user_id")
    if user_id and question == "clear":
        _clear_conversation(user_id)
        return "Conversation cleared"

    return get_function_completion_answer(user_id, question)


@app.route("/function-description", methods=["POST"])
def function_description() -> str:
    data: FunctionDto = request.get_json(force=True)
    return get_function_description(data)


@app.route("/clear-conversation", methods=["POST"])
def clear_conversation() -> str:
    user_id = request.get_json(force=True)["user_id"]
    _clear_conversation(user_id)
    return "Conversation Cleared"


def _clear_conversation(user_id: int):
    db.conversationmessage.delete_many(where={"userId": user_id})


if __name__ == "__main__":
    app.run(port=5000)
