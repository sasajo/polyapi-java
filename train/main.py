#!/usr/bin/env python3
import os
import openai
from prisma import Prisma


def main() -> None:
    db = Prisma()
    db.connect()

    # write your queries here
    print("foo")
    for func in db.polyfunction.find_many():
        print(func)

    openai.api_key = os.getenv("OPENAI_API_KEY")
    response = openai.Completion.create(
        model="code-davinci-002",
        prompt='"""1. Create a list of first names\n2. Create a list of last names\n3. Combine them randomly into a list of 100 full names\n"""',
        temperature=0,
        max_tokens=300,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    print(response)

    db.disconnect()


if __name__ == "__main__":
    main()
