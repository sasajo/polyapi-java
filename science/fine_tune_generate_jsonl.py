#!/usr/bin/env python3
from pathlib import Path
import json
from prisma import Prisma
from utils import (
    get_function_completion_answer,
    get_function_completion_question,
)
from server import get_base_prompt

db = Prisma()
db.connect()
# HACK why this no work?
# register(db)


def transform_to_jsonl() -> str:
    data = []
    base_prompt = get_base_prompt()
    for func in db.urlfunction.find_many(where={"NOT": {"description": ""}}):  # type: ignore
        question = get_function_completion_question(f"how do I {func.description}?")
        parts = [base_prompt, question]
        prompt = "\n\n".join(parts)
        data.append(
            {
                "prompt": prompt,
                "completion": get_function_completion_answer(base_prompt, question),
            }
        )

    abs_path = Path(__file__).parent
    jsonl_path = (abs_path / "data/examples.jsonl").resolve()
    with open(jsonl_path, "w") as f:
        for d in data:
            f.write(json.dumps(d))
            f.write("\n")

    print(f"training data processed and written to {jsonl_path}")
    return str(jsonl_path)


if __name__ == "__main__":
    transform_to_jsonl()