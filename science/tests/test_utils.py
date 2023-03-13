from .testing import DbTestCase
from load_fixtures import load_functions, test_user_get_or_create
from utils import func_args


class T(DbTestCase):
    def test_func_args(self):
        user = test_user_get_or_create(self.db)
        load_functions(self.db, user)

        func = self.db.polyfunction.find_first(where={'name': 'unitedAirlines.getFlights'})
        assert func
        args = func_args(func)
        self.assertEqual(len(args), 2)
        self.assertEqual(args[0], "guestID")
        self.assertEqual(args[1], "status")

