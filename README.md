# HomeVista - Server Side

This is the **server-side** of the website **[HomeVista](https://home-vista-51860.web.app/)** — a real estate platform that enables users to browse and purchase properties, agents to manage listings, and admins to control and verify platform activities.

> 🔗 Replace the link above with your actual GitHub repo or deployed server URL.

---

## ⚙️ Technologies Used

- **Node.js** – JavaScript runtime
- **Express.js** – Web framework
- **MongoDB** – Database for storing all application data
- **Firebase Admin SDK** – User role verification and secure operations
- **jsonwebtoken (JWT)** – For issuing and verifying access tokens
- **dotenv** – For managing environment variables
- **CORS** – Cross-Origin Resource Sharing middleware

---

## 🔐 Authentication & Authorization

### 🔸 Firebase Authentication
- Firebase Admin SDK is used to verify user identities.
- Admin roles and permissions are managed securely from Firebase.

### 🔸 JWT Tokens
- On successful login, users receive a JWT token.
- All protected routes require token verification through custom middleware.

---

## 🔒 Secure Routing

- All sensitive routes are protected using **JWT-based authentication**.
- Role-based access is implemented to restrict features by user type (User, Agent, Admin).

---

## 🗃️ MongoDB Collections

The server uses multiple collections to organize and manage data:

- `users` – Stores user data and roles
- `properties` – Holds property listings from agents
- `bookings` – Manages property purchases by users
- `reviews` – User comments and feedback for agents
- `fraudReports` – Logs agents reported as fraudulent

---

