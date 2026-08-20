# CareerBuild — Student Portal

The student-facing web app of the BrandB HR platform. Students sign in, read career
articles published by the HR team, upload and manage their CV, and keep a profile that
recruiters review from the admin portal.

Built with **Next.js 16** (App Router, Turbopack), **React 19**, **Tailwind CSS v4**,
and **Firebase Authentication**.

---

## Table of contents

- [System functions](#system-functions)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Component library](#component-library)
- [Library functions](#library-functions)
- [Backend endpoints consumed](#backend-endpoints-consumed)
- [Related documentation](#related-documentation)

---

## System functions

### 1. Authentication & access control

| Function | Where | Notes |
|---|---|---|
| Sign up with email + password | `/login` (Sign up tab) | Collects **only** email and password. Name and study details are filled in later, on the profile/upload flow. |
| Sign up / sign in with Google | `/login` | One-tap OAuth popup via Firebase. |
| Sign in with email + password | `/login` (Sign in tab) | |
| Email verification gate | `/verify-email` | Unverified accounts are redirected here. Can resend the verification email and re-check status. |
| Profile bootstrap | automatic | On every authenticated load, `bootstrapStudentProfile()` creates or fetches the student record. |
| Route guarding | `AuthGuard` / `SiteShell` | Signed-out users go to `/login`; unverified users to `/verify-email`; a `409` signs the user out (account conflict). |
| Sign out | header account menu | Clears the Firebase session and returns to `/login`. |
| Token handling | `lib/firebase.ts` | `getIdToken()` attaches a fresh Firebase ID token to every API call. |

**Post-login routing:** a student **with** an active CV lands on `/dashboard`; a student
**without** one is sent to `/upload` to add one first.

### 2. Career articles (the blog)

| Function | Where | Notes |
|---|---|---|
| Article homepage | `/dashboard` | Masthead, featured "Editor's pick", latest grid, "Most read" sidebar, and a horizontal rail. |
| Browse all articles | `/blog` | Paginated grid, 9 per page, with Prev/Next. |
| Read an article | `/blog/[id]` | Editorial reading column with rich HTML from the admin portal's editor. |
| Related reads | `/blog/[id]` | "More like this" list under each article. |
| Comments | `/blog/[id]` | **Front end only** — post, like, and reply UI backed by local state. Not persisted; no API yet. |
| Content normalisation | `normalizeArticleHtml()` | Strips the `&nbsp;` runs and empty heading shells the editor emits when text is pasted from Word/Docs. Without this, paragraphs never wrap and overflow the page. |
| Reading time & excerpts | `lib/articles.ts` | Derived from the article HTML at ~200 words/minute. |

### 3. CV management

| Function | Where | Notes |
|---|---|---|
| Upload a CV (PDF) | `/upload` | Drag-and-drop or file picker, with live upload progress. |
| Upload an intro video | `/upload` | Same flow, separate slot. |
| Direct-to-blob upload | `uploadToAzureBlob()` | The API issues a short-lived SAS URL; the browser uploads straight to Azure Blob Storage, never through the API. |
| AI CV extraction | on confirm | `confirmCvUpload()` returns `extractedDataJson` — name, contact details, links, skills, experience, education. |
| Review wizard | `/upload` | Multi-step form pre-filled from the extraction so the student can correct it before saving. |
| Edit experience / education / skills | `/upload` wizard | Add, edit, and remove rows. |
| Save reviewed profile | `saveProfile()` | Persists the corrected data and returns to the dashboard. |
| One active CV per student | enforced by API | Uploading a new CV replaces the current one. |

### 4. Profile

| Function | Where | Notes |
|---|---|---|
| View profile | `/profile` | Name, contact details, university. |
| View active CV | `/profile` | Opens the stored CV via a signed download URL. |
| Extraction status | `/profile` | Badge showing whether AI extraction succeeded, is pending, or failed. |
| Skills from CV | `/profile` | Skill chips parsed out of the CV. |
| Review team feedback | `/profile` | Notes left by reviewers in the admin portal. |
| Update CV | header → **Update CV** | Shortcut back into `/upload`. |

### 5. Advertising

| Function | Where | Notes |
|---|---|---|
| Active advert slots | `AdBanner` | Two sizes: `strip` (inline leaderboard) and `sidebar` (compact box). |
| Rotation | `AdBanner` | Cycles adverts on each one's own `displayDurationSeconds`, with clickable dots. |
| Graceful absence | `AdBanner` | Renders **nothing** when no adverts are active, so it never leaves a gap. |
| Labelling | `AdBanner` | Every slot is marked "Sponsored" and links carry `rel="sponsored"`. |

---

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

The API must be running separately — see `Admin-Portal-API/StudentPortal` (defaults to
`http://localhost:5033`).

---

## Environment variables

Create `.env.local` in this directory:

```ini
NEXT_PUBLIC_API_URL=http://localhost:5033

NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
```

All four are required. `NEXT_PUBLIC_*` values are exposed to the browser by design —
never put a secret here.

---

## Project structure

```
app/
  page.tsx              redirects to /login
  login/                sign in + sign up (email/password, Google)
  verify-email/         email verification gate
  dashboard/            article homepage
  blog/                 article listing
  blog/[id]/            article reader + comments
  upload/               CV & video upload, review wizard
  profile/              student profile, CV, feedback
  globals.css           design tokens, typography, article styles
  layout.tsx            root layout, metadata, toasts

components/
  SiteShell.tsx         AuthGuard + header + main + footer
  SiteHeader.tsx        sticky nav, account menu, mobile drawer
  SiteFooter.tsx        footer
  AuthGuard.tsx         route protection
  ArticleCard.tsx       article card — 5 variants
  ArticleRail.tsx       horizontal scrolling row
  AdBanner.tsx          advert slots
  CommentSection.tsx    comments (front end only)
  Navbar.tsx            alias of SiteHeader (back-compat)
  ui/                   Container, Button, Badge, SectionHeader, States

lib/
  firebase.ts           auth wrapper
  api.ts                typed API client
  articles.ts           article types, fetching, formatting
```

---

## Routes

| Route | Auth | Purpose |
|---|---|---|
| `/` | — | Redirects to `/login` |
| `/login` | public | Sign in / sign up |
| `/verify-email` | signed in | Email verification gate |
| `/dashboard` | protected | Article homepage |
| `/blog` | protected | All articles, paginated |
| `/blog/[id]` | protected | Read an article |
| `/upload` | protected | Upload CV / video, review wizard |
| `/profile` | protected | Profile, CV, feedback |

---

## Component library

**`ArticleCard`** — one component, one data shape, five presentations:

| Variant | Shape | Used on |
|---|---|---|
| `featured` | Image beside a large headline | Dashboard hero |
| `standard` | Vertical card with excerpt | Grids |
| `rail` | Fixed-width, title only | Horizontal rails |
| `list` | Thumbnail + title row | Sidebars, related reads |
| `text` | Ranked numeral, no image | "Most read" |

**UI primitives** — `Container` (3 widths), `Button` (4 variants × 3 sizes),
`Badge` (4 tones), `SectionHeader`, and the state set (`Skeleton`,
`ArticleCardSkeleton`, `Spinner`, `EmptyState`, `ErrorState`).

Full design rules live in [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

---

## Library functions

### `lib/firebase.ts`

| Function | Purpose |
|---|---|
| `signUpWithEmail(email, password)` | Create an account |
| `signInWithEmail(email, password)` | Email sign in |
| `signInWithGoogle()` | Google OAuth popup |
| `signOut()` | End the session |
| `onAuthStateChanged(auth, cb)` | Subscribe to auth state |
| `resendVerificationEmail()` | Re-send verification |
| `refreshUser()` | Re-read the user (picks up `emailVerified`) |
| `getIdToken(forceRefresh?)` | Fresh ID token for API calls |

### `lib/api.ts`

| Function | Purpose |
|---|---|
| `bootstrapStudentProfile(payload?)` | Create or fetch the student record |
| `getCvUploadUrl(name, type, size)` | Request a SAS upload URL |
| `uploadToAzureBlob(url, file, onProgress)` | Upload straight to blob storage |
| `confirmCvUpload(...)` | Confirm the upload; returns extracted CV data |
| `getActiveCv()` | Current CV + signed download URL |
| `saveProfile(payload)` | Save the reviewed profile |
| `getVideoUploadUrl(...)` / `confirmVideoUpload(...)` / `getActiveVideo()` | Same flow for the intro video |

`ApiError` carries the HTTP `status`, which the app branches on: **403** → unverified
email, **409** → account conflict.

### `lib/articles.ts`

| Function | Purpose |
|---|---|
| `fetchArticles(page, pageSize, signal?)` | Paginated published articles |
| `fetchArticle(id, signal?)` | A single article |
| `normalizeArticleHtml(html)` | Strip `&nbsp;` runs and empty blocks from editor HTML |
| `stripHtml(html)` / `excerpt(html, max)` | Plain text and summaries |
| `formatDate(iso, long?)` / `readTime(html)` | Display formatting |
| `authorOf(article)` / `initialsOf(name)` | Author name and avatar initials |

---

## Backend endpoints consumed

| Method | Endpoint | Used by |
|---|---|---|
| `POST` | `/api/student/auth/bootstrap` | Auth guard, login, signup |
| `GET` | `/api/blog/articles?page&pageSize` | Dashboard, blog listing |
| `GET` | `/api/blog/articles/{id}` | Article reader |
| `GET` | `/api/adverts/active` | Advert slots |
| `POST` | `/api/student/cv/upload-url` | CV upload |
| `POST` | `/api/student/cv/confirm` | CV upload |
| `GET` | `/api/student/cv/active` | Profile, post-login routing |
| `POST` | `/api/student/cv/save-profile` | Review wizard |
| `POST` | `/api/student/video/upload-url` | Video upload |
| `POST` | `/api/student/video/confirm` | Video upload |
| `GET` | `/api/student/video/active` | Profile |

---

## Notes for contributors

- **Article cover images use plain `<img>`, not `next/image`.** `next/image` requires
  every storage hostname to be whitelisted in `next.config.ts`, which broke when content
  moved between storage accounts. Plain `<img>` in an aspect-ratio box works in any
  environment with no config change.
- **Don't write bespoke card markup.** Add a variant to `ArticleCard` instead, so every
  page benefits.
- **Comments are not persisted.** `CommentSection` holds state locally and is seeded with
  placeholder entries — see `SAMPLE_COMMENTS` in that file.

---

## Related documentation

- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — colour tokens, typography, component variants,
  spacing, and the rules for adding a section.
