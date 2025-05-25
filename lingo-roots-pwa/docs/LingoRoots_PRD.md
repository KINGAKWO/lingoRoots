# Product Requirements Document (PRD)

## Project Title: LingoRoots - Native Language Learning Web App

## 1. Overview

**Purpose:**  
LingoRoots is a bilingual, web-based platform designed to preserve and promote Cameroonian culture through the interactive and gamified teaching of local languages. This MVP version focuses on Duala, a native language of Cameroon, using content sourced from [http://duala.douala.free.fr/index_uk.htm](http://duala.douala.free.fr/index_uk.htm).

**Core Mission:**  
To preserve and promote Cameroonian culture—especially native languages—through fun, accessible, and interactive learning experiences.

## 2. Target Audience

- Cameroonians at home and abroad (diaspora).
- Tourists interested in local languages and culture.
- Bilingual users fluent in English and/or French.
- Children, youth, and adults with basic literacy.

## 3. Core Features

### Learner Features
- User Authentication (Firebase Auth)
- Select Language to Learn (MVP: Duala)
- View Lessons (Vocabulary, Dialogues, Cultural Tips, YouTube Video Embeds)
- Take Quizzes (MCQ, Fill-in-the-Blank, Matching)
- Track Progress (Points, Streaks, Badges, Completed Lessons)
- Offline Access (via Service Worker)

### Content Creator Features
- Login to CMS via Firebase Auth
- Manage Lessons (Create, Read, Update, Delete)
- Manage Quizzes (CRUD)
- Publish Content

### Admin Features
- Manage Users (View, Promote, Deactivate)
- Manage Supported Languages (Add, Archive)
- Inherits all Content Creator capabilities

## 4. Success Metrics

- Completion of MVP lessons and quizzes for Duala.
- Completion rate of first 3 lessons by learners.
- Quiz accuracy (average > 70% for active learners).
- % of content creators actively publishing.
- Multilingual UI (English + French toggle).
- Minimum 100 DAUs (Daily Active Users) within 3 months.

## 5. Technical Requirements

### Tech Stack
- **Frontend:** React + TailwindCSS / Material UI (whichever is more performant)
- **Backend:** Firebase (Firestore, Auth, Functions, Hosting)
- **MCP (Multi-client programming):** Trae IDE with AI-powered features for prompt-driven generation

### Firebase Structure (Simplified)
- `users/` → user data + `userProgress/`
- `languages/` → each has `lessons/` and `quizzes/`
- `quizzes/` → each has `questions/`
- Role-based access control via Firebase Auth

## 6. Design & UX Considerations

- Responsive UI for both desktop and mobile.
- Multilingual interface (EN/FR switcher)
- Accessibility (alt tags, keyboard nav, font size, contrast)
- Consistent color scheme with cultural relevance.
- Learner progress gamified with badges and points.

## 7. Out-of-Scope (MVP)

- Audio pronunciation features.
- Speech recognition.
- Real-time chat or tutor sessions.
- Non-Cameroonian native languages.

## 8. Reference Material

- Language content: [http://duala.douala.free.fr/index_uk.htm](http://duala.douala.free.fr/index_uk.htm)
- Design inspiration: Screenshot of traditional Duala learning website.
- Data model and diagrams: Firestore schema, use case, system architecture.

---

**Last Updated:** May 2025  
**Author:** Trae IDE x ChatGPT (AI-Pair Programming)