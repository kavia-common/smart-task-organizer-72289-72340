# Todo Frontend (React)

A modern, minimalistic React UI for the Smart Task Organizer. It communicates with the Flask backend over HTTP and uses cookie-based sessions.

Contents:
- Environment variables
- Connecting to the backend
- Local development setup
- Troubleshooting common issues

## Environment variables

Create a `.env` file in this directory using `.env.example` as a starting point.

- REACT_APP_API_BASE: Base URL for API requests from the browser. The frontend API client defaults to "/api" if not provided, but for local dev you typically set the full backend URL, e.g.:
  - REACT_APP_API_BASE=http://localhost:5000

Note: Create React App (react-scripts) will inline variables prefixed with REACT_APP_ at build time.

## Connecting to the backend

Backend base URL:
- If the backend runs at http://localhost:5000, set:
  - REACT_APP_API_BASE=http://localhost:5000

Session cookies and CORS:
- The frontend API client sends requests with credentials: "include" for cookie-based sessions.
- Ensure the backend allows your frontend origin via FRONTEND_ORIGIN (see backend README).
- For HTTPS scenarios with cross-site cookies, configure backend cookie attributes appropriately:
  - SESSION_COOKIE_SAMESITE=None
  - SESSION_COOKIE_SECURE=True

## Local development setup

Prerequisites:
- Node.js 18+

Steps:
1) Ensure the backend is up and the database is running
   - Follow backend README to start `todo_database` first and then the Flask backend.

2) Configure frontend .env
   - Copy .env.example to .env
   - Set REACT_APP_API_BASE to your backend origin, e.g.:
     REACT_APP_API_BASE=http://localhost:5000

3) Install and start
   - cd smart-task-organizer-72289-72340/todo_frontend
   - npm install
   - npm start
   - Open http://localhost:3000

## Troubleshooting

- 401 Not authenticated or login not persisting:
  - Verify backend is reachable at REACT_APP_API_BASE/auth/me.
  - Cookies require matching CORS and cookie settings. Ensure:
    - Backend FRONTEND_ORIGIN includes http://localhost:3000
    - If using HTTPS on the frontend, you may need SESSION_COOKIE_SAMESITE=None and SESSION_COOKIE_SECURE=True on the backend.

- Network error or CORS error in browser console:
  - Check that REACT_APP_API_BASE is correct and backend is running.
  - Backend CORS must not use "*" when credentials are included. Set specific origins via FRONTEND_ORIGIN.

- API path mismatch:
  - The client prepends REACT_APP_API_BASE to paths like /auth/login, /tasks, etc. If you proxy or mount API behind /api, update REACT_APP_API_BASE accordingly (e.g. http://localhost:5000/api).

## Project structure (frontend)

- src/api/client.js: API client reading REACT_APP_API_BASE; sends credentials; exposes login/logout/me and task/subtask methods.
- src/components/*: UI components for login, lists, details, forms.
- src/App.js, src/App.css: App shell and layout/theme.

## Notes

- The UI currently uses simple username-based login form. Backend ignores password in the reference implementation.
- For production, enforce HTTPS, secure cookies, and proper backend authentication.
