from unittest.mock import patch, Mock
from description import get_function_description
from .testing import DbTestCase


class T(DbTestCase):
    @patch("description.openai.ChatCompletion.create")
    def test_get_function_description(self, mock_chat: Mock):
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
