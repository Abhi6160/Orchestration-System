import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest

from app.database import Database


@pytest.fixture()
def db(tmp_path):
    """A fresh, empty SQLite database per test (seeding skipped by using a bare Database)."""
    database = Database(db_path=str(tmp_path / "test.sqlite"))
    yield database
    database.close()
