import unittest
from load_fixtures import test_user_get_or_create
from prisma import Prisma, register


class T(unittest.TestCase):
    def setUp(self):
        # HACK this will reuse the local db for now
        db = Prisma()
        db.connect()
        register(db)
        self.db = db

    def test_foo(self) -> None:
        user = test_user_get_or_create(self.db)
        self.assertEqual(user.name, "test")
        self.assertEqual("foo", "foo")

    def tearDown(self):
        self.db.disconnect()
