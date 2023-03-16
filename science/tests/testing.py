import unittest
from prisma import Prisma
from server import app as flask_app


class DbTestCase(unittest.TestCase):
    # TODO replace with testing flask_app that uses test db
    app = flask_app

    def setUp(self):
        self.client = self.app.test_client()

        # HACK this will reuse the local db for now
        self.db = Prisma()
        self.db.connect()

    def tearDown(self):
        self.db.disconnect()