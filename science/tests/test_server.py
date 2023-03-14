from .testing import DbTestCase
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


class T(DbTestCase):
    def test_foo(self) -> None:
        user = test_user_get_or_create(self.db)
        self.assertEqual(user.name, "test")
        self.assertEqual("foo", "foo")
