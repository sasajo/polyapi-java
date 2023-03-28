import uuid
from .testing import DbTestCase
from load_fixtures import load_functions, test_user_get_or_create
from utils import FunctionDto, func_args, func_path, store_message

FUNC: FunctionDto = {
    "id": "60062c03-dcfd-437d-832c-6cba9543f683",
    "name": "gMapsGetXy",
    "context": "shipping",
    "description": "",
    "arguments": [
        {"name": "location", "type": "string", "payload": True},
        {"name": "GAPIKey", "type": "string", "payload": False},
    ],
    "returnType": None,
}


class T(DbTestCase):
    def test_load_fixtures(self) -> None:
        # smoke test to make sure this works
        user = test_user_get_or_create()
        load_functions(user)

    def test_func_path(self) -> None:
        user = test_user_get_or_create()
        data = {
            "userId": user.id,
            "name": "twilio.sendSMS",
            "context": "messaging",
            "description": "send SMS",
            "method": "POST",
            "url": "https://poly.messaging.twilio.sendSMS",
        }
        self.assertEqual(func_path(data), "poly.messaging.twilio.sendSMS")

    def test_func_args(self):
        args, payload = func_args(FUNC)
        self.assertEqual(len(args), 1)
        self.assertEqual(args[0], "GAPIKey: string")
        self.assertEqual(payload, {"location": "string"})

    def test_store_message(self):
        user = test_user_get_or_create()

        function_ids = [uuid.uuid4().hex]
        webhook_ids = [uuid.uuid4().hex]
        msg = store_message(
            user.id,
            {
                "role": "user",
                "content": "profound question",
                "function_ids": function_ids,
                "webhook_ids": webhook_ids,
            },
        )
        self.assertEqual(msg.userId, user.id)
        self.assertEqual(msg.content, "profound question")

        msg = self.db.conversationmessage.find_first(
            where={"id": msg.id}, include={"functions": True, "webhooks": True}
        )
        self.assertEqual(function_ids, [f.functionPublicId for f in msg.functions])
        self.assertEqual(webhook_ids, [w.webhookPublicId for w in msg.webhooks])
