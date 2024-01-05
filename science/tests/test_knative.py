from typing import Dict
from unittest import TestCase
from flask import Request


def _get_args(request: Request) -> Dict:
    return request.get_json()


class T(TestCase):
    def test_get_args(self):
        request = Request.from_values(json={"foo": "bar"})
        self.assertEqual(_get_args(request), {"foo": "bar"})
