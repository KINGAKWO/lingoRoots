# Firebase Authentication & Role-Based Access Control

## Overview

This document outlines the authentication flow and role-based permissions model for the **LingoRoots** web app, which uses Firebase Authentication and Firestore to manage secure user access across three primary roles: **Learner**, **Content Creator**, and **Administrator**.

## Supported Roles

| Role            | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Learner         | Can register/login, choose languages, access lessons/quizzes, track progress. |
| Content Creator | Can create/update lessons and quizzes, access CMS features.                   |
| Administrator   | Full access: manage users, content, and languages. Inherits creator rights.   |

## Authentication Flow

1. User signs up or logs in via Firebase Authentication (email/password or social).
2. A user document is created in Firestore under `/users/{userId}`.
3. The user's role is stored in this document and/or assigned via Firebase Custom Claims.

## Firestore User Document Example

```json
/users/{userId} {
  "displayName": "Jane Doe",
  "email": "jane@example.com",
  "role": "contentCreator",
  "createdAt": Timestamp
}
```

## Role Assignment Logic

* On sign-up, default role = `learner`.
* Admins can promote users to `contentCreator` or `admin` via a secure admin panel.
* For elevated roles, use Firebase Admin SDK to set [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims) or mirror in Firestore.

## Firebase Security Rules (Example)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /languages/{langId}/lessons/{lessonId} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ["contentCreator", "admin"];
    }

    match /admin/{document=**} {
      allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
  }
}
```

## Integration Touchpoints (React)

* **AuthContext**: Wrap app with Firebase Auth Provider to track user and role.
* **ProtectedRoute**: Conditionally render components based on `user.role`.

```js
<Route path="/cms" element={user?.role === 'contentCreator' ? <CMS /> : <Navigate to="/" />} />
```

## Sign-Up & Login UI Flows

1. **Sign-Up Page**

   * Inputs: Name, Email, Password
   * Default role = `learner`

2. **Login Page**

   * Auth via Firebase
   * Fetch Firestore role after login

## Tips for Using TRAE IDE + MCP

* Provide user role context when prompting:

  ```
  Generate a lesson editor component only accessible by contentCreators.
  ```
* Use `.md` files like this as persistent knowledge base inputs.


