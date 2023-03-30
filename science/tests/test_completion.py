from mock import Mock, patch
from load_fixtures import test_user_get_or_create
from completion import (
    NO_FUNCTION_ANSWER,
    answer_processing,
    get_conversations_for_user,
    get_function_message_dict,
    get_webhook_message_dict,
)
from .testing import DbTestCase

GET_FUNCTIONS = [
    {
        "id": "f7588018-2364-4586-b60d-b08a285f1ea3",
        "name": "getAccuweatherGetlocation",
        "context": "",
        "description": "I am the description",
        "arguments": [
            {"name": "locationId", "type": "string", "payload": False},
            {"name": "AAPIKey", "type": "string", "payload": False},
        ],
    },
    {
        "id": "60062c03-dcfd-437d-832c-6cba9543f683",
        "name": "gMapsGetXy",
        "context": "shipping",
        "description": "get the X and Y coordinates of a location from Google Maps",
        "arguments": [
            {"name": "location", "type": "string", "payload": True},
            {"name": "GAPIKey", "type": "string", "payload": False},
        ],
    },
]

GET_WEBHOOKS = [
    {
        "id": "4005e0b5-6071-4d67-96a5-405b4d09492f",
        "name": "packageDelivered",
        "context": "shipping",
        "eventType": "interface ShippingPackageDeliveredEventType {\n    content: ShippingPackageDeliveredEvent TypeContent;\n}\n\ninterface ShippingPackageDeliveredEventTypeContent {\n    eventname: string;\n    newCount:  number;\n}\n",
        "urls": [
            "https://staging.polyapi.io/webhook/4005e0b5-6071-4d67-96a5-405b4d09492f",
            "https://staging.polyapi.io/webhook/shipping/packageDelivered",
        ],
    }
]


class T(DbTestCase):
    def test_get_conversations_for_user(self) -> None:
        user = test_user_get_or_create()
        self.db.functiondefined.delete_many()
        self.db.webhookdefined.delete_many()
        self.db.conversationmessage.delete_many(where={"userId": user.id})

        messages = get_conversations_for_user(user.id)
        self.assertEqual(messages, [])

        msg = self.db.conversationmessage.create(
            data={"userId": user.id, "content": "first", "role": "user"}
        )
        messages = get_conversations_for_user(user.id)
        self.assertEqual(messages, [msg])

    def test_answer_processing(self) -> None:
        user = test_user_get_or_create()
        answer = "Unfortunately, the Poly API library doesn't have a function specifically for getting a list of draft orders in Shopify."
        choice = {
            "message": {"role": "assistant", "content": answer},
            "finish_reason": "stop",
            "index": 0,
        }
        resp = answer_processing(user.id, choice)
        self.assertEqual(resp, NO_FUNCTION_ANSWER)

    @patch("completion.requests.get")
    def test_get_function_message_dict(self, requests_get: Mock) -> None:
        requests_get.return_value = Mock(status_code=200, json=lambda: GET_FUNCTIONS)

        d = get_function_message_dict()
        self.assertEqual(requests_get.call_count, 1)
        self.assertIn("Here are some functions", d["content"])
        self.assertEqual(
            d["function_ids"],
            [
                "f7588018-2364-4586-b60d-b08a285f1ea3",
                "60062c03-dcfd-437d-832c-6cba9543f683",
            ],
        )

    @patch("completion.requests.get")
    def test_get_function_message_dict_keywords(self, requests_get: Mock) -> None:
        requests_get.return_value = Mock(status_code=200, json=lambda: GET_FUNCTIONS)

        keywords = "how do I find the x and y coordinates of a Google Map?".split(" ")
        d = get_function_message_dict(keywords=keywords)
        self.assertEqual(requests_get.call_count, 1)
        self.assertIn("Here are some functions", d["content"])
        self.assertEqual(
            d["function_ids"],
            [
                "60062c03-dcfd-437d-832c-6cba9543f683",
            ],
        )

    @patch("completion.requests.get")
    def test_get_webhook_message_dict(self, requests_get: Mock) -> None:
        requests_get.return_value = Mock(status_code=200, json=lambda: GET_WEBHOOKS)

        d = get_webhook_message_dict()
        self.assertEqual(requests_get.call_count, 1)
        self.assertTrue(d["content"].startswith("Here are some event handlers"))
        self.assertIn("poly.shipping.packageDelivered", d["content"])
        self.assertEqual(d["webhook_ids"], ["4005e0b5-6071-4d67-96a5-405b4d09492f"])
