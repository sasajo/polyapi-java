#!/usr/bin/env python3
from pathlib import Path
import csv
import json
import openai


def transform_to_jsonl() -> str:
    prefix = "For Poly API, "
    data = []
    with open("./data/examples.csv") as f:
        reader = csv.reader(f)
        for row in reader:
            answer = row[0]
            prompt = row[1]

            if answer == "Answer":
                # skip the header
                continue

            data.append({"prompt": prefix + prompt, "completion": answer})

    abs_path = Path(__file__).parent
    jsonl_path = (abs_path / "data/examples.jsonl").resolve()

    with open(jsonl_path, "w") as f:
        for d in data:
            f.write(json.dumps(d))
            f.write("\n")

    print(f"CSV processed and written to {jsonl_path}")
    return str(jsonl_path)


def main() -> None:
    jsonl_path = transform_to_jsonl()
    upload = openai.File.create(file=open(jsonl_path, "rb"), purpose="fine-tune")
    resp = openai.FineTune.create(training_file=upload.id, model="davinci:ft-poly-api-2023-02-25-01-33-45")
    print("To follow the model and see when it's done, please run the following:")
    print(f"openai api fine_tunes.follow -i {resp['id']}")


if __name__ == "__main__":
    main()
