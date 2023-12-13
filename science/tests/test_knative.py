from typing import Dict
from unittest import TestCase
from flask import Request


# this
def _get_args(request: Request) -> Dict:
    print("foo")
    return {}


class T(TestCase):
    def test_get_args(self):
        self.assertEqual(_get_args(None), None)
