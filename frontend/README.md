# Assess Frontend

The frontend for Assess is a single-page application built with React 19, Vite, TanStack Router, TanStack Query, TanStack Table, TanStack Form, and Tailwind CSS v4.

It includes dual-theme support (Dark and Light) and two distinct layouts:
1. Standalone Landing Page: Product showcase with an interactive code preview and live rubric matching.
2. Dashboard Application: A clean workspace with a left sidebar navigation and no header or footer.

## Setup

### Prerequisites
- Bun (recommended) or Node.js 20+

### Installation
```bash
cd frontend
bun install
```

## Running

### Development Server
Starts the Vite dev server with proxy routing that forwards /api requests to http://localhost:8000:

```bash
bun run dev
```

Application URL: http://localhost:5173

### Production Build
Typechecks TypeScript and builds production assets:

```bash
bun run build
```

The output bundle is created in the dist directory.

### Preview Production Build
```bash
bun run preview
```

## Testing

Run the frontend test suite with Vitest:

```bash
bun run test
```

### Test Suites Included
- theme_and_layout.test.ts: Dark and light theme switching, role-based navigation filters, authenticity checks, and clear terminology.
- frontend_workflows.test.ts: Rubric constraints, file extension validation, user roles, rubric CRUD API calls, evaluation status, and admin functions.
- types_and_models.test.ts: TypeScript interface shapes and validation rules.
- api_client.test.ts: Axios client, authentication headers, and error handling.
- evaluation_logic.test.ts: Line citation parsing and score adjustment delta calculations.
