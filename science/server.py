#!/usr/bin/env python3
from typing import List
from flask import Flask, request
from prisma import Prisma, register
from utils import func_path_with_args, get_function_completion_answer, get_function_completion_question


app = Flask(__name__)
db = Prisma()
db.connect()
register(db)


@app.route("/")
def home():
    readme_link = "<a href='https://github.com/polyapi/poly-alpha/blob/main/science/README.md'>README</a>"
    return f"<h1>Hello, World!</h1>\n<div>You probably want `POST /function_completion`! See the {readme_link} for details"


@app.route("/function-completion", methods=["POST"])  # type: ignore
def function_completion():
    question = get_function_completion_question(
        request.get_json(force=True)["question"]
    )
    base_prompt = get_base_prompt()
    return get_function_completion_answer(base_prompt, question)


def get_base_prompt() -> str:
    preface = "Here are the functions in the Poly API library,"
    parts: List[str] = [preface]

    # for func in db.polyfunction.find_many(where={"NOT": {"description": ""}}):  # type: ignore
    for func in db.polyfunction.find_many():  # type: ignore
        parts.append(f"// {func.description}\n{func_path_with_args(func)}")

    return "\n\n".join(parts)


if __name__ == "__main__":
    # handy for testing
    # comment out app.run!
    # print(get_base_prompt())
    app.run(port=5000)
