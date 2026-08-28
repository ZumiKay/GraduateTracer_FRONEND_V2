# GRADUATE TRACER FRONTEND WEB APPLICATION

## This is a form management web application act as frontend for GRADUATE TRACER BACKEND built using React 19 with VITE and TAILWIND 4.

## TECH STACK

<ul style="list-style: none; padding: 0; line-height: 2.4;">

<li style="font-size: 1.2em;">
  ⚛️ &nbsp;<a href="https://react.dev/" target="_blank"><img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
</li>

<li style="font-size: 1.2em;">
  ⚡ &nbsp;<a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
</li>

<li style="font-size: 1.2em;">
  🟦 &nbsp;<a href="https://www.typescriptlang.org/" target="_blank"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
</li>

<li style="font-size: 1.2em;">
  🎨 &nbsp;<a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
</li>

<li style="font-size: 1.2em;">
  🗃️ &nbsp;<a href="https://redux-toolkit.js.org/" target="_blank"><img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit" /></a>
</li>

<li style="font-size: 1.2em;">
  🔄 &nbsp;<a href="https://tanstack.com/query/latest" target="_blank"><img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query" /></a>
</li>

<li style="font-size: 1.2em;">
  🌐 &nbsp;<a href="https://axios-http.com/" target="_blank"><img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" /></a>
</li>

<li style="font-size: 1.2em;">
  🛣️ &nbsp;<a href="https://reactrouter.com/" target="_blank"><img src="https://img.shields.io/badge/React_Router_7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router" /></a>
</li>

<li style="font-size: 1.2em;">
  ✍️ &nbsp;<a href="https://tiptap.dev/" target="_blank"><img src="https://img.shields.io/badge/Tiptap-000000?style=for-the-badge&logo=tiptap&logoColor=white" alt="Tiptap" /></a>
</li>

<li style="font-size: 1.2em;">
  📊 &nbsp;<a href="https://recharts.org/" target="_blank"><img src="https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Recharts" /></a>
</li>

<li style="font-size: 1.2em;">
  🎞️ &nbsp;<a href="https://www.framer.com/motion/" target="_blank"><img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" /></a>
</li>

<li style="font-size: 1.2em;">
  🔒 &nbsp;<a href="https://developers.google.com/recaptcha" target="_blank"><img src="https://img.shields.io/badge/reCAPTCHA_v2-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="reCAPTCHA" /></a>
</li>

<li style="font-size: 1.2em;">
  🐳 &nbsp;<a href="https://www.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
</li>

</ul>

## Key Features

<ul style="list-style: none; padding: 0; line-height: 2.6; font-size: 1.1em;">

<li>📋 &nbsp;<strong>Form Builder</strong> — Create and manage forms with rich question types (multiple choice, short answer, date, selection) using a style editor powered by Tiptap rich text.</li>

<li>👥 &nbsp;<strong>Collaborator Management</strong> — Invite collaborators to co-manage forms, and transfer form ownership.</li>

<li>🫂 &nbsp;<strong>Session Handling</strong> — Respondents access forms through a secure session system with login, session verification and inactivity warnings.</li>

<li>💾 &nbsp;<strong>Auto-Save</strong> — Form responses are automatically saved as the respondent fills out the form.</li>

<li>📊 &nbsp;<strong>Response Analytics</strong> — View submitted responses with both default table views and interactive graph/chart analytics powered by Recharts.</li>

<li>📤 &nbsp;<strong>Response Export</strong> — Export form responses and analytics to PDF using a built-in export system.</li>

<li>🔔 &nbsp;<strong>Notification System</strong> — Real-time in-app notifications for form events such as new responses and collaboration invites.</li>

<li>🔐 &nbsp;<strong>Authentication & Session Management</strong> — Secure user login/registration with JWT-based session management, token refresh, and automatic logout on inactivity.</li>

<li>🛡️ &nbsp;<strong>reCAPTCHA Protection</strong> — Google reCAPTCHA v2 integration on public-facing forms to prevent spam submissions.</li>

<li>🌐 &nbsp;<strong>Public Form Access</strong> — Share forms via public links; respondents can access and submit without a full user account.</li>

<li>🔍 &nbsp;<strong>Filter & Pagination</strong> — Filter and paginate through forms and responses for easy navigation of large datasets.</li>

<li>⚙️ &nbsp;<strong>Form Settings</strong> — Configure per-form settings including visibility, response limits, and scheduling.</li>

<li>🎨 &nbsp;<strong>Animated UI</strong> — Smooth page transitions and component animations using Framer Motion for a polished user experience.</li>

<li>🍪 &nbsp;<strong>Cookie Consent</strong> — GDPR-compliant cookie consent banner with a privacy policy page.</li>

<li>📱 &nbsp;<strong>Responsive Design</strong> — Fully responsive layout built with Tailwind CSS 4, optimized for desktop and mobile browsers.</li>

</ul>

---

## Project Structure

```
src/
├── App.tsx                     # Root component — routes, session init, layout
├── main.tsx                    # React entry point
├── index.css / App.css         # Global styles
├── helperFunc.ts               # Shared helper utilities
│
├── pages/                      # Top-level route pages
│   ├── Authentication.tsx      # Login & registration page
│   ├── Dashboard.tsx           # Main form dashboard
│   ├── FormPage.tsx            # Form builder / editor
│   ├── FilledFormPage.tsx      # View a single filled form
│   ├── UserResponsesPage.tsx   # List of respondents for a form
│   ├── ViewResponsePage.tsx    # View a specific respondent's answers
│   ├── ReplaceSession.tsx      # Handle respondent session replacement
│   ├── CollaboratorConfirmPage.tsx  # Confirm collaborator invite
│   ├── OwnershipConfirmPage.tsx     # Confirm ownership transfer
│   ├── PrivacyPolicyPage.tsx   # Privacy policy / GDPR page
│   └── NotFound.tsx            # 404 page
│
├── component/                  # Reusable UI components
│   ├── Animation/              # Framer Motion animation wrappers
│   ├── AutoSave/               # Auto-save UI indicator
│   ├── Card/                   # Form cards (FormCard, FilledFormCard, etc.)
│   ├── Cookie/                 # Cookie consent banner & footer
│   ├── Filter/                 # Filter section component
│   ├── FormComponent/          # Form builder elements
│   │   ├── Question/           # Individual question type components
│   │   ├── Setting/            # Per-form settings panel
│   │   ├── Solution/           # Answer/solution display
│   │   ├── TipTabEditor.tsx    # Rich text editor (Tiptap)
│   │   ├── QuestionComponent.tsx
│   │   ├── Input.tsx
│   │   ├── Selection.tsx
│   │   ├── Pagination.tsx
│   │   ├── EmailTemplate.tsx
│   │   └── recapcha.tsx
│   ├── FormOwnerManager/       # Collaborator management UI
│   ├── Loading/                # App & page loading spinners
│   ├── Modal/                  # Alert, setting, and form modals
│   ├── Navigator/              # Navigation bar, pagination, profile
│   ├── Notification/           # In-app notification system
│   ├── Response/               # Respondent form & analytics views
│   │   ├── RespondentForm.tsx  # Public respondent form
│   │   ├── PublicFormAccess.tsx
│   │   ├── ResponseAnalytics.tsx
│   │   ├── ResponseDashboard.tsx
│   │   └── GuestForm.tsx
│   ├── ResponseExport/         # PDF export system
│   ├── ResponseTemplate/       # Response display templates
│   ├── UserResponse/           # User response dashboard
│   ├── InactivityWarning.tsx   # Inactivity timeout alert
│   └── PageVisibilityAlert.tsx # Tab visibility change alert
│
├── hooks/                      # Custom React hooks
│   ├── APIHook/                # API-specific hooks
│   ├── useFormAPI.ts           # Form CRUD operations
│   ├── useFormsessionAPI.ts    # Form session management
│   ├── useUserSession.ts       # Authenticated user session
│   ├── useSessionManager.ts    # Session lifecycle management
│   ├── useSessionCheck.ts      # Session validation
│   ├── useImprovedAutoSave.ts  # Auto-save logic
│   ├── useInactivityWarning.ts # Inactivity detection
│   ├── usePublicFormAccess.ts  # Public form access flow
│   ├── useResponseNavigation.ts # Navigate between responses
│   ├── useResponseScoring.ts   # Response scoring logic
│   ├── useReturnResponse.ts    # Return/resume response
│   ├── useCookieConsent.ts     # Cookie consent state
│   └── ValidationHook.tsx      # Form validation hooks
│
├── redux/                      # Redux Toolkit state management
│   ├── store.tsx               # Redux store setup
│   ├── user.store.ts           # Authenticated user state
│   ├── formstore.ts            # Form editor state
│   ├── respondent.store.ts     # Respondent session state
│   ├── cookieConsent.store.ts  # Cookie consent state
│   └── openmodal.ts            # Modal open/close state
│
├── services/                   # Business logic & data services
│   ├── formOwnerService.ts     # Form ownership operations
│   ├── responseService.ts      # Response processing
│   ├── heroUIService.ts        # HeroUI component helpers
│   └── labelQuestionNumberingService.ts
│
├── types/                      # TypeScript type definitions
│   ├── Form.types.ts
│   ├── User.types.ts
│   ├── Login.types.ts
│   ├── Global.types.ts
│   ├── PublicFormAccess.types.ts
│   └── Cookie.types.ts
│
├── utils/                      # Shared utility functions
│   ├── formValidation.ts       # Form validation logic
│   ├── authRedirect.ts         # Auth redirect helpers
│   ├── responseUtils.ts        # Response data utilities
│   ├── respondentUtils.ts      # Respondent helpers
│   ├── cookieUtils.ts          # Cookie read/write helpers
│   ├── DateMutation.ts         # Date formatting utilities
│   └── questionMutataions.ts   # Question state mutations
│
├── config/
│   └── axiosInterceptor.ts     # Axios instance & interceptors
│
└── route/
    └── PrivateRoute.tsx        # Auth-guarded route wrapper
```

---

## Prerequisites

Before getting started, ensure you have the following installed:

- [Node.js](https://nodejs.org/) **v18+**
- [npm](https://www.npmjs.com/) **v9+** or [pnpm](https://pnpm.io/) / [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) _(optional, for containerized setup)_
- The [Graduate Tracer Backend](../GraduateTracerBackend_V2) running and accessible

---

## Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-org/graduate-tracer.git
cd graduate-tracer/GraduateTracer_FRONEND_V2
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Copy the example below and create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8000/v0/api
VITE_RECAPTCHA_KEY=your_google_recaptcha_v2_site_key
VITE_ENV=DEV
```

| Variable             | Description                                 |
| -------------------- | ------------------------------------------- |
| `VITE_API_URL`       | Base URL of the Graduate Tracer backend API |
| `VITE_RECAPTCHA_KEY` | Google reCAPTCHA v2 site key                |
| `VITE_ENV`           | Environment flag (`DEV` or `PROD`)          |

---

## Running the App

**Development server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

**Production build**

```bash
npm run build
```

**Preview production build**

```bash
npm run preview
```

---

## Available Scripts

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start the Vite development server    |
| `npm run build`         | Type-check and build for production  |
| `npm run build:analyze` | Build with bundle size visualizer    |
| `npm run preview`       | Preview the production build locally |
| `npm run lint`          | Run ESLint on the source files       |
| `npm run test`          | Run the Jest test suite              |
| `npm run test:watch`    | Run tests in watch mode              |

---

## Running with Docker

**Build the image**

```bash
docker build -t graduate-tracer-frontend .
```

**Run the container**

```bash
docker run -p 80:80 graduate-tracer-frontend
```

The app will be served by Nginx on `http://localhost:80`.

> The Docker image uses `nginx.conf` for serving the built SPA with client-side routing support and security headers.

---

## SNAPSHOTS
