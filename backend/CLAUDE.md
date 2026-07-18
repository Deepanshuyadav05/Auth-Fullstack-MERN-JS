# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Backend for a full-stack MERN authentication system (see `../PRD.md` for the complete spec). The frontend (React + Tailwind) lives outside this `backend/` directory and is not yet present in the repo. This backend is early-stage: server bootstrapping, DB connection, and shared error-handling utilities exist, but no auth routes/controllers/models have been implemented yet.

Planned auth capabilities (from PRD, not yet built): registration with email verification, login issuing short-lived access tokens + long-lived `httpOnly` refresh token cookies, refresh-token rotation, logout, forgot/reset password — all via `POST /api/auth/*` routes. Validation is intended to use Joi (per PRD) even though `package.json` currently has no validation library installed — check what's actually installed before assuming Joi/Zod is available.

## Commands

Run from `backend/`:
- `npm run dev` — start the server (`node src/server.js`)
- `npm run watch` — start with `node --watch` for auto-restart on file changes
- No test suite is configured yet (`npm test` is a placeholder that exits with an error)

There is no lint/build step configured.

## Architecture

- ESM throughout (`"type": "module"` in `package.json`) — use `import`/`export`, not `require`.
- Entry point split: `src/server.js` loads env vars, connects to MongoDB via `connectDB()`, then starts the Express app exported from `src/app.js`. `src/app.js` only wires global middleware (json/urlencoded body parsing, `cookie-parser`, `cors` with `credentials: true`, `morgan('dev')`) — it has no routes mounted yet.
- `src/common/` holds cross-cutting code shared by future feature modules:
  - `configs/db.config.js` — Mongoose connection setup.
  - `middlewares/errorMiddleware.js` — single global error handler; expects to be registered last in `app.js`. Normalizes any thrown error into an `ApiError`-shaped JSON response and logs unexpected (non-operational) errors.
  - `utils/apiError.js` — `ApiError` class with static factory methods (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `internalServerError`) that set `statusCode` and `isOperational = true`. Throw these (or subclasses) from controllers/services instead of raw `Error`.
  - `utils/apiResponse.js` — `ApiResponse` class with static helpers (`ok`, `created`, `noContent`) for consistent success-response shapes (`{ success, message, data }`).
  - `utils/asyncHandler.js` — wraps async route handlers so rejected promises are forwarded to `next(err)` instead of requiring try/catch in every controller.
- No feature (auth) modules exist yet under `src/`; when adding them, follow the existing `common/` layering convention (routes → controllers → services, with DB models separate) rather than putting logic directly in `app.js`.

## Environment variables

Documented in `.env.example`: `PORT`, `MONGO_URI`, `CORS_ORIGIN`. The PRD implies more will be needed as auth features land (JWT secrets, token expiries, SMTP credentials for `nodemailer`) — add them to `.env.example` when introduced, without committing real secrets.
