#!/usr/bin/env python3
from typing import Dict, Optional, Tuple
from flask import Flask, Response, request, jsonify
from openai import OpenAIError
from prisma import Prisma, register
from completion import get_completion_or_conversation_answer
from description import get_function_description
from typedefs import DescInputDto
from utils import clear_conversation, is_vip_user, log, set_config_variable


app = Flask(__name__)
db = Prisma()
db.connect()
register(db)


@app.route("/")
def home():
    readme_link = "<a href='https://github.com/polyapi/poly-alpha/blob/main/science/README.md'>README</a>"
    return f"<h1>Hello, World!</h1>\n<div>You probably want `POST /function_completion`! See the {readme_link} for details"


@app.route("/function-completion", methods=["POST"])  # type: ignore
def function_completion() -> Dict:
    data: Dict = request.get_json(force=True)
    question: str = data["question"].strip()
    user_id: Optional[int] = data.get("user_id")
    assert user_id
    resp = get_completion_or_conversation_answer(user_id, question)
    if is_vip_user(user_id):
        log(f"VIP USER {user_id}", resp, sep="\n")

    return resp


@app.route("/function-description", methods=["POST"])
def function_description() -> Response:
    data: DescInputDto = request.get_json(force=True)
    return jsonify(get_function_description(data))


@app.route("/clear-conversation", methods=["POST"])
def clear_conversation_view() -> str:
    user_id = request.get_json(force=True)["user_id"]
    user_id = int(user_id)
    clear_conversation(user_id)
    return "Conversation Cleared"


@app.route("/configure", methods=["POST"])
def configure() -> Tuple[str, int]:
    data = request.get_json(force=True)
    name = data['name']
    value = data['value']
    try:
        set_config_variable(name, value)
    except ValueError:
        return f"Invalid config variable name: {name}", 400

    return "Configured", 201


@app.route("/error")
def error():
    raise OpenAIError("This is an error")


@app.errorhandler(OpenAIError)
def handle_exception(e):
    # now you're handling non-HTTP exceptions only
    msg = f"Sadly, OpenAI appears to be down. Please try again later. ({e.__class__.__name__})"
    app.log_exception(msg)
    return msg, 500


if __name__ == "__main__":
    app.run(port=5000)
