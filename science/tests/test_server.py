from .testing import DbTestCase
from load_fixtures import test_user_get_or_create


class T(DbTestCase):
    def test_foo(self) -> None:
        user = test_user_get_or_create(self.db)
        self.assertEqual(user.name, "test")
        self.assertEqual("foo", "foo")
