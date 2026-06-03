# Backend — Task Management System

REST API built with **Node.js (ESM), Express 5, and MongoDB (Mongoose)**.
This is the API server consumed by the React frontend in `../frontend`.

> Status: **work in progress** — only the User module is fully wired. Team is a stub. Tasks / Chats / Comments / Notifications / OTP have models but no controllers yet. See [`../ROADMAP.md`](../ROADMAP.md) for the full plan.

---

## Quick start

```bash
# from the monorepo root
npm --prefix backend install   # or:  cd backend && npm install
npm --prefix backend run dev   # nodemon on http://localhost:3000
```

A healthcheck route is at `GET /`.

---

## Folder layout

```
backend/
├── index.js                      # entry — loads env, boots Express
├── package.json
└── src/
    ├── app.controller.js         # boot fn: middlewares, routes, error handler
    ├── config/
    │   └── .env                  # local secrets (not committed)
    ├── DB/
    │   └── connection.js         # Mongoose connection
    ├── models/
    │   ├── user.model.js
    │   ├── team.model.js
    │   ├── task.model.js
    │   ├── chat.model.js
    │   ├── message.model.js
    │   ├── comment.model.js
    │   ├── notification.model.js
    │   ├── otp.js
    │   └── revokedtoken.model.js
    ├── modules/
    │   ├── user.controller.js    # /users routes
    │   ├── user.service.js
    │   ├── user.vaildation.js    # Zod schemas
    │   └── team/
    │       ├── team.controller.js
    │       ├── team.service.js
    │       └── team.validation.js
    ├── middleware/
    │   ├── authentaction.js      # JWT auth middleware
    │   ├── vaildation.js         # Zod validation middleware
    │   ├── authoritation.js      # (empty — planned RBAC)
    │   └── multer.js             # (empty — planned uploads)
    ├── service/
    │   ├── modemailer.js         # Nodemailer transport
    │   ├── codeTemplite.js       # Email-confirmation HTML
    │   └── otp.templite.js       # OTP HTML
    └── utlis/
        ├── genralRules.js        # password + phone regex
        ├── genral_emun.js        # userRole / userGender / userStatus enums
        ├── encrypt/encrypt.js    # bcrypt + AES helpers
        ├── events/events.js      # EventEmitter (email side effects)
        └── token/
            ├── token.js          # JWT sign / verify wrappers
            └── roleSecret.js     # picks signature key per role
```

> **Note on folder names:** `utlis` and `vaildation` are kept as-is to avoid breaking existing imports. They'll be renamed to `utils` and `validation` in a dedicated cleanup pass.

---

## Environment variables

Create `src/config/.env` (the path is hard-coded in `index.js`):

```env
port=3000
DB_URL=mongodb://127.0.0.1:27017/task-management-system

# bcrypt rounds
salt=10

# AES key for phone encryption
secret_key=replace_me_with_a_long_random_string

# Authorization-header prefix expected per role
BERFIX_USER=bearer
BERFIX_ADMIN=admin

# JWT signing keys (use strong, distinct values in production)
SIGNATURE_USER=replace_me_user_signature
SIGNATURE_ADMIN=replace_me_admin_signature

# Nodemailer (Gmail App Password)
EMAIL=you@gmail.com
PASSWORD=your_app_password
```

`.env` is git-ignored from the repo root.

---

## NPM scripts

| Command | Description |
|---|---|
| `npm start` | Boot with `node index.js` |
| `npm run dev` | Boot with `nodemon` for auto-reload |

You can also run these from the monorepo root:

```bash
npm run dev:backend
npm run start:backend
```

---

## Authentication & authorization

### Issuing tokens
On login, two JWTs are signed with the role-appropriate signature:

- `access_token` — expires in `1Y`
- `refresh_token` — expires in `30d`

Each token carries `{ userId, email, userrole }` and a `jti` (nanoid) used for revocation.

### Sending tokens
`authentication` middleware reads the header:

```
Authorization: <prefix> <token>
```

- `prefix = bearer` (`BERFIX_USER`) — for `user`
- `prefix = admin`  (`BERFIX_ADMIN`) — for `admin`

It picks the matching signature, verifies, checks the `RevokedToken` collection, loads the user, and sets `req.user` + `req.decoded`.

### Logout
Inserts the token's `jti` into the `RevokedToken` collection so the token is rejected on subsequent requests.

---

## API reference

> Base URL: `http://localhost:3000`

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Healthcheck |
| `POST` | `/users/signup` | Create a new user |
| `POST` | `/users/login` | Authenticate, get access + refresh tokens |

### Protected (need `Authorization` header)

| Method | Path | Description |
|---|---|---|
| `GET`    | `/users/getuser/:id` | (admin) Get one user by id |
| `GET`    | `/users/getusers` | (admin) Get all users |
| `POST`   | `/users/upDateOneuser` | Update current user's profile |
| `POST`   | `/users/refreshToken` | Issue a new access/refresh pair |
| `POST`   | `/users/upEmail` | Change current user's email |
| `DELETE` | `/users/deleteuser` | Soft-delete current user |
| `POST`   | `/teams/createTeam` | Create a team (stub — needs fixes from ROADMAP Phase 1/3) |

### Sample request — signup

```http
POST /users/signup
Content-Type: application/json

{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "Aa1@aaaa",
  "confirmpassword": "Aa1@aaaa",
  "phone": "01012345678",
  "age": 25,
  "gender": "male",
  "role": "user"
}
```

### Sample request — login + use token

```http
POST /users/login
{ "email": "ahmed@example.com", "password": "Aa1@aaaa" }
```

Response:

```json
{
  "message": "login success",
  "access_token": "<jwt>",
  "refresh_token": "<jwt>"
}
```

Subsequent calls:

```http
GET /users/getusers
Authorization: bearer <access_token>
```

---

## Data models (summary)

### User
`name, email (unique), password, confirmpassword, image{secure_url,public_id}, phone, role(user|admin), gender(male|female), status(active|inactive), isDeleted, deletedBy, age(10..100), confirm, teams[]`

### Team
`name, description, ownerId → User, members[{user → User, role(member|admin)}], tasksId[ → Task], chat → Chat`

### Task
`title, description, status(todo|in_progress|review|done), priority(low|medium|high|urgent), dueDate, createdBy → User, assignedTo → User, team → Team, chat → Chat, attachments[{url,type}], tags[]`

### Chat
`type(team|task|direct), team → Team, task → Task, participants[ → User], lastMessage → Message`

### Message
`chat → Chat, sender → User, text, attachments[{url,type}], seenBy[ → User]`

### Comment
`text, task → Task, user → User`

### Notification
`user → User, message, type(task|team|chat|system), isRead, relatedId`

### Otp
`email, otp, purpose(VERIFY_EMAIL|RESET_PASSWORD|LOGIN), expiresAt, isUsed, attempts`

### RevokedToken
`tokenId (= JWT jti), expireAt`

---

## Validation layer

All validation uses **Zod** schemas defined per module (e.g. `src/modules/user.vaildation.js`) and applied via the `validation(schema)` middleware. The schema object can carry up to three keys:

```js
{ body: ZodSchema, params: ZodSchema, query: ZodSchema }
```

Errors are aggregated into a single `400` response:

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "invalid email" }
  ]
}
```

Built-in rules (`src/utlis/genralRules.js`):

- **Password:** ≥ 8 chars, at least one lowercase, uppercase, digit, and special character (`@$!%*?&`).
- **Egyptian phone:** `^(010|011|012|015)[0-9]{8}$`.

---

## Email & events

- `src/service/modemailer.js` — Nodemailer Gmail transport.
- `src/service/codeTemplite.js` — account-confirmation HTML template.
- `src/service/otp.templite.js` — OTP HTML template.
- `src/utlis/events/events.js` — `EventEmitter` for fire-and-forget side effects.

> `events.js` currently has bugs (top-level code referencing undefined `isSend`, missing file extensions in imports). These are tracked in [ROADMAP Phase 1](../ROADMAP.md) and must be fixed before email flows are wired into the controllers.

---

## Known issues / technical debt

See [`../ROADMAP.md`](../ROADMAP.md) for the full list. Highlights:

- **`refreshToken` crash:** returns undefined `refresh_tokenqw` (typo).
- **404 handler typo:** `req.originalurl` should be `req.originalUrl`.
- **`req.user._id` destructuring:** several services destructure `id`/`userId` from `req.user._id`, which is an ObjectId (a value) — not an object.
- **`team.service.js`** does not import `TeamModel`.
- **`team.controller.js`** does not apply `authentication`, so `req.user._id` is undefined.
- **`roleSecret.js`** has a malformed `else` (no-op statement).
- **`updateUser`** comment says "decrypt" but the code re-encrypts the phone.
- **`refresh_token` in `login`** is signed with `SIGNATURE_USER` for both branches due to a typo.
- **`authoritation.js`** and **`multer.js`** are empty placeholders.
- **Folder typos:** `utlis` (should be `utils`), `vaildation` (should be `validation`).
- **No tests, no API docs (Swagger), no structured logging, no rate-limiting, no CORS/Helmet** yet.
