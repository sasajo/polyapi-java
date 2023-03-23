#!/usr/bin/env python3
import sys
from prisma import Prisma, register, get_client


def show_conversation(user_id: int):
    db = get_client()
    msgs = list(
        db.conversationmessage.find_many(
            where={"userId": user_id}, order={"createdAt": "asc"}
        )
    )
    for msg in msgs:
        print(msg.content)
        print()


if __name__ == "__main__":
    db = Prisma()
    db.connect()
    register(db)
    show_conversation(int(sys.argv[1]))
