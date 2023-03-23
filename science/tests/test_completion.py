from load_fixtures import test_user_get_or_create
from completion import NO_FUNCTION_RESPONSE, answer_processing, get_conversations_for_user
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

    def test_answer_processing(self) -> None:
        answer = "Unfortunately, the Poly API library doesn't have a function specifically for getting a list of draft orders in Shopify."
        resp = answer_processing(answer)
        self.assertEqual(resp, NO_FUNCTION_RESPONSE)