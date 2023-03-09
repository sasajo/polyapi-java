import unittest


class T(unittest.TestCase):
    def test_foo(self):
        self.assertEqual("foo", "foo")