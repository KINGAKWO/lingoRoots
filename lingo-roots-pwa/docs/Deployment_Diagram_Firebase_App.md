
# Deployment Diagram: Mother Tongue Language Learning App

This deployment diagram provides a conceptual overview of how the application is hosted, the execution environments, and how users interact with the system.

## 📡 Nodes

### 1. User Devices (Frontend)
- **Device Types**: Desktop and Mobile Browsers
- **Execution Environment**: Web Browser
- **Responsibilities**:
  - Running the React-based PWA
  - Caching content for offline use via Service Worker
  - Interacting with Firebase backend services

### 2. Firebase Global Infrastructure (Backend)
- **Hosting**: Firebase Hosting serves the compiled React app
- **Authentication**: Firebase Authentication manages user accounts and roles
- **Database**: Firestore (NoSQL) stores structured data (users, lessons, progress, etc.)
- **Functions**: Firebase Functions run backend logic (e.g. admin tasks, complex validations)

## ⚙️ Execution Artifacts

| Component         | Description |
|------------------|-------------|
| `index.html`     | Main HTML entry point |
| `bundle.js`      | Compiled React JavaScript bundle |
| `firebase.json`  | Firebase configuration for hosting and rewrites |
| `functions/`     | Cloud Functions (Node.js) |
| `firestore.rules`| Security rules for database access |

## 🔄 Communication Paths

- Users access the web app via Firebase Hosting domain (`https://<project-id>.web.app`).
- The React app interacts with:
  - **Authentication**: via `firebase.auth()`
  - **Firestore**: via `firebase.firestore()` for real-time data sync
  - **Functions**: via `firebase.functions()` for callable or HTTP functions
- HTTPS ensures secure communication.

## 🧩 Integration Summary

This deployment setup leverages the serverless, scalable Firebase ecosystem to ensure fast loading, secure access, and smooth operation both online and offline.

## 📌 Diagram (Textual Representation)

```
  [User Device: Browser]
         |
         v
  [Firebase Hosting (Static Assets)]
         |
         v
  [Firebase Authentication]
         |
         v
  [Firestore Database]
         |
         v
  [Firebase Cloud Functions]
         |
         v
    [External APIs: YouTube]
```

---

> ✅ This file is optimized for TRAE's knowledge base ingestion.
