# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Backend for a full-stack MERN authentication system (see `../PRD.md` for the complete spec). The frontend (React + Tailwind) lives outside this `backend/` directory and is not yet present in the repo. Server bootstrapping, DB connection, shared error-handling utilities, and the `auth` feature module's data layer (model + validation) exist. Auth business logic (controllers/services/middlewares/routes) is scaffolded as empty files but not yet implemented — nothing is mounted in `app.js` yet.

Planned auth capabilities (from PRD): registration with email verification, login issuing short-lived access tokens + long-lived `httpOnly` refresh token cookies, refresh-token rotation, logout, forgot/reset password — all via `POST /api/auth/*` routes. Validation uses **Zod** (`zod` is installed; the PRD's mention of Joi is stale — always check `package.json` rather than trusting the PRD on this). `bcrypt`, `jsonwebtoken`, and `nodemailer` are installed as dependencies but not yet wired into any code — check current usage before assuming token/hashing/email logic exists.

## Commands

Run from `backend/`:
- `npm run dev` — start the server (`node src/server.js`)
- `npm run watch` — start with `node --watch` for auto-restart on file changes
- No test suite is configured yet (`npm test` is a placeholder that exits with an error)

There is no lint/build step configured.

## Architecture

- ESM throughout (`"type": "module"` in `package.json`) — use `import`/`export`, not `require`.
- Entry point split: `src/server.js` loads env vars, connects to MongoDB via `connectDB()`, then starts the Express app exported from `src/app.js`. `src/app.js` only wires global middleware (json/urlencoded body parsing, `cookie-parser`, `cors` with `credentials: true`, `morgan('dev')`) — it has no routes mounted yet.
- `src/common/` holds cross-cutting code shared by feature modules:
  - `configs/db.config.js` — Mongoose connection setup.
  - `middlewares/errorMiddleware.js` — single global error handler; expects to be registered last in `app.js`. Normalizes any thrown error into an `ApiError`-shaped JSON response and logs unexpected (non-operational) errors.
  - `middlewares/validateZod.js` — `validate(schema)` factory returning an Express middleware that runs `schema.safeParse(req.body)`; on failure responds `400` with flattened field errors directly (not via the `ApiError`/error-handler path), on success replaces `req.body` with the parsed/transformed data.
  - `utils/apiError.js` — `ApiError` class with static factory methods (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `internalServerError`) that set `statusCode` and `isOperational = true`. Throw these (or subclasses) from controllers/services instead of raw `Error`.
  - `utils/apiResponse.js` — `ApiResponse` class with static helpers (`ok`, `created`, `noContent`) for consistent success-response shapes (`{ success, message, data }`).
  - `utils/asyncHandler.js` — wraps async route handlers so rejected promises are forwarded to `next(err)` instead of requiring try/catch in every controller.
- `src/modules/auth/` is the first (and so far only) feature module, following a routes → controllers → services layering with the model kept separate:
  - `auth.model.js` — Mongoose `User` model: `name`/`email`/`password` (password has `select: false`), `isEmailVerified` + hashed verification token/expiry, hashed password-reset token/expiry, and a `refreshTokenHash` array (each entry `{ tokenHash, expiresAt, createdAt }`) supporting multiple concurrent sessions per user. All sensitive fields use `select: false` so they're excluded from queries by default.
  - `auth.validation.js` — Zod schemas: `signupSchema` (name/email/password/confirmPassword, `.strict()`, password requires upper/lower/number/special char and refines that `password === confirmPassword`) and `loginSchema` (email + non-empty password, deliberately looser than signup). Meant to be used with `common/middlewares/validateZod.js`.
  - `auth.controllers.js`, `auth.services.js`, `auth.middlewares.js`, `auth.routes.js` — created but currently empty; this is where signup/login/refresh/logout/password-reset logic and route wiring still need to be built.
- When adding new feature modules, mirror the `modules/auth/` file split (`*.routes.js`, `*.controllers.js`, `*.services.js`, `*.validation.js`, `*.model.js`) rather than putting logic directly in `app.js`.

## Environment variables

Documented in `.env.example`: `PORT`, `MONGO_URI`, `CORS_ORIGIN`. `bcrypt`, `jsonwebtoken`, and `nodemailer` are already in `package.json` but not yet used anywhere, so their config (JWT secrets/expiries, SMTP credentials) hasn't been added to `.env.example` yet — add it there when that code lands, without committing real secrets.
