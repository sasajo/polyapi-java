#!/usr/bin/env python3
import sys
from prisma import Prisma


def show_conversation(user_id: int):
    db = Prisma()
    db.connect()
    msgs = db.conversationmessage.find_many(
        where={"userId": user_id}, order={"created": "asc"}
    )
    for msg in msgs:
        print(msg.content)
        print()


if __name__ == "__main__":
    show_conversation(int(sys.argv[1]))
