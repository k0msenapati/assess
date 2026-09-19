# Assess Backend

The backend for Assess is a REST API and evaluation service built with FastAPI, SQLModel, SQLite, LangGraph, ChromaDB, and Groq (Qwen 3.8-27B).

It handles user authentication, role-based access control (Student, Professor, Admin), rubric management, document parsing, semantic search, and automated grading workflows.

## Setup

### Prerequisites
- Python 3.13+
- uv package manager

### Installation
```bash
cd backend
uv sync
```

### Environment Configuration
Create or configure your .env file in the backend directory:

```env
SECRET_KEY="your-secure-random-jwt-secret"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///assess.db"
CHROMA_PERSIST_DIRECTORY="./chroma_data"
GROQ_API_KEY="gsk_your_groq_api_key_here"
GROQ_MODEL="qwen/qwen3.8-27b"
```

### Seed Initial Data
Initialize the database and vector store with sample users, assignments, and submissions:

```bash
uv run python -m app.seed
```

Default accounts:
- Professor: prof_alan / securepassword123
- Student: student_ada / securepassword123
- Administrator: sys_admin / adminpassword123

## Running

Start the FastAPI application with Uvicorn:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Base URL: http://localhost:8000
- OpenAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

Run all backend tests with Pytest:

```bash
uv run pytest tests/unit tests/integration tests/api tests/e2e
```

### Test Suites Included
- Unit tests (tests/unit/): Data models, role validation, AST chunking, document processing, evaluator logic, and metrics calculation.
- Integration tests (tests/integration/): LangGraph pipeline, ChromaDB vector store, failure recovery, and evaluation audit history.
- API tests (tests/api/): Admin management, rubric CRUD endpoints, submission uploads, evaluation review, and RBAC security.
- End-to-end tests (tests/e2e/): Student journey, professor journey, and admin journey.
