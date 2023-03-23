from load_fixtures import test_user_get_or_create
from completion import get_conversations_for_user
from .testing import DbTestCase


class T(DbTestCase):
    def test_get_conversations_for_user(self) -> None:
        user = test_user_get_or_create()
        self.db.conversationmessage.delete_many(where={"userId": user.id})

        messages = get_conversations_for_user(user.id)
        self.assertEqual(messages, [])

        msg = self.db.conversationmessage.create(
            data={"userId": user.id, "content": "first", "role": "user"}
        )
        messages = get_conversations_for_user(user.id)
        self.assertEqual(messages, [msg])
