# Student-Portal

Repository for **CareerBuild**, the student-facing web app of the BrandB HR platform.

The application lives in [`student-portal/`](./student-portal) — a Next.js 16 app where
students sign in, read career articles published by the HR team, upload and manage their
CV, and maintain a profile that recruiters review from the admin portal.

```bash
cd student-portal
npm install
npm run dev      # http://localhost:3000
```

## Documentation

| Document | Contents |
|---|---|
| [student-portal/README.md](./student-portal/README.md) | System functions, routes, setup, environment variables, API endpoints |
| [student-portal/DESIGN-SYSTEM.md](./student-portal/DESIGN-SYSTEM.md) | Colour tokens, typography, component variants, layout rules |

## Related repositories

| Path | Role |
|---|---|
| `Admin-Portal-API/StudentPortal` | Student portal API — auth bootstrap, CV, blog, adverts |
| `Admin-Portal-API/BrandBHR.API` | Admin/HR API — publishes articles and adverts |
| `Admin-Portal-UI/brandb-hr-web` | Admin portal front end (Angular) |
