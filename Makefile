.PHONY: all dev run setup test test-backend test-frontend lint lint-backend lint-frontend format format-backend format-frontend build seed clean help

SHELL := /usr/bin/env bash

# Default target
all: dev

help:
	@echo "Assess Development Commands:"
	@echo "  make dev             Run both backend (port 8000) and frontend (port 5173)"
	@echo "  make setup           Install dependencies for backend (uv) and frontend (bun)"
	@echo "  make test            Run both backend and frontend test suites"
	@echo "  make test-backend    Run backend pytest tests"
	@echo "  make test-frontend   Run frontend vitest tests"
	@echo "  make lint            Run linters on both backend (ruff) and frontend (oxlint)"
	@echo "  make format          Format both backend (ruff) and frontend (prettier)"
	@echo "  make build           Build frontend production bundle"
	@echo "  make seed            Seed backend database with demo users and assignments"
	@echo "  make clean           Clean caches, temporary test artifacts, and build folders"

dev:
	@echo "Starting Assess development servers..."
	@echo "Backend API:  http://localhost:8000 (Swagger: http://localhost:8000/docs)"
	@echo "Frontend App: http://localhost:5173"
	@echo "Press Ctrl+C to stop both servers."
	@trap 'trap - INT TERM; echo ""; echo "Stopping servers..."; kill 0 2>/dev/null; exit 0' INT TERM; \
	(cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) & \
	(cd frontend && bun run dev) & \
	wait

run: dev

setup:
	@echo "Setting up backend dependencies..."
	cd backend && uv sync
	@echo "Setting up frontend dependencies..."
	cd frontend && bun install

test: test-backend test-frontend

test-backend:
	cd backend && uv run pytest

test-frontend:
	cd frontend && bun run test

lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend with ruff..."
	cd backend && uv run ruff check .

lint-frontend:
	@echo "Linting frontend with oxlint..."
	cd frontend && bun run lint

format: format-backend format-frontend

format-backend:
	@echo "Formatting backend with ruff..."
	cd backend && uv run ruff format . && uv run ruff check --fix .

format-frontend:
	@echo "Formatting frontend with prettier..."
	cd frontend && bun run format

build:
	cd frontend && bun run build

seed:
	cd backend && uv run python -m app.seed

clean:
	@echo "Cleaning cache and build artifacts..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".coverage" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf frontend/dist frontend/dist-ssr backend/dist
	@find . -type d -name ".vite" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".vitest" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean completed."
