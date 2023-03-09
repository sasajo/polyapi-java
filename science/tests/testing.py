import unittest
from prisma import Prisma


class DbTestCase(unittest.TestCase):
    def setUp(self):
        # HACK this will reuse the local db for now
        self.db = Prisma()
        self.db.connect()

    def tearDown(self):
        self.db.disconnect()