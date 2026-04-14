# task-api

Small full-stack app: REST API for tasks with register/login (JWT), roles (`USER` / `ADMIN`), and a React UI.

**Stack:** Node (Express), Prisma + SQLite, Zod, Swagger. Frontend: Vite + React.

## Run it

**API**

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

API on `http://localhost:4000`. Swagger: `http://localhost:4000/api/docs`.

**UI** (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` (proxies `/api` to the backend).

## Env

See `backend/.env.example`. Don’t commit `.env`.

## Seed logins

| | email | password |
|---|--------|----------|
| admin | admin@demo.local | demo1234 |
| user | user@demo.local | demo1234 |

## API (v1)

Base path: `/api/v1`.

- `POST /auth/register`, `POST /auth/login`
- Tasks (Bearer JWT): `POST/GET/PATCH/DELETE /tasks`, `GET /tasks/:id`
- Admin only: `GET /admin/tasks`

Statuses: `TODO`, `DOING`, `DONE`.

Postman: import `postman/Task_API.postman_collection.json`, log in, paste `data.accessToken` into the `token` variable.

## Postgres instead of SQLite

In `backend/prisma/schema.prisma` set `provider = "postgresql"`, point `DATABASE_URL` at your DB, then `npx prisma migrate dev` and seed again.

## Notes

SQLite is the default so it runs locally without extra services. JWT is in `localStorage` on the UI for simplicity; production you’d tighten that up (HTTPS, httpOnly cookies, rate limits, etc.).

If something breaks: wrong/missing JWT → 401; CORS → check `FRONTEND_ORIGIN` matches the Vite URL.

## License

MIT
