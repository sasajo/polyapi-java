#!/usr/bin/env python3
from typing import List
import openai
from flask import Flask, request
from prisma import Prisma, register

from utils import full_func_path

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
    # question = "how do I get a list of flights for a specific user?"
    question = "From Poly, " + request.get_json(force=True)["question"]
    functions = get_functions_from_db()

    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "assistant", "content": functions},
            {"role": "user", "content": question},
        ],
    )
    return resp["choices"][0]["message"]["content"]


def get_functions_from_db() -> str:
    preface = "Given the following Poly functions,"
    parts: List[str] = [preface]

    # for func in db.polyfunction.find_many(where={"NOT": {"description": ""}}):  # type: ignore
    for func in db.polyfunction.find_many():  # type: ignore
        parts.append(f"// {func.description}\n{full_func_path(func)}")

    return "\n\n".join(parts)


if __name__ == "__main__":
    app.run(port=5000)
