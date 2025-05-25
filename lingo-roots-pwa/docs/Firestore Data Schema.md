# Firestore Data Schema for LingoRoots

This schema outlines the collection and subcollection structure used in the LingoRoots language learning app, optimized for Firebase Firestore.

---

## 🔖 Collection: `users`

Stores authentication and role-based information for all user types.

**Fields:**
- `userId` *(doc ID)* — Unique identifier for the user.
- `email`: String — User's email address.
- `displayName`: String — Name displayed in the app.
- `role`: String — One of `"learner"`, `"contentCreator"`, `"admin"`.
- `createdAt`: Timestamp — Account creation time.

### 🔽 Subcollection: `userProgress`

Tracks individual user progress per language.

**Doc ID**: `languageId`

**Fields:**
- `completedLessons`: Array of `lessonId` — Lessons the user has completed.
- `quizScores`: Map — `{quizId: score}`.
- `badges`: Array of Strings — Achievements earned.
- `currentStreak`: Number — Current daily streak.
- `points`: Number — Total gamified points earned.

---

## 🌍 Collection: `languages`

Represents each mother tongue/language taught.

**Fields:**
- `languageId` *(doc ID)* — Unique identifier (e.g., `duala`).
- `name`: String — Language name.
- `description`: String — Short summary about the language.
- `imageUrl`: String — Cover image/icon.
- `isActive`: Boolean — If the language is currently available.

### 🔽 Subcollection: `lessons`

Lessons organized by language.

**Doc ID**: `lessonId`

**Fields:**
- `title`: String — Lesson name/title.
- `order`: Number — Display order.
- `description`: String — Lesson summary.

**Content Fields:**
- `vocabulary`: Array of objects — `{ term, translation, example }`.
- `dialogues`: Array of objects — `{ speaker, line }`.
- `culturalTips`: String — Text explaining cultural context.
- `youtubeVideoUrl`: String — Optional embedded video link.

### 🔽 Subcollection: `quizzes`

**Doc ID**: `quizId`

**Fields:**
- `title`: String — Quiz title.

### 🔽 Subcollection: `questions`

**Doc ID**: `questionId`

**Fields:**
- `text`: String — Question prompt.
- `type`: Enum — `"multiple-choice"`, `"fill-blank"`, `"matching"`.
- `options`: Array — Only for multiple-choice.
- `correctAnswer`: String or Array — Depending on question type.

---

## 👩‍💻 CMS User Handling (via `users`)

All users are stored in the `users` collection. CMS access is determined by the `role` field.

**Roles:**
- `learner`: Can access and track lessons/quizzes.
- `contentCreator`: Can CRUD language content.
- `admin`: Can manage all users and languages.

---

## 🔐 Access Rules (for Firestore Security Rules)

- `users/{userId}`: Accessible only by the authenticated user or admin.
- `users/{userId}/userProgress/{languageId}`: Read/write by the user only.
- `languages`: Read by all; write only by content creators/admins.
- `lessons`, `quizzes`, `questions`: Read by all; write by content creators/admins.

---

## 🧩 Notes

- Denormalization is used to speed up read-heavy access.
- Subcollections allow modular progress tracking per language.
- Role-based access is key for structured permissions.

