# Task Management System — Roadmap

A phase-by-phase plan to take the project from its current "User-only" state to a complete, production-ready task-management backend.

Each phase is **independently shippable** and ordered so that later phases depend only on earlier ones. Pick them in order unless the dependency note says otherwise.

---

## Legend

- [x] done
- [ ] not started
- ~~strikethrough~~ removed from scope
- **Effort:** rough estimate in working days (1 dev)

---

## Phase 0 — Project state (snapshot)

What exists today:

- Express boot, Mongoose connection, env loading
- Models: `User`, `Team`, `Task`, `Chat`, `Message`, `Comment`, `Notification`, `Otp`, `RevokedToken`
- User module: signup, login, get-one, get-all, update profile, update email, soft-delete, refresh-token, logout (controller wires only the first 7)
- Team module: model + a single stubbed `createTeam` route (broken — missing import + no auth)
- Middleware: `authentication`, `validation`
- Helpers: bcrypt + AES, JWT sign/verify, role-aware secret picker, password/phone regex, enums
- Email plumbing: Nodemailer wrapper, confirm + OTP HTML templates, EventEmitter shell

What's missing: everything else (Tasks, Chats, Messages, Comments, Notifications, OTP flows, uploads, authorization, real-time, tests, docs, deployment).

---

## Phase 1 — Stabilization & bug fixes ⚠

**Goal:** make the code that already exists actually work end-to-end. Nothing new — just fix the bugs that block today's features.

**Effort:** ~1 day.

- [x] Fix `app.controller.js` 404 handler: `req.originalurl` → `req.originalUrl`.
- [x] Fix `user.service.js > refreshToken`: returns undefined `refresh_tokenqw` (typo).
- [x] Fix `user.service.js > login`: the **refresh token's** admin branch signs with `SIGNATURE_USER` (copy-paste bug) — should be `SIGNATURE_ADMIN`.
- [x] Fix `user.service.js > getUsers` / `getOneuser`: `const { id } = req.user._id` is wrong — `req.user._id` is an `ObjectId`, not an object. Use `req.user._id` directly.
- [x] Fix `user.service.js > updateUser`: variable named `decryptedPhone` is actually re-encrypting; rename + clarify intent.
- [x] Fix `user.service.js > signup`: drop the redundant `await user.save()` after `UserModel.create(...)`.
- [x] Fix `team.service.js`: import `TeamModel`.
- [x] Fix `team.controller.js`: add `authentication` middleware to `createTeam`.
- [x] Fix `utlis/token/roleSecret.js`: the `else (role === "admin") { ... }` was a no-op — rewrote as proper `if/else` returning `SIGNATURE_ADMIN` / `SIGNATURE_USER`.
- [x] Fix `utlis/events/events.js`: renamed import, removed top-level stray code, added `.js` extensions.
- [x] Replace the destructive `app.use("{/*demo}", ...)` 404 with `app.use((req,res)=>...)`.
- [x] Add a `.env.example` next to `src/config/.env`.
- [x] Add `cors` middleware.
- [x] Fix `utlis/encrypt/encrypt.js`: undeclared `cr_phone` / `de_phone` variables.
- [x] Fix `user.vaildation.js > updateUserSchema`: `age` and `gender` fields were outside the `body` object.
- [x] Wire `logout` route in `user.controller.js`.

**Done = `npm run dev` boots, all current routes work without crashing, and login → protected route → refresh → logout is a clean happy path.**

---

## Phase 2 — Authorization (RBAC) middleware

**Goal:** stop scattering `if (user.role !== 'admin')` checks across services.

**Effort:** ~0.5 day.

- [ ] Implement `src/middleware/authoritation.js` (rename file to `authorization.js`) exporting `authorize(...roles)`:
  ```js
  export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
  ```
- [ ] Replace inline admin checks in `getUsers`, `getOneuser`, `deleteUser` (the admin-protection branch) with `authorize(userRole.admin)` on the route.
- [ ] Add `authorize` to every new route from Phase 3 onward.

**Dependency:** Phase 1.

---

## Phase 3 — Complete the Team module

**Goal:** make Teams a first-class resource so Tasks and Chats can attach to them.

**Effort:** ~1.5 days.

Routes (mounted at `/teams`, all require `authentication`):

| Method | Path | Who | Action |
|---|---|---|---|
| POST | `/teams` | any user | create team (caller becomes owner) |
| GET | `/teams/me` | any user | list teams I own or belong to |
| GET | `/teams/:id` | member or owner | get one team (populate members) |
| PATCH | `/teams/:id` | owner | rename / change description |
| DELETE | `/teams/:id` | owner | delete the team (cascade tasks & chat) |
| POST | `/teams/:id/members` | owner | add member by userId, set role (`member`/`admin`) |
| PATCH | `/teams/:id/members/:userId` | owner | change member role |
| DELETE | `/teams/:id/members/:userId` | owner | remove member |
| POST | `/teams/:id/leave` | member | leave team (owner cannot leave) |

- [ ] Build `team.validation.js` (currently empty).
- [ ] Build `team.service.js` for all routes above.
- [ ] Keep the `User.teams[]` array in sync on join / leave / remove (use `$addToSet` / `$pull`).
- [ ] When a team is created, also create its `Chat` of type `team` and store its `_id` on the team.

**Dependency:** Phases 1, 2.

---

## Phase 4 — Task module 🎯

**Goal:** the core feature of the product.

**Effort:** ~2.5 days.

Routes (mounted at `/tasks`, all require `authentication`):

| Method | Path | Action |
|---|---|---|
| POST | `/tasks` | create a task (in a team or personal) |
| GET | `/tasks` | list mine (filter: `?status=&priority=&team=&assignedTo=&dueBefore=&dueAfter=`) |
| GET | `/tasks/:id` | get one (must be creator / assignee / team member) |
| PATCH | `/tasks/:id` | update (title, description, priority, dueDate, tags) |
| PATCH | `/tasks/:id/status` | change status (`todo / in_progress / review / done`) |
| PATCH | `/tasks/:id/assign` | reassign to another user |
| DELETE | `/tasks/:id` | delete (creator or team admin) |

- [ ] Build `src/modules/task/task.controller.js`, `task.service.js`, `task.validation.js`.
- [ ] Add `Task` indexes on `team`, `assignedTo`, `status`, `dueDate` for the list filters.
- [ ] Pagination on `GET /tasks` (`?page=&limit=`, default `10`).
- [ ] When a task is created inside a team, push its id into `Team.tasksId` and create the per-task `Chat` of type `task`.
- [ ] When the assignee changes, emit a `task:assigned` event (consumed by Phase 8 → Notifications).

**Dependency:** Phases 1–3.

---

## Phase 5 — Comments on tasks

**Goal:** discussion thread on each task without needing chat.

**Effort:** ~0.5 day.

Routes (mounted at `/tasks/:taskId/comments`):

| Method | Path | Action |
|---|---|---|
| POST | `/` | add a comment (must be team member / assignee / creator) |
| GET | `/` | list comments for a task (paginated) |
| PATCH | `/:commentId` | edit (author only) |
| DELETE | `/:commentId` | delete (author or team admin) |

- [ ] Build `src/modules/comment/` (controller / service / validation).
- [ ] Emit a `task:commented` event for Phase 8.

**Dependency:** Phases 1–4.

---

## Phase 6 — OTP + email flows

**Goal:** verified accounts and password reset.

**Effort:** ~1.5 days.

Routes (mounted at `/auth`):

| Method | Path | Action |
|---|---|---|
| POST | `/auth/send-otp` | issue OTP (`purpose: VERIFY_EMAIL / RESET_PASSWORD / LOGIN`) |
| POST | `/auth/verify-otp` | confirm OTP (sets `user.confirm = true` for verify-email) |
| POST | `/auth/forgot-password` | send a `RESET_PASSWORD` OTP |
| POST | `/auth/reset-password` | consume the OTP and set a new password |

- [ ] Generate 6-digit OTP, store **hashed**, set `expiresAt = now + 10 min`.
- [ ] Cap `attempts` at 5; lock the OTP after that.
- [ ] After successful signup, automatically trigger `eventEmitter.emit("sendEmail", { email, code, userName })`.
- [ ] Block login (or limit to a "pending verification" state) when `user.confirm === false`.
- [ ] Use the existing templates in `src/service/codeTemplite.js` and `otp.templite.js`.

**Dependency:** Phases 1 (the events module must boot cleanly first).

---

## Phase 7 — File uploads

**Goal:** profile images + task attachments.

**Effort:** ~1 day.

- [ ] Implement `src/middleware/multer.js` (currently empty) with disk + memory variants and a MIME-type whitelist.
- [ ] Decide storage:
  - **Local** (default): files under `uploads/`, served via `express.static`.
  - **Cloudinary** (recommended for prod): add `cloudinary` SDK + helper in `src/service/cloudinary.js`.
- [ ] New routes:
  - `POST /users/upload-image` — sets `user.image.{secure_url, public_id}`
  - `DELETE /users/delete-image`
  - `POST /tasks/:id/attachments` — pushes into `task.attachments[]`
  - `DELETE /tasks/:id/attachments/:attachmentId`
- [ ] Enforce per-file size (e.g. 5 MB) and per-task attachment count.

**Dependency:** Phases 1, 4.

---

## Phase 8 — Notifications

**Goal:** in-app notifications for the events emitted by Phases 4 & 5.

**Effort:** ~1 day.

Routes (mounted at `/notifications`):

| Method | Path | Action |
|---|---|---|
| GET | `/` | list mine (paginated, `?unread=true` filter) |
| PATCH | `/:id/read` | mark one as read |
| PATCH | `/read-all` | mark everything as read |
| DELETE | `/:id` | delete one |

- [ ] Add event listeners in `events.js` for `task:assigned`, `task:commented`, `team:member-added`, etc., each creating a `Notification` row.
- [ ] Bulk-create notifications when a team-wide event fires (one row per member).

**Dependency:** Phases 1, 4, 5.

---

## Phase 9 — Chat & messaging (REST first)

**Goal:** team chat, per-task chat, and direct messages — REST only at this stage.

**Effort:** ~2 days.

Routes (mounted at `/chats`):

| Method | Path | Action |
|---|---|---|
| GET | `/` | list my chats (sorted by `lastMessage.updatedAt`) |
| POST | `/direct` | create-or-fetch a direct chat with `{ userId }` |
| GET | `/:id` | get chat metadata + participants |
| GET | `/:id/messages` | paginated messages (cursor-based: `?before=<messageId>&limit=20`) |
| POST | `/:id/messages` | send a message (text + optional attachments) |
| PATCH | `/:id/messages/:msgId/seen` | mark message seen (push my id into `seenBy`) |

- [ ] `team` chats are auto-created in Phase 3, `task` chats in Phase 4 — chat creation here is only for `direct`.
- [ ] Update `chat.lastMessage` on every send.
- [ ] Authorization: only `participants` can read or post.

**Dependency:** Phases 1–4.

---

## Phase 10 — Real-time layer (Socket.IO)

**Goal:** push messages and notifications instantly.

**Effort:** ~1.5 days.

- [ ] Add `socket.io`; mount on the same HTTP server.
- [ ] JWT-based handshake middleware (reuse `verifyToken`).
- [ ] Rooms:
  - `user:<userId>` — personal notifications
  - `chat:<chatId>` — chat messages
- [ ] Emit on:
  - `POST /chats/:id/messages` → `message:new` to `chat:<id>`
  - Notification creation → `notification:new` to `user:<id>`
  - Task status / assignment change → `task:updated` to relevant rooms
- [ ] Typing indicators (`message:typing`) and read receipts (`message:seen`) as bonus.

**Dependency:** Phases 8, 9.

---

## Phase 11 — Hardening

**Goal:** production-readiness.

**Effort:** ~1 day.

- [ ] Centralize error handling — single `AppError` class + global handler that **never leaks `error.stack` in production**.
- [ ] Structured logger (`pino` or `winston`) replacing every `console.log`.
- [ ] Rate-limit auth endpoints + chat-send endpoints separately.
- [ ] `mongo-sanitize` on `req.body` / `req.params` / `req.query`.
- [ ] Soft-delete cascade: when a `User` is soft-deleted, soft-detach from teams / reassign open tasks back to team owner.
- [ ] Indexes audit: `User.email` (unique), `Otp.email + purpose`, `Notification.user + isRead`, `Message.chat + createdAt`, `Task.team + status`.
- [ ] Add a graceful shutdown handler (close Mongo + HTTP + socket.io on `SIGTERM`).

---

## Phase 12 — Testing

**Goal:** confidence to refactor.

**Effort:** ~2 days.

- [ ] `jest` + `supertest` + `mongodb-memory-server`.
- [ ] Unit tests for `encrypt.js`, `token.js`, `validation.js`, `authentication.js`.
- [ ] Integration tests per module covering happy path + 1 auth-failure + 1 validation-failure.
- [ ] Add `npm test` and `npm run test:watch` scripts.
- [ ] Aim for ≥ 70% line coverage on `src/modules/**` and `src/middleware/**`.

---

## Phase 13 — API documentation

**Goal:** discoverable, click-to-try API surface.

**Effort:** ~0.5 day.

- [ ] Add `swagger-jsdoc` + `swagger-ui-express`.
- [ ] Mount at `GET /docs`.
- [ ] Annotate each route file with JSDoc OpenAPI blocks.
- [ ] Keep the README's API table in sync (or replace it with a link to `/docs`).

---

## Phase 14 — DevOps & deployment

**Goal:** reproducible deploy.

**Effort:** ~1 day.

- [ ] `Dockerfile` (multi-stage: `node:20-alpine` → prod image with only `dist`/runtime deps).
- [ ] `docker-compose.yml` for local dev (app + MongoDB + Mongo Express).
- [ ] GitHub Actions: `lint → test → build → push image`.
- [ ] Deploy target: Render / Railway / Fly.io / VPS — document the choice in `README.md`.
- [ ] Health probe: `GET /healthz` returning `{ db: "up", uptime: <s> }`.

---

## Phase 15 — Optional / future ideas

Not on the critical path, ranked by user value:

- [ ] Recurring tasks (cron-like rules on `Task`).
- [ ] Subtasks / checklists per task.
- [ ] Kanban board view: `GET /teams/:id/board?groupBy=status` returns tasks bucketed by status.
- [ ] Activity log per task (`actor`, `action`, `from`, `to`).
- [ ] Google / GitHub OAuth login.
- [ ] Push notifications (Web Push or FCM).
- [ ] Multi-language UI strings (i18n).
- [ ] Audit trail for admin actions.
- [ ] Soft-delete admin panel (restore deleted users/tasks).

---

## Suggested execution order (MVP path)

If you only want the **MVP** (a working task manager you can demo), do these in order and stop:

**Phase 1 → 2 → 3 → 4 → 6 → 8 → 11 → 13**

That gives you: stable auth, RBAC, teams, tasks, verified accounts, notifications, hardening, and Swagger docs — without the chat/real-time/upload work.

Everything else (Phases 5, 7, 9, 10, 12, 14, 15) is **incremental** and can ship after the MVP is live.
