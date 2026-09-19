import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from app.main import app
from app.api.deps import get_db

TEST_DB_URL = "sqlite:///./test_assess.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    SQLModel.metadata.create_all(test_engine)
    yield
    if os.path.exists("./test_assess.db"):
        os.remove("./test_assess.db")


@pytest.fixture
def session():
    with Session(test_engine) as session:
        yield session


@pytest.fixture
def client(session: Session):
    def get_session_override():
        yield session

    app.dependency_overrides[get_db] = get_session_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
