import json
import unittest
from unittest.mock import patch, Mock
from app.description import (
    _parse_openai_response,
    get_argument_descriptions,
    get_function_description,
    get_variable_description,
    get_webhook_description,
)
from app.typedefs import ChatCompletionResponse, MessageDict
from .testing import DbTestCase


class T(DbTestCase):
    @patch("app.description.openai.ChatCompletion.create")
    def test_get_function_description(self, mock_chat):
        mock_content = {"description": "foobar", "name": "foo", "context": "ba-r"}
        mock_chat.return_value = {
            "choices": [{"message": {"content": json.dumps(mock_content)}}]
        }
        output = get_function_description(
            {
                "url": "https://example.com",
                "method": "POST",
                "short_description": "Create a thing",
            }
        )
        self.assertEqual(mock_chat.call_count, 1)
        self.assertEqual(output["name"], "foo")
        self.assertEqual(output["context"], "baR")
        self.assertEqual(output["description"], "foobar")

    @patch("app.description.openai.ChatCompletion.create")
    def test_get_webhook_description(self, mock_chat):
        mock_content = {"description": "foobar", "name": "foo", "context": "ba-r"}
        mock_chat.return_value = {
            "choices": [{"message": {"content": json.dumps(mock_content)}}]
        }
        output = get_webhook_description(
            {
                "url": "https://example.com",
                "method": "POST",
                "short_description": "Create a thing",
            }
        )
        self.assertEqual(mock_chat.call_count, 1)
        self.assertEqual(output["name"], "foo")
        self.assertEqual(output["context"], "baR")
        self.assertEqual(output["description"], "foobar")

    @patch("app.description.openai.ChatCompletion.create")
    def test_get_variable_description(self, mock_chat):
        mock_content = {"description": "foobar"}
        mock_chat.return_value = {
            "choices": [{"message": {"content": json.dumps(mock_content)}}]
        }
        output = get_variable_description(
            {
                "name": "fromPhoneNumber",
                "context": "messaging.twilio",
                "secret": False,
                "value": "+18033697",
            }
        )
        self.assertEqual(mock_chat.call_count, 1)
        self.assertEqual(output["description"], "foobar")

    @unittest.skip("Old approach not asking OpenAI to return JSON")
    def test_parse_function_description(self):
        completion = """Context:
        comms.mailchimp
        Name:
        mailchimp.getMembers
        Description:
        This API call retrieves a list of members subscribed..."""
        parsed = _parse_openai_response(completion)
        self.assertEqual(parsed["context"], "comms.mailchimp")
        self.assertEqual(parsed["name"], "mailchimp.getMembers")
        self.assertEqual(
            parsed["description"],
            "This API call retrieves a list of members subscribed...",
        )

    @patch("app.description.openai.ChatCompletion.create")
    def test_get_argument_descriptions(self, chat_create: Mock):
        completion = """Sure! Here is the JSON:

        ```
        [{"name": "toNumber", "description": "The number to which the message will be sent, including country code."}]
        ```
"""
        chat_create.return_value = ChatCompletionResponse(
            choices=[
                {
                    "message": MessageDict(role="assistant", content=completion),
                    "index": 0,
                    "finish_reason": "stop",
                }
            ]
        )

        arguments = get_argument_descriptions(
            "sms.messaging",
            "twilio",
            "send a message",
            [{"name": "toNumber", "type": {"kind": "primitive", "type": "string"}}],
        )
        self.assertEqual(
            arguments[0]["description"],
            "The number to which the message will be sent, including country code.",
        )

    # def test_get_contexts_and_names(self):
    #     user = test_user_get_or_create
    #     load_functions(user)
    #     contexts = _get_context_and_names()
    #     self.assertIn("hospitality.opera.getHotelDetails", contexts)
    #     self.assertIn("travel.unitedAirlines.getFlights", contexts)
