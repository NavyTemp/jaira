# Frontend — Task Management System

React 19 + Vite 8 + TypeScript + Tailwind CSS v4.
This is the client app for the Express/MongoDB backend in `../`.

---

## Quick start

```bash
# from the project root
cd frontend
npm install     # already done if you ran it once
npm run dev     # http://localhost:5173
```

The backend must be running on `http://localhost:3000` for API calls to succeed.
Vite proxies `/api/*` to that origin (see `vite.config.ts`), so no CORS setup is
required during development.

---

## Stack

| Concern | Library |
|---|---|
| Build / dev server | Vite ^8 |
| UI | React ^19, TypeScript ~6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Routing | react-router-dom ^7 |
| Data fetching | @tanstack/react-query ^5 |
| HTTP | axios ^1 |
| Forms | react-hook-form + @hookform/resolvers |
| Schema validation | zod ^4 |
| Icons | lucide-react |
| Class helper | clsx + local `cn()` wrapper |

---

## Folder layout (feature-based)

```
frontend/
├── index.html
├── vite.config.ts          # plugins, alias, dev proxy
├── tsconfig.app.json       # `@/*` path alias
├── .env.example
└── src/
    ├── main.tsx            # entry — wraps App in StrictMode
    ├── App.tsx             # mounts QueryClientProvider + RouterProvider
    ├── index.css           # Tailwind import + base resets
    │
    ├── lib/                # cross-cutting helpers
    │   ├── apiClient.ts    # axios instance + auth header + 401 interceptor
    │   ├── authStorage.ts  # localStorage wrapper + handleSessionExpired()
    │   ├── queryClient.ts  # React Query defaults
    │   └── cn.ts           # clsx wrapper
    │
    ├── types/
    │   └── common.ts       # types shared across features
    │
    ├── components/
    │   ├── ui/             # primitives: Button, Input, Card
    │   └── layout/         # AppLayout, Sidebar, Header
    │
    ├── routes/
    │   ├── router.tsx      # createBrowserRouter() — single source of truth
    │   ├── ProtectedRoute.tsx
    │   └── NotFoundPage.tsx
    │
    └── features/           # one folder per backend module
        ├── auth/
        │   ├── api/authApi.ts
        │   ├── pages/LoginPage.tsx
        │   ├── pages/SignupPage.tsx
        │   ├── schemas.ts          # Zod schemas
        │   └── types.ts
        ├── users/
        │   ├── api/usersApi.ts
        │   ├── pages/ProfilePage.tsx
        │   ├── pages/UsersListPage.tsx
        │   └── types.ts
        ├── teams/
        │   ├── api/teamsApi.ts
        │   ├── pages/TeamsListPage.tsx
        │   ├── pages/TeamDetailPage.tsx
        │   └── types.ts
        ├── tasks/
        │   ├── api/tasksApi.ts
        │   ├── pages/TasksListPage.tsx
        │   ├── pages/TaskDetailPage.tsx
        │   └── types.ts
        ├── comments/
        │   ├── api/commentsApi.ts
        │   └── types.ts
        ├── chats/
        │   ├── api/chatsApi.ts
        │   ├── pages/ChatsListPage.tsx
        │   └── types.ts
        └── notifications/
            ├── api/notificationsApi.ts
            ├── pages/NotificationsPage.tsx
            └── types.ts
```

### Conventions

- **One folder per backend module.** Frontend `features/<x>` mirrors `backend/src/modules/<x>`.
- Each feature owns its `types.ts`, `api/`, and `pages/`. Internal `components/` and `hooks/` go inside the feature folder when they're not reused elsewhere.
- **Cross-feature** code lives in `lib/`, `components/ui/`, `components/layout/`, or `types/common.ts`.
- Use the `@/` alias for imports — `import { Button } from '@/components/ui/Button'`.
- Pages are mounted only via `src/routes/router.tsx`. Don't import pages from elsewhere.
- Server state goes through React Query (`useQuery` / `useMutation`); never store it in component state.

---

## Auth flow (current)

1. `LoginPage` calls `POST /users/login`.
2. `authStorage.setSession()` writes the JWTs + minimal user info to `localStorage`.
3. `apiClient` attaches `Authorization: <prefix> <token>` on every request, where `<prefix>` is `bearer` (user) or `admin` (admin) to match what the backend's `authentaction.js` middleware expects.
4. Any `401` / `403` response triggers `handleSessionExpired()` — it clears storage and redirects to `/login?next=<current>`.

> Today the backend's `POST /users/login` returns only tokens, not the user. The frontend stores a stub user (email + default role). Once the backend ships a `GET /users/me` (planned in ROADMAP Phase 1), wire it into the post-login flow to enrich `tms_user`.

---

## Adding a new feature

1. Create `src/features/<name>/` with `types.ts`, `api/<name>Api.ts`, and `pages/`.
2. Add the API functions on top of `apiClient`.
3. Add page(s) and register them in `src/routes/router.tsx`.
4. If the feature needs its own sidebar link, add it in `src/components/layout/Sidebar.tsx`.
5. Use `useQuery` / `useMutation` from `@tanstack/react-query` — do not call `apiClient` directly inside components.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR on http://localhost:5173 |
| `npm run build` | TypeScript build + Vite production bundle |
| `npm run preview` | Preview the production bundle locally |
| `npm run lint` | ESLint |
