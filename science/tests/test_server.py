from mock import patch, Mock
from openai.error import ServiceUnavailableError

from .testing import DbTestCase

# TODO make relative?
from description import DescInputDto
from server import _clear_conversation
from completion import get_webhook_prompt
from load_fixtures import test_user_get_or_create

GET_FUNCTIONS = [
    {
        "id": "f7588018-2364-4586-b60d-b08a285f1ea3",
        "name": "getAccuweatherGetlocation",
        "context": "",
        "description": "I am the description",
        "arguments": [
            {"name": "locationId", "type": "string"},
            {"name": "AAPIKey", "type": "string"},
        ],
        "returnType": None,
    },
    {
        "id": "60062c03-dcfd-437d-832c-6cba9543f683",
        "name": "gMapsGetXy",
        "context": "shipping",
        "description": "",
        "arguments": [
            {"name": "location", "type": "string"},
            {"name": "GAPIKey", "type": "string"},
        ],
        "returnType": None,
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
    def test_user_get_or_create(self) -> None:
        user = test_user_get_or_create(self.db)
        self.assertEqual(user.name, "test")
        self.assertEqual("foo", "foo")

    @patch("completion.requests.get")
    def test_get_webhook_prompt(self, requests_get: Mock) -> None:
        requests_get.return_value = Mock(status_code=200, json=lambda: GET_WEBHOOKS)

        prompt = get_webhook_prompt()
        self.assertEqual(requests_get.call_count, 1)
        self.assertTrue(prompt.startswith("Here are the event handlers"))
        self.assertIn("poly.shipping.packageDelivered", prompt)
        print(prompt)

    def test_clear_conversation(self):
        user = test_user_get_or_create(self.db)
        data = {
            "userId": user.id,
            "role": "user",
            "content": "how do I get the status of a united flight?",
        }
        msg = self.db.conversationmessage.create(data=data)

        # clearing other user id shouldn't delete this msg
        _clear_conversation(-1)
        self.assertTrue(self.db.conversationmessage.find_first(where={"id": msg.id}))

        # clearing this user id should clear it
        _clear_conversation(user.id)
        self.assertFalse(self.db.conversationmessage.find_first(where={"id": msg.id}))

    @patch("server.get_function_completion_answer")
    def test_function_completion_error(self, get_answer: Mock) -> None:
        # setup
        get_answer.side_effect = ServiceUnavailableError("The server is overloaded or not ready yet.")
        mock_input: DescInputDto = {
            "question": "hi world",
        }

        # execute
        resp = self.client.post("/function-completion", json=mock_input)

        # test
        self.assertEqual(get_answer.call_count, 1)
        self.assertEqual(resp.status_code, 500)
        print(resp.text)

    @patch("description.openai.ChatCompletion.create")
    def test_function_description(self, chat_create: Mock) -> None:
        # setup
        mock_output = "Context: booking.reservations\nName: createReservation\nDescription: This API call..."
        chat_create.return_value = {
            "choices": [{"message": {"content": mock_output}}]
        }
        mock_input: DescInputDto = {
            "url": "http://example.com",
            "method": "GET",
            "short_description": "I am the description",
            "payload": "I am the payload",
            "response": "I am the response",
        }

        # execute
        resp = self.client.post("/function-description", json=mock_input)

        # test
        self.assertEqual(chat_create.call_count, 1)
        output = resp.get_json()
        self.assertEqual(output["context"], "booking.reservations")
        self.assertEqual(output["name"], "createReservation")
        self.assertEqual(output["description"], "This API call...")
