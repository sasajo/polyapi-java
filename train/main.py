#!/usr/bin/env python3
import os
import openai
from prisma import Prisma

# TODO get from env variables
OPENAI_TEMPERATURE = 0
OPENAI_TOP_P = 1


def main() -> None:
    db = Prisma()
    db.connect()

    # write your queries here
    # for func in db.polyfunction.find_many():
    #     print(func)

    openai.api_key = os.getenv("OPENAI_API_KEY")
    prompt = "how do I get bacon ipsum?"
    response = openai.Completion.create(
        model="davinci:ft-poly-api-2023-02-25-01-33-45",
        prompt=f'From Poly API, {prompt}',
        temperature=OPENAI_TEMPERATURE,
        max_tokens=300,
        top_p=OPENAI_TOP_P,
        frequency_penalty=0,
        presence_penalty=0
    )
    print(response['choices'][0]['text'])

    db.disconnect()


if __name__ == "__main__":
    main()
