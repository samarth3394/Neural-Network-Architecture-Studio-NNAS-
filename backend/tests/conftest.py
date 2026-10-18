import pytest
from app.db.init_db import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Initializes database schema and seed records before running tests.
    """
    init_db()
