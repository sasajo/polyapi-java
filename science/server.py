#!/usr/bin/env python3
import csv
from typing import List
import openai
from flask import Flask, request
from prisma import Prisma, register

app = Flask(__name__)
db = Prisma()
db.connect()
register(db)


@app.route("/")
def home():
    readme_link = "<a href='https://github.com/polyapi/poly-alpha/blob/main/train/README.md'>README</a>"
    return f"<h1>Hello, World!</h1>\n<div>You probably want `POST /function_completion`! See the {readme_link} for details"


@app.route("/function-completion", methods=['POST'])  # type: ignore
def function_completion():
    # question = "how do I get a list of flights for a specific user?"
    question = request.get_json(force=True)['question']
    functions = get_functions_from_db()
    print(functions)
    return

    resp = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "assistant", "content": functions},
            {"role": "user", "content": question},
        ],
    )
    return resp['choices'][0]["message"]["content"]


def get_functions_from_db() -> str:
    preface = "Given the following functions,"
    parts: List[str] = [preface]

    for func in db.polyfunction.find_many():
        import ipdb; ipdb.set_trace()
        print(func)
    # with open("./data/toy.csv") as f:
    #     reader = csv.reader(f)
    #     for row in reader:
    #         code = row[0]
    #         comment = row[1]

    #         if code == "Code":
    #             # skip the header
    #             continue

    #         parts.append(f"// {comment}\n{code}")
    return ""

    return "\n\n".join(parts)


def get_functions_from_file() -> str:
    preface = "Given the following functions,"
    parts: List[str] = [preface]

    with open("./data/toy.csv") as f:
        reader = csv.reader(f)
        for row in reader:
            code = row[0]
            comment = row[1]

            if code == "Code":
                # skip the header
                continue

            parts.append(f"// {comment}\n{code}")

    return "\n\n".join(parts)


if __name__ == "__main__":
    # app.run(debug=True, port=5000, host='0.0.0.0')
    get_functions_from_db()