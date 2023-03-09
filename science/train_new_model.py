#!/usr/bin/env python3
from pathlib import Path
import json
import openai
from prisma import Prisma, register
from .server import get_base_prompt

db = Prisma()
db.connect()
register(db)


def transform_to_jsonl() -> str:
    data = []
    base_prompt = get_base_prompt()
    for func in db.polyfunction.find_many(where={"NOT": {"description": ""}}):  # type: ignore
        parts = [base_prompt, f"how do I {func.description}?"]
        # TODO get completion
        data.append({"prompt": "\n\n".join(parts), "completion": ""})

    abs_path = Path(__file__).parent
    jsonl_path = (abs_path / "data/examples.jsonl").resolve()
    with open(jsonl_path, "w") as f:
        for d in data:
            f.write(json.dumps(d))
            f.write("\n")

    print(f"CSV processed and written to {jsonl_path}")
    return str(jsonl_path)


def start_fine_tune() -> None:
    abs_path = Path(__file__).parent
    jsonl_path = (abs_path / "data/examples.jsonl").resolve()
    upload = openai.File.create(file=open(jsonl_path, "rb"), purpose="fine-tune")
    resp = openai.FineTune.create(training_file=upload.id, model="davinci")
    print("To follow the model and see when it's done, please run the following:")
    print(f"openai api fine_tunes.follow -i {resp['id']}")


if __name__ == "__main__":
    # STEP 1, run this:
    transform_to_jsonl()

    # STEP 2
    # add completion data to the jsonl

    # STEP 3
    # start_fine_tune()


# TODO replace transforming the CSV to jsonl and uploading that
# with transforming the contents of the DB to jsonl and uploading that?
# async function main() {
#   async function getUntrained(): Promise<PolyFunction[]> {
#     const rv = prisma.polyFunction.findMany();
#     return rv;
#   }

#   async function markAsTrained(id: number) {
#     await prisma.polyFunction.update({
#       where: {
#         id: id,
#       },
#       data: {
#         trained: false,
#       },
#     });
#   }

#   async function train() {
#     const funcs = await getUntrained();
#     console.log(`Now training on ${funcs.length} functions...`);
#     for (const func of funcs) {
#       //openai.Completion.create(
#       // prompt=prompt,
#       // engine="text-davinci-..."
#       // send to chatGPT
#       // on success:
#       await markAsTrained(func.id);
#     }
#   }

#   train();
# }