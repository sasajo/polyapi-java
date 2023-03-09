#!/usr/bin/env python3
import csv
from typing import List, TypedDict
from prisma import Prisma, register
from prisma.models import User
from utils import full_func_path


class FunctionDict(TypedDict):
    context: str
    alias: str
    description: str


def _get_data_list():
    rv = []
    with open("./data/fixtures.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rv.append(row)
    return rv


def test_user_get_or_create(db: Prisma) -> User:
    user = db.user.find_first(where={"name": "test"})
    if not user:
        user = db.user.create(data={"name": "test", "apiKey": "asdf", "role": "ADMIN"})
    return user


def load_fixtures(db=None) -> None:
    if not db:
        # if no passed db, use default db
        db = Prisma()
        db.connect()
        register(db)

    # create User
    user = db.user.find_first(where={"role": "ADMIN"})
    if not user:
        print("Admin user not found. Please run Poly server first for initialization.")
        return

    data_list: List[FunctionDict] = _get_data_list()
    for data in data_list:
        func = db.polyfunction.find_first(where={"description": data['description']})
        if not func:
            func = db.polyfunction.create(
                data={
                    "context": data["context"],
                    "alias": data["alias"],
                    "description": data["description"],
                    "userId": user.id,
                    # TODO: fix the url and method setup
                    "url": "https://baconipsum.com/api/?type=meat-and-filler",
                    "method": "GET"
                }
            )
            print(f"Created {full_func_path(func)}")

    db.disconnect()


if __name__ == "__main__":
    load_fixtures()
