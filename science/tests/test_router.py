from .testing import DbTestCase
from app.router import split_route_and_question


class T(DbTestCase):
    def test_split_route_and_question_f(self):
        original = "/f get list products"
        route, question = split_route_and_question(original)
        self.assertEqual(route, "function")
        self.assertEqual(question, "get list products")

    def test_split_route_and_question_d(self):
        original = "/d teach function"
        route, question = split_route_and_question(original)
        self.assertEqual(route, "documentation")
        self.assertEqual(question, "teach function")

    def test_split_route_and_question_h(self):
        original = "/h"
        route, question = split_route_and_question(original)
        self.assertEqual(route, "help")
        self.assertEqual(question, "")