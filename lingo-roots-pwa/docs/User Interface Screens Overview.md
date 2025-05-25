# User Interface Screens Overview (.md for TRAE Knowledge Base)

This document provides a comprehensive overview of all screens required for the Mother Tongue Language Learning Web Application. Each screen includes a brief description and purpose, helping to guide UI/UX design, development tasks, and AI-assisted automation within TRAE.

---

## 1. **Welcome / Splash Screen**

**Purpose:** Brief introductory screen displayed when the app is first launched. Reinforces branding.

---

## 2. **Authentication Screens**

* **Login Screen**

  * **Fields:** Email, Password
  * **Actions:** Login, Forgot Password, Navigate to Register
* **Registration Screen**

  * **Fields:** Name, Email, Password, Confirm Password
  * **Actions:** Register, Navigate to Login
* **Password Recovery Screen**

  * **Fields:** Email
  * **Actions:** Send Reset Link

**Purpose:** Allows user access control via Firebase Authentication.

---

## 3. **Language Selection Screen**

**Purpose:** Enables users to choose their target language (e.g., Duala, Bassa, etc.)

* **Content:** Language cards with flag icons, brief descriptions, and progress indicators.

---

## 4. **Home Dashboard (Learner)**

**Purpose:** Serves as the central hub for the learner.

* **Content:** Quick stats (points, streaks), recent activity, available lessons and quizzes, progress bar.

---

## 5. **Lesson Browser Screen**

**Purpose:** Displays a list of available lessons.

* **Content:** Lesson cards sorted by order, title, brief description, completed status.

---

## 6. **Lesson Detail Screen**

**Purpose:** Shows vocabulary, dialogues, cultural tips, and YouTube videos.

* **Content:** Interactive content sections, next/back navigation, progress tracker.

---

## 7. **Quiz List Screen**

**Purpose:** Displays all quizzes available for a specific lesson or language.

* **Content:** Quiz cards with completion badges, scores, retry button.

---

## 8. **Quiz Play Screen**

**Purpose:** Allows learners to answer various types of questions (MCQ, fill-in-the-blank, match).

* **Content:** Question prompts, answer fields/options, submit navigation.

---

## 9. **Progress Tracker Screen**

**Purpose:** Shows learner’s performance metrics.

* **Content:** Graphs (scores, streaks, accuracy), badges earned, lesson completion.

---

## 10. **Offline Content Screen**

**Purpose:** Lists downloaded lessons and quizzes available for offline learning.

---

## 11. **CMS Dashboard (Content Creators/Admins)**

**Purpose:** Administrative portal for managing content.

* **Content:** Role-gated views, language and lesson management, quiz editor, media uploads.

---

## 12. **Lesson Editor Screen (CMS)**

**Purpose:** CRUD interface for lesson content.

* **Content:** Vocabulary table, dialogues editor, cultural tips, embedded media.

---

## 13. **Quiz Editor Screen (CMS)**

**Purpose:** CRUD interface for creating/editing quiz questions.

* **Content:** Question form, type selector, options builder, correct answers selector.

---

## 14. **User Management Screen (Admin)**

**Purpose:** Allows admin to view/manage users.

* **Content:** User list, roles, recent activity, block/suspend options.

---

## 15. **Language Management Screen (Admin)**

**Purpose:** CRUD operations for supported languages.

* **Content:** Language name, description, image, activation toggle.

---

## 16. **Settings Screen**

**Purpose:** User preference configuration.

* **Content:** Language toggle (EN/FR), notification preferences, dark mode.

---

## 17. **About/Help Screen**

**Purpose:** Displays information about the app, links to tutorials, contact info.

---

## 18. **Error / 404 Page**

**Purpose:** Shown when an invalid route is accessed.

---

### Notes:

* All screens must be accessible (a11y).
* Each screen must support multilingual UI (EN/FR).
* Service worker caching will support offline access where noted.

---

**Ready for UI design and TRAE integration.**
