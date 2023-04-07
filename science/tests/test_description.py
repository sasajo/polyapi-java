from unittest.mock import patch
from app.description import _parse_function_description, get_function_description
from .testing import DbTestCase


class T(DbTestCase):
    @patch("app.description.openai.ChatCompletion.create")
    def test_get_function_description(self, mock_chat):
        mock_chat.return_value = {'choices': [{'message': {'content': 'Name: foobar'}}]}
        output = get_function_description(
            {
                "url": "https://example.com",
                "method": "POST",
                "short_description": "Create a thing",
            }
        )
        self.assertEqual(mock_chat.call_count, 1)
        self.assertEqual(output['name'], 'foobar')

    def test_parse_function_description(self):
        completion = """Context:
        comms.mailchimp
        Name:
        mailchimp.getMembers
        Description:
        This API call retrieves a list of members subscribed..."""
        parsed = _parse_function_description(completion)
        self.assertEqual(parsed['context'], 'comms.mailchimp')
        self.assertEqual(parsed['name'], 'mailchimp.getMembers')
        self.assertEqual(parsed['description'], 'This API call retrieves a list of members subscribed...')