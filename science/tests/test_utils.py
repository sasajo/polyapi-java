from .testing import DbTestCase
from load_fixtures import load_functions, test_user_get_or_create
from utils import FunctionDto, func_args, store_message

FUNC: FunctionDto = {
    "id": "60062c03-dcfd-437d-832c-6cba9543f683",
    "name": "gMapsGetXy",
    "context": "shipping",
    "description": "",
    "arguments": [
        {"name": "location", "type": "string"},
        {"name": "GAPIKey", "type": "string"},
    ],
    "returnType": None,
}


class T(DbTestCase):
    def test_func_args(self):
        user = test_user_get_or_create(self.db)
        load_functions(self.db, user)

        args = func_args(FUNC)
        self.assertEqual(len(args), 2)
        self.assertEqual(args[0], "location: string")
        self.assertEqual(args[1], "GAPIKey: string")

    def test_store_message(self):
        user = test_user_get_or_create(self.db)
        msg = store_message(self.db, user.id, {"role": "user", "content": "profound question"})
        self.assertEqual(msg.userId, user.id)
        self.assertEqual(msg.content, "profound question")