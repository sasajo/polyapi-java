#!/usr/bin/env python3
import sys
from science.completion import get_conversations_for_user


def show_conversation(user_id: int):
    msgs = get_conversations_for_user(user_id)
    for msg in msgs:
        print(msg.content)
        print()


if __name__ == "__main__":
    show_conversation(int(sys.argv[1]))
