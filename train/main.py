#!/usr/bin/env python3
from prisma import Prisma


def main() -> None:
    db = Prisma()
    db.connect()

    # write your queries here
    print("foo")
    for func in db.polyfunction.find_many():
        print(func)

    db.disconnect()

if __name__ == '__main__':
    main()
