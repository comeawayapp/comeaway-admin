# Comeaway Admin — Developer Handoff

This document is the onboarding guide for engineers taking over **comeaway-admin**, the web-based admin panel for the Comeaway meditation/sound app. It covers architecture, setup, features, API integration, deployment, and known quirks.

---

## 1. What this project is

| Item | Detail |
|------|--------|
| **Product** | Internal admin dashboard for Comeaway |
| **Users** | Admins only (`role === 'admin'` on login) |
| **Backend** | REST API at `https://api.comeaway.com` (separate repo/service) |
| **Admin hosting** | **DigitalOcean** — serves the built SPA (`dist/`) |
| **Media storage** | **DigitalOcean Spaces** — sound audio + thumbnails uploaded from the browser (S3-compatible API) |
| **Repo** | `https://github.com/comeawayapp/comeaway-admin` |

The admin panel lets staff manage content (sounds, categories), end users, subscriptions (read-only on dashboard), entitlements, and admin profile settings. Some modules (discounts, prices, activation codes) exist in code but are **hidden from the sidebar** in the current UI.

### DigitalOcean in this project (two roles)

| Role | Service | What it does |
|------|---------|----------------|
| **Host the admin UI** | DigitalOcean (e.g. App Platform, Droplet + nginx, or similar) | Serves the static Vite build after `npm run build` |
| **Store sound files** | DigitalOcean **Spaces** | Browser uploads audio/thumbnails; API stores URLs only |

Do not confuse these: the admin app is **not** hosted on Spaces. Spaces is object storage for media only.

---

## 2. Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Build tool | Vite 6 |
| Routing | React Router DOM 7 |
| HTTP | Axios |
| Auth | JWT in `localStorage`, decoded with `jwt-decode` |
| Styling | Tailwind CSS (PostCSS 7 compat packages) |
| Tables / grids | AG Grid (used in some screens) |
| Charts | Chart.js + `react-chartjs-2` |
| Notifications | `react-toastify` |
| Icons | `lucide-react`, `react-icons` |
| File uploads | `@aws-sdk/client-s3` → DigitalOcean Spaces |
| Lint | ESLint 9 (flat config) |

There is **no** TypeScript, test suite, or state management library (Redux/Zustand). State is local component state + `AuthContext`.

---

## 3. Repository layout

```
comeaway-admin/
├── public/
│   └── netlify.toml          # Legacy Netlify config (admin is hosted on DigitalOcean)
├── src/
│   ├── main.jsx              # Entry: AuthProvider → App
│   ├── App.jsx               # Routes: /login, /* (protected Home)
│   ├── context/
│   │   └── authContext.jsx   # JWT session, login/logout
│   ├── pages/
│   │   ├── login/Login.jsx
│   │   └── navbar/Navbar.jsx
│   ├── components/
│   │   ├── Home.jsx          # Shell: Navbar + Sidebar + content switch
│   │   └── sidebar/
│   │       ├── Sidebar.jsx
│   │       ├── dashboard/Dashboard.jsx
│   │       ├── CategoryManagment/CategoryManagement.jsx  # note typo in folder name
│   │       ├── SoundManagement/
│   │       │   ├── SoundManagement.jsx
│   │       │   └── component/AddUpdateForm.jsx
│   │       ├── UserManagement/UserManagement.jsx
│   │       ├── EntitlementManagement/EntitlementManagement.jsx
│   │       ├── ActivationCodeManagement/   # wired in Home, hidden in Sidebar
│   │       ├── DiscountManagement/         # same
│   │       ├── PriceManagement/              # same
│   │       ├── SubscriptionManagement/     # commented out in Home
│   │       └── Settings/Settings.jsx
│   ├── utils/
│   │   ├── API_SERVICE.js      # All backend API calls
│   │   ├── directUploadService.js  # DO Spaces uploads
│   │   └── fileUtils.js        # Image compression, validation
│   └── assets/                 # logo, branding images
├── vite.config.js              # Dev proxy → api.comeaway.com
├── package.json
└── eslint.config.js
```

**Note:** A `.expo/` folder exists but this is a **Vite web app**, not Expo/React Native. Treat `.expo` as accidental or legacy.

---

## 4. Getting started locally

### Prerequisites

- **Node.js 18+** (recommended for build; match your DO deploy environment)
- npm
- Admin credentials from the backend team
- DigitalOcean Spaces credentials for sound uploads (see env vars)

### Install and run

```bash
git clone https://github.com/comeawayapp/comeaway-admin.git
cd comeaway-admin
npm install
npm run dev
```

Default Vite dev server: `http://localhost:5173` (HMR may use port **5174** per `vite.config.js`).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with API proxy |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint |

---

## 5. Environment variables

Create a `.env` file in the project root (`.env` is gitignored). All Vite variables must be prefixed with `VITE_`.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Production | Full API base URL, e.g. `https://api.comeaway.com/api`. If unset, defaults to `/api` (uses Vite proxy in dev). |
| `VITE_DO_SPACES_BUCKET` | Sound uploads | DO Spaces bucket name |
| `VITE_DO_SPACES_ENDPOINT` | Sound uploads | e.g. `nyc3.digitaloceanspaces.com` |
| `VITE_DO_SPACES_REGION` | Sound uploads | e.g. `nyc3` |
| `VITE_DO_SPACES_KEY` | Sound uploads | Spaces access key |
| `VITE_DO_SPACES_SECRET` | Sound uploads | Spaces secret key |

### Development API proxy

In dev, `API_SERVICE.js` uses `VITE_API_BASE_URL || "/api"`. Vite proxies `/api` to `https://api.comeaway.com`:

```js
// vite.config.js
proxy: {
  "/api": {
    target: "https://api.comeaway.com",
    changeOrigin: true,
    timeout: 300000,  // 5 min for large uploads via proxy
  },
}
```

So local dev often works **without** setting `VITE_API_BASE_URL` as long as requests go to `/api/...`.

### Production

Set `VITE_API_BASE_URL=https://api.comeaway.com/api` in your **DigitalOcean build/deploy environment** (or in `.env` before `npm run build`). Vite bakes `VITE_*` variables into the bundle at build time — they are not read at runtime from the server unless you rebuild.

**Production admin URL:** Confirm the live URL with the team (DigitalOcean dashboard). The API must allow CORS from that origin.

---

## 6. Authentication flow

```
Login form → POST /auth/login (no Bearer token)
           → Response: { token, user }
           → Reject if user.role !== 'admin'
           → authContext.login(token, user)
           → localStorage: accessToken, user (JSON)
           → Navigate to /
```

On app load, `authContext`:

1. Reads `accessToken` and `user` from `localStorage`
2. Decodes JWT with `jwt-decode`
3. If `exp` is in the past, clears storage and treats user as logged out
4. Otherwise restores session

Protected routes in `App.jsx`: any path except `/login` redirects to `/login` if not authenticated.

**Logout:** Clears context state and `localStorage`.

**Important:** There is no refresh-token flow in the frontend. When the JWT expires, the user must log in again.

---

## 7. Application architecture

### Routing (two levels)

1. **React Router** (`App.jsx`): `/login` vs everything else → `Home`
2. **In-app “routing”** (`Home.jsx`): `selectedContent` state + `switch` — **not** URL-based. Refreshing the page always returns to Dashboard.

```
BrowserRouter
  ├── /login → Login
  └── /* → Home (if authenticated)
         ├── Navbar
         ├── Sidebar → setSelectedContent(...)
         └── renderContent() switch
```

### Sidebar vs Home mismatch

`Sidebar.jsx` only exposes:

- Dashboard, Categories, SoundManagement, UserManagement, EntitlementManagement, Settings

`Home.jsx` still supports (but sidebar does not link to):

- ActivationCodes, DiscountManagement, PriceManagement

To re-enable those features, uncomment/add items in `Sidebar.jsx` (see commented blocks around lines 55–57).

### Data access pattern

Almost all server communication goes through **`src/utils/API_SERVICE.js`**:

- `createAxiosInstance(token)` — JSON requests with `Authorization: Bearer <token>`
- `createAxiosInstances(token)` — multipart (legacy sound upload path; create/update via FormData still exist in API_SERVICE but AddUpdateForm uses JSON + URLs)

Components use `useContext(AuthContext)` for `accessToken` and call exported API functions.

---

## 8. Feature modules

### 8.1 Dashboard (`Dashboard.jsx`)

- Fetches all users and all subscriptions
- Shows total users, annual vs monthly subscription counts (pie chart)
- Bar chart: subscriptions per calendar month (from `startDate`)

Depends on: `getAllUsers`, `getAllUsersSubscription`.

### 8.2 Category management (`CategoryManagement.jsx`)

- CRUD for categories: `name`, `slug`
- Lists sound count per category (fetches sounds for counts)
- Client-side search/filter and pagination (5 per page)

**API spelling:** Backend paths use `catagory` / `getCatagories` (typo preserved in API).

| Action | Endpoint |
|--------|----------|
| List | `GET /categories/getCatagories` |
| Create | `POST /categories/create-catagory` |
| Update | `PUT /categories/updateCatagory/:id` |
| Delete | `DELETE /categories/deleteCatagory/:id` |

### 8.3 Sound management (`SoundManagement.jsx` + `AddUpdateForm.jsx`)

**Most complex feature.** Upload flow:

1. User selects audio + thumbnail in the form
2. Optional: thumbnail compressed via `compressImage()` in `fileUtils.js`
3. Audio duration computed in-browser (`Audio` + `loadedmetadata`)
4. Files uploaded **directly to DigitalOcean Spaces** via `directUploadService`
   - Keys like `dev/sounds/<timestamp>_<random>_<name>.mp3` or `prod/...` based on `import.meta.env.NODE_ENV`
5. Form submits **JSON only** to backend with public URLs:

```json
{
  "title": "...",
  "description": "...",
  "status": "active|inactive|...",
  "soundFile": "https://bucket.region.digitaloceanspaces.com/...",
  "thumbnail": "https://...",
  "duration": 120,
  "categories": ["categoryId1", "categoryId2"],
  "addedDate": "ISO-8601"
}
```

| Action | Endpoint | Content-Type |
|--------|----------|--------------|
| List | `GET /sounds/getSounds` | JSON |
| Create | `POST /sounds/add-sounds` | JSON (URLs) in AddUpdateForm; multipart still in API_SERVICE |
| Update | `PUT /sounds/updateSound/:id` | JSON |
| Delete | `DELETE /sounds/deleteSound/:id` | JSON |

**Limits (AddUpdateForm):**

- Sound: max **100 MB** (constant `MAX_SOUND_FILE_SIZE`; comment in code incorrectly says 10 MB)
- Thumbnail: max 2 MB, types validated, compressed for images
- Allowed audio: MP3, MPEG, WAV, OGG, M4A

**Security note:** DO Spaces keys are in frontend env vars. Anyone with admin access can extract them from the built bundle. Prefer presigned URLs or server-side upload if hardening.

### 8.4 User management (`UserManagement.jsx`)

- Paginated list (20/page) with debounced search (`query` param) and `type` filter
- View user details and subscription history
- Update user status, plan status
- Delete user: `DELETE /auth/admin/delete/:userId`

Uses `getAllUsers(accessToken, { query, type })` — response shape `{ users: [...] }`.

### 8.5 Entitlement management (`EntitlementManagement.jsx`)

Large module (~1.5k lines). Manages product entitlements (e.g. store purchases):

- CRUD, import CSV, export, send email, redeem
- Filters: search field, redeem status, platform
- Uses portal-based dropdowns for row actions

| Action | Endpoint |
|--------|----------|
| List | `GET /entitlements/admin/entitlements` |
| Create | `POST /entitlements/admin/entitlements` |
| Update | `PUT /entitlements/admin/entitlements/:id` |
| Delete | `DELETE /entitlements/admin/entitlements/:id` |
| Import | `POST /entitlements/admin/entitlements/import` |
| Email | `POST /entitlements/admin/entitlements/send-to-user` |
| Redeem | `POST /entitlements/entitlements/redeem` |

### 8.6 Activation codes (hidden in sidebar)

Implemented in `ActivationCodeManagement.jsx`, wired in `Home.jsx`. API under `/activation-codes/admin/...`. Re-enable via sidebar if needed.

### 8.7 Discount & price management (hidden in sidebar)

- Discounts: `/discounts/create`, `/discounts/all`, etc.
- Prices: `/prices/all`, assign/remove discounts on plans

Used for subscription pricing experiments; UI not in current nav.

### 8.8 Settings (`Settings.jsx`)

- Loads admin profile via `getUserById`
- Updates via `updateAdminDetails` — `PUT /auth/admin/update/:id` with optional new password

---

## 9. API reference (centralized)

All functions live in `src/utils/API_SERVICE.js`. Grouped by domain:

| Domain | Key exports |
|--------|-------------|
| Auth | `login`, `signup`, `forgotPassword`, `resetPassword`, `getAllUsers`, `getUserById`, `updateUserStatus`, `updateUserType`, `updateAdminDetails`, `updateUserPlanStatus`, `deleteUserById` |
| Categories | `createCategory`, `getCategories`, `getCategoryById`, `updateCategory`, `deleteCategory` |
| Sounds | `createSound`, `getSounds`, `getSoundById`, `updateSound`, `deleteSound` |
| Subscriptions | `getUserSubscriptionDetails`, `getAllUsersSubscription` |
| Activation codes | `createActivationCode`, `getActivationCodes`, `updateActivationCode`, `deleteActivationCode`, `importActivationCodes`, `sendEMail`, `redeemActivationCode` |
| Entitlements | `createEntitlement`, `getEntitlements`, `editEntitlement`, `deleteEntitlement`, `importEntitlements`, `sendEntitlementEmail`, `redeemEntitlement` |
| Discounts | `createDiscount`, `getDiscounts`, `updateDiscount`, `deleteDiscount` |
| Prices | `getPrices`, `updatePrices`, `getAllAssignments`, `assignDiscountToPrice`, `removeDiscountFromPrice` |

**Error handling:** Most functions log and rethrow; activation/entitlement/discount helpers often throw `new Error(error.response?.data?.error || ...)`.

**CORS:** Axios uses `withCredentials: false`. Network/CORS failures log in dev interceptors.

---

## 10. Deployment (DigitalOcean)

The **admin panel is hosted on DigitalOcean**, not Netlify. Deployment is a standard Vite static site:

```bash
npm install
npm run build    # output: dist/
```

Serve everything in `dist/` as static files. Because this is a client-side SPA (React Router), the server must **fallback to `index.html`** for unknown paths so `/login` and deep links work after refresh.

### Typical DO setup (confirm with your team)

| Piece | Notes |
|-------|--------|
| **Build** | Run on DO App Platform build step, CI, or locally before upload |
| **Artifacts** | Upload/serve contents of `dist/` |
| **Env vars** | Set all `VITE_*` **before** `npm run build` (see section 5) |
| **SPA routing** | nginx: `try_files $uri $uri/ /index.html;` — or equivalent on App Platform |
| **HTTPS** | Terminate TLS at DO load balancer / App Platform / nginx |

Exact product (App Platform vs Droplet vs other) and deploy pipeline are **not in this repo** — get access to the DigitalOcean project and any CI/CD docs from the previous team.

### Legacy: `public/netlify.toml`

This file remains in the repo from an earlier or alternate deploy path. It is **not** the current hosting model. You can use it as a reference for SPA redirect and CSP ideas if configuring nginx or DO headers, but production hosting is DigitalOcean.

Reference values from that file (if you mirror them on DO):

- Build: `npm run build`, publish `dist`
- CSP `connect-src`: `'self'` and `https://api.comeaway.com`

### Deploy checklist

1. DigitalOcean dashboard / deploy pipeline access
2. Set all `VITE_*` env vars for the target environment, then run `npm run build`
3. Deploy `dist/` and configure SPA fallback to `index.html`
4. Confirm production admin URL and API CORS allow that origin
5. Verify admin login and a test sound upload (`prod/` vs `dev/` prefix on Spaces)

---

## 11. Styling and UX conventions

- Layout: gray page background (`bg-gray-200`), dark sidebar (`bg-gray-800`), accent `#5AD4FF`
- Many screens use `"use client"` (Next.js habit; harmless in Vite)
- Toast feedback via `react-toastify` — many components mount their own `<ToastContainer />`
- Pagination: custom page state or `react-paginate` (users: 20/page, sounds/categories: 5/page)

---

## 12. Known issues and technical debt

| Issue | Impact | Suggestion |
|-------|--------|------------|
| No URL-based admin sections | Refresh loses place | Add React Router nested routes under `Home` |
| Sidebar/Home feature drift | Hidden modules still in code | Align nav with product requirements |
| `catagory` typo in API paths | Must match backend | Do not “fix” frontend alone |
| DO credentials in frontend | Security risk | Move to presigned URLs or backend proxy |
| `App.jsx` reads `AuthContext` before children — works because `AuthProvider` wraps in `main.jsx` | Confusing pattern | Optional: split `AppRoutes` child |
| Token expiry only checked on load | Long sessions may get 401 mid-action | Add axios interceptor to logout on 401 |
| `MAX_SOUND_FILE_SIZE` comment says 10 MB, value is 100 MB | Confusing for devs | Fix comment or constant |
| `directUploadService.getEnvironmentPath()` uses `import.meta.env.NODE_ENV` | Vite sets `MODE` (`development`/`production`), not always `NODE_ENV` | Prefer `import.meta.env.PROD` |
| No automated tests | Regressions manual | Add smoke tests for login + API mocks |
| README.md is Vite template only | Poor onboarding | Point README to this doc |

---

## 13. Debugging tips

| Symptom | Things to check |
|---------|-----------------|
| Login works locally, fails in prod | `VITE_API_BASE_URL` baked into build; API CORS for admin origin; browser network tab |
| CORS errors | API must allow admin origin; dev proxy avoids CORS for `/api` |
| Sound upload fails at Spaces step | All `VITE_DO_SPACES_*` set; bucket CORS for browser PUT; keys valid |
| Sound save fails after upload | Backend `/sounds/add-sounds` accepts JSON body with URLs |
| 401 on API calls | Token expired — re-login |
| “Access Denied” on login | User is not `role: 'admin'` |
| Upload timeout | Proxy/backend timeout is 5 minutes in vite + axios for multipart legacy paths |

Enable temporary logging in `API_SERVICE.js` interceptors (currently commented) for request tracing in dev.

---

## 14. Related systems

| System | Relationship |
|--------|----------------|
| **Comeaway API** (`api.comeaway.com`) | Source of truth for users, sounds metadata, subscriptions, entitlements |
| **DigitalOcean (hosting)** | Serves this admin SPA (`dist/`) |
| **DigitalOcean Spaces** | Object storage for sound audio and thumbnails (not the admin app) |
| **Comeaway mobile/web app** | Consumer app; admin does not live in this repo |

Obtain API documentation, Postman collections, or backend repo access from the team that owns `api.comeaway.com`.

---

## 15. Recent git history (context)

Recent commits (newest first):

- Sound description optional fix
- Entitlement manager added
- Subscription fixes
- Sound implementation with upload progress loader

Branch workflow appears to use `dev` and feature branches; confirm with team before merging to production.

---

## 16. Quick reference: file → responsibility

| If you need to change… | Edit |
|------------------------|------|
| API endpoints or headers | `src/utils/API_SERVICE.js` |
| Login / session | `src/context/authContext.jsx`, `src/pages/login/Login.jsx` |
| Nav items | `src/components/sidebar/Sidebar.jsx` + `Home.jsx` switch |
| Sound upload behavior | `AddUpdateForm.jsx`, `directUploadService.js` |
| Dev API target | `vite.config.js` proxy `target` |
| Production hosting | DigitalOcean project + build-time `VITE_*` env vars |
| Image compression / file rules | `src/utils/fileUtils.js` |

---

## 17. Contact and handoff checklist

For a complete handoff, confirm with the previous team:

- [ ] DigitalOcean project access (admin hosting) and production admin URL
- [ ] How deploys are triggered (manual, GitHub Actions, App Platform auto-deploy, etc.)
- [ ] Production/staging `VITE_*` values (secure channel)
- [ ] Admin test account credentials
- [ ] DigitalOcean Spaces bucket policy and CORS config
- [ ] Backend repo + deployment process for `api.comeaway.com`
- [ ] Which sidebar-hidden modules are still in use (activation codes, discounts, prices)
- [ ] On-call / escalation for production incidents

---

*Document generated from codebase review. Update this file when architecture or env requirements change.*
