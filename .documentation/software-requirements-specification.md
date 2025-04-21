# Software Requirements Specification: CNCCUT.APP

## System Design

* **Type:** Web-based Software as a Service (SaaS) application.
* **Primary Interface:** Web application built with Next.js, accessed via modern web browsers, primarily targeting desktop use. Leverages Server-Side Rendering (SSR) or Static Site Generation (SSG) where appropriate for performance and SEO.
* **Core Functionality:** Enables users to configure custom timber parts using parametric templates, receive real-time quotes and lead times, place orders, and manage their account/order history. Includes automated generation of production-ready files (DXF initially) for the manufacturing backend.

## Architecture pattern

* **Overall:** Client-Server architecture, potentially leveraging Next.js features like SSR/SSG and API routes.
* **Framework:** Next.js handles frontend rendering (React components), routing, and potentially backend API endpoints (API Routes).
* **Backend Logic:** Complex business logic, database interactions, external service integrations (payment gateway), and file generation can reside within Next.js API routes or a separate dedicated Node.js service (especially if microservices are planned later or for heavy background tasks).
* **Database:** Relational database (suggestion: PostgreSQL) to store structured data like user accounts, orders, materials, etc.

## State management

* **Frontend (React within Next.js):**
    * Local component state for UI elements and form inputs.
    * Shared application state (e.g., user authentication status, shopping cart, configuration parameters) managed using React Context API or a dedicated state management library like Zustand.
    * Server cache state managed via data fetching libraries (e.g., React Query/TanStack Query or SWR) integrated with Next.js data fetching methods (`getServerSideProps`, `getStaticProps`, client-side fetching).
* **Backend (Next.js API Routes / Separate Node.js):**
    * Stateless API design preferred. User session state managed via tokens (e.g., JWT).

## Data flow

1.  **User Interaction:** User interacts with the Next.js frontend (React components).
2.  **Frontend State Update:** Local/shared state updated.
3.  **Visualiser Update:** 3D visualiser component re-renders.
4.  **API Request:** Frontend component (client-side or via Next.js data fetching methods) sends requests to Next.js API routes (e.g., `POST /api/configure/preview`) or a separate backend API.
5.  **Backend Processing (API Route/Service):** Receives request, validates, interacts with DB, calculates price/lead time.
6.  **API Response:** Returns JSON response.
7.  **Frontend Update:** Updates state and UI.
8.  **Ordering:** Cart -> Checkout -> Order data sent to API route (`POST /api/orders`).
9.  **Order Processing:** API route/service validates, processes payment, saves to DB, triggers file generation, returns response.
10. **Data Persistence:** Database interaction managed by the backend logic (API routes or separate service).

## Technical Stack

* **Framework:** Next.js (includes React)
* **Backend Runtime (if separate):** Node.js (with Express.js or Fastify) - *May not be needed initially if API routes in Next.js suffice.*
* **UI Component Library:** Shadcn/ui
* **CSS Framework:** Tailwind CSS
* **State Management:** React Context API or Zustand
* **Data Fetching/Server Cache:** React Query/TanStack Query or SWR (integrated with Next.js)
* **3D Visualiser:** Three.js with React Three Fiber (r3f)
* **Database:** PostgreSQL
* **ORM/Query Builder:** Prisma or TypeORM
* **Authentication:** JWT (JSON Web Tokens)
* **Payment Gateway Integration:** Stripe API
* **File Generation (Backend Logic):** Library like `dxf-writer` or custom solution (within API route or separate service).
* **Deployment:** Platform optimised for Next.js (e.g., Vercel), or other PaaS/cloud providers.

## Authentication Process

1.  **Registration:** User submits form -> Frontend sends details to `POST /api/auth/register` (Next.js API route) -> API route validates, hashes password, creates user -> Returns success/JWT.
2.  **Login:** User submits credentials -> Frontend sends to `POST /api/auth/login` (Next.js API route) -> API route verifies credentials -> Generates JWT -> Returns JWT.
3.  **Token Storage:** Frontend stores JWT securely. **Consider using `HttpOnly` cookies**, which Next.js API routes can set/read, enhancing security compared to `localStorage`.
4.  **Authenticated Requests:**
    * If using cookies: Browser automatically sends the cookie with requests to the same domain.
    * If using Bearer token: Frontend includes JWT in `Authorization` header.
5.  **Backend Verification:** Next.js API route middleware (or middleware in a separate service) verifies the token/cookie on protected routes.
6.  **Logout:** Frontend removes stored token (if applicable) -> Calls `POST /api/auth/logout` which clears the `HttpOnly` cookie and potentially invalidates the session/token server-side.

## Route Design

* **Frontend Pages (Next.js `pages` or `app` directory):**
    * `/login`
    * `/register`
    * `/` (index, redirects)
    * `/dashboard`
    * `/configure/new`
    * `/configure/item/[templateId]` (Dynamic route for templates)
    * `/configure/edit/[configId]` (Dynamic route for edits)
    * `/cart`
    * `/checkout`
    * `/orders`
    * `/orders/[orderId]` (Dynamic route for order details)
    * `/account`
    * `/materials`
* **Backend API Routes (Next.js `pages/api` or `app/api` directory):**
    * `/api/auth/register` (POST)
    * `/api/auth/login` (POST)
    * `/api/auth/logout` (POST)
    * `/api/auth/me` (GET)
    * `/api/parts/templates` (GET)
    * `/api/parts/templates/[id]` (GET - dynamic route)
    * `/api/configure/preview` (POST)
    * `/api/materials` (GET)
    * `/api/orders` (POST, GET)
    * `/api/orders/[orderId]` (GET - dynamic route)
    * `/api/users/me` (GET, PUT)

## API Design

* **Style:** RESTful principles applied to Next.js API routes.
* **Data Format:** JSON.
* **Authentication:** Via JWT (sent in `Authorization` header or preferably via secure `HttpOnly` cookies managed by Next.js API routes).
* **Key Endpoint Examples:** (Functionally same as before, implemented as API routes)
    * `POST /api/auth/login`: `{ email, password }` -> `{ userDetails }` (Sets HttpOnly cookie with token)
    * `POST /api/configure/preview`: `{ templateId, parameters: {...}, materialId, quantity }` -> `{ price, leadTimeEstimate, validationErrors }`
    * `GET /api/materials`: -> `[ { id, name, ... } ]`
    * `POST /api/orders`: `{ cartItems: [...], ... }` -> `{ orderId, status, ... }`
    * `GET /api/orders`: -> `[ { orderId, ... } ]`
* **Error Handling:** Use standard HTTP status codes and JSON error bodies within API routes.

## Database Design ERD (Textual Description)

* *(No changes from the previous version - the database structure remains the same)*
* **`Users` Table:** (user\_id PK, email, password\_hash, ...)
* **`Materials` Table:** (material\_id PK, name, thickness\_mm, stock\_status, ...)
* **`Orders` Table:** (order\_id PK, user\_id FK, order\_date, status, total\_cost, ...)
* **`OrderItems` Table:** (order\_item\_id PK, order\_id FK, material\_id FK, quantity, item\_configuration JSONB, ...)
* **`PartTemplates` Table:** (template\_id PK, name, parameter\_schema JSONB, ...)
* **Relationships:** (Remain the same: User-Orders, Order-OrderItems, OrderItem-Material)