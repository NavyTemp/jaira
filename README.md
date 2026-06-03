# Task Management System

A full-stack task-management application:

- **Backend** — Node.js + Express 5 + MongoDB (Mongoose). RESTful API for users, teams, tasks, chats, comments, notifications. Lives in [`backend/`](./backend).
- **Frontend** — React 19 + Vite 8 + TypeScript + Tailwind CSS v4. Feature-based folder structure. Lives in [`frontend/`](./frontend).

> Status: **work in progress** — see [ROADMAP.md](./ROADMAP.md) for the full phased plan.

---

## Repository layout

```
Task Management System/
├── package.json              # root scripts (concurrently) — no app code here
├── .gitignore
├── README.md                 # this file
├── ROADMAP.md                # phased plan from MVP → production
│
├── backend/                  # Express + MongoDB API
│   ├── package.json
│   ├── index.js              # entry — loads env, boots Express
│   └── src/
│       ├── app.controller.js
│       ├── config/.env       # local secrets (not committed)
│       ├── DB/
│       ├── models/
│       ├── modules/          # user.controller.js + user.service.js + team/
│       ├── middleware/
│       ├── service/          # mail templates + transport
│       └── utlis/            # encrypt / token / events / enums (sic — kept name)
│
└── frontend/                 # React SPA
    ├── package.json
    ├── vite.config.ts        # @-alias + /api → :3000 dev proxy
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css         # Tailwind v4 import
        ├── lib/              # apiClient, authStorage, queryClient, cn
        ├── components/       # ui/  +  layout/
        ├── routes/           # router + ProtectedRoute
        └── features/         # one folder per backend module
            ├── auth/ users/ teams/ tasks/
            ├── comments/ chats/ notifications/
```

Each app has its **own `package.json` and `node_modules`**. The root `package.json` only carries cross-app scripts via `concurrently`.

---

## Quick start

### 1. Install everything (first time only)

```bash
npm run install:all
```

This installs the root dev-deps plus runs `npm install` inside `backend/` and `frontend/`.

### 2. Configure backend env

Edit `backend/src/config/.env` (already in `.gitignore` — never commit it):

```env
port=3000
DB_URL=mongodb://127.0.0.1:27017/task-management-system
salt=10
secret_key=replace_me_with_a_long_random_string
BERFIX_USER=bearer
BERFIX_ADMIN=admin
SIGNATURE_USER=replace_me_user_signature
SIGNATURE_ADMIN=replace_me_admin_signature
EMAIL=you@gmail.com
PASSWORD=your_app_password
```

> Frontend env (`frontend/.env`) is optional. When `VITE_API_URL` is unset, the Vite dev server proxies `/api/*` → `http://localhost:3000` (see `frontend/vite.config.ts`), so CORS is a non-issue in dev.

### 3. Run both apps with one command

```bash
npm run dev
```

This launches **backend on http://localhost:3000** and **frontend on http://localhost:5173** in parallel, with prefixed colored logs (`backend` in yellow, `frontend` in cyan).

Need only one side?

```bash
npm run dev:backend     # only the API
npm run dev:frontend    # only the SPA
```

---

## Available scripts (root)

| Command | Description |
|---|---|
| `npm run dev` | Run backend and frontend concurrently |
| `npm run dev:backend` | Run backend dev server only (nodemon) |
| `npm run dev:frontend` | Run frontend dev server only (Vite) |
| `npm run start:backend` | Run backend with plain `node` (no nodemon) |
| `npm run build:frontend` | Production build of the frontend |
| `npm run install:all` | Install root + backend + frontend dependencies |

For commands not in the root file, drop into the sub-package directly:

```bash
cd backend  && npm <something>
cd frontend && npm <something>
```

---

## Documentation

- [`backend/README.md`](./backend/README.md) — backend folder layout, env vars, auth flow, data models, API reference, validation layer.
- [`frontend/README.md`](./frontend/README.md) — frontend stack, folder conventions, auth flow, how to add a feature.
- [`ROADMAP.md`](./ROADMAP.md) — full phase-by-phase implementation plan.

---

## Backend API reference (current routes)

> Base URL: `http://localhost:3000`

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Healthcheck |
| `POST` | `/users/signup` | Create a new user |
| `POST` | `/users/login` | Authenticate, get access + refresh tokens |

### Protected (require `Authorization` header)

The frontend's `apiClient` automatically attaches `Authorization: <prefix> <token>` where:
- `prefix = bearer` for `role: user`
- `prefix = admin`  for `role: admin`

| Method | Path | Description |
|---|---|---|
| `GET`    | `/users/getuser/:id`     | (admin) Get one user by id |
| `GET`    | `/users/getusers`        | (admin) Get all users |
| `POST`   | `/users/upDateOneuser`   | Update current user's profile |
| `POST`   | `/users/refreshToken`    | Issue a new access/refresh pair |
| `POST`   | `/users/upEmail`         | Change current user's email |
| `DELETE` | `/users/deleteuser`      | Soft-delete current user |
| `POST`   | `/teams/createTeam`      | Create a team (stub — needs auth + import fixes) |

See [`ROADMAP.md`](./ROADMAP.md) for routes planned in upcoming phases (tasks, chats, comments, notifications, OTP).

---

## Tech stack

| Layer | Backend | Frontend |
|---|---|---|
| Runtime | Node.js (ESM) | Browser |
| Framework | Express ^5.2 | React ^19 |
| Language | JavaScript | TypeScript ~6 |
| DB / persistence | MongoDB (Mongoose ^9) | localStorage (auth) |
| Auth | jsonwebtoken + bcrypt | axios interceptor + ProtectedRoute |
| Validation | zod ^4 | zod ^4 + react-hook-form |
| Styling | — | Tailwind CSS v4 |
| Routing | Express Router | react-router-dom ^7 |
| Data fetching | — | @tanstack/react-query ^5 |
| Email | nodemailer ^8 | — |
| Encryption | crypto-js ^4 (AES phone) | — |

---

## Known issues / technical debt

See [ROADMAP.md › Phase 1](./ROADMAP.md) for the full list. Highlights:

- `backend/src/modules/user.service.js > refreshToken` returns an undefined variable (`refresh_tokenqw`).
- `backend/src/app.controller.js` 404 handler uses `req.originalurl` (lowercase `u`).
- `backend/src/modules/team/team.service.js` does not import `TeamModel`.
- `backend/src/modules/team/team.controller.js` is missing the `authentication` middleware.
- `backend/src/middleware/multer.js` and `authoritation.js` are empty placeholders.
- Folder typos: `utlis` (should be `utils`), `vaildation` (should be `validation`). Kept for now to avoid breaking imports — to be renamed in a dedicated cleanup pass.

---

## Contributing

1. Pick a phase from [ROADMAP.md](./ROADMAP.md).
2. Backend changes live in `backend/src/`. Frontend changes live in `frontend/src/`.
3. Keep each backend module in the 3-file shape: `*.controller.js`, `*.service.js`, `*.vaildation.js`.
4. Keep each frontend feature in `frontend/src/features/<name>/` with `types.ts`, `api/`, and `pages/`.
5. Never commit `.env` files or `node_modules/`.
