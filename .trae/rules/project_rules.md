# 📘 Project Rules & Development Standards for LingoRoots

## 🚀 Overview

This document defines the technical and procedural standards that AI agents and developers must follow for the LingoRoots language learning app. It is optimized for use in TRAE IDE with Firebase MCP integration.

---

## 📁 1. Project Structure

```
/src
  /components        → Reusable UI elements
  /pages             → Page-level components
  /layouts           → Shared layout wrappers
  /services          → Firebase & API logic
  /hooks             → Custom hooks
  /context           → App-wide state (Auth, Roles)
  /assets            → Static resources
  /utils             → Utility functions
```

---

## ⚛️ 2. Component Development

* Use React functional components only
* Use React hooks for logic
* Follow Atomic Design:

  * Atoms: Basic elements
  * Molecules: Combinations of atoms
  * Organisms: Complex UI sections
* Prop validation via PropTypes or TypeScript
* Naming conventions:

  * Components: `PascalCase`
  * Functions/Variables: `camelCase`

---

## 🎨 3. Styling & Design

* Mobile-first & responsive using Tailwind CSS
* Theme Colors:

  * Marine Blue, Sky Blue, Black, White
* Fonts: Accessible sans-serif (Inter or Open Sans)
* Spacing system: Base-4 or Base-8
* Follow WCAG 2.1 accessibility standards

---

## 🔐 4. Authentication & Roles

* Firebase Auth for user login
* Roles stored in Firestore: `/users/{uid}/role`
* Role Access:

  * Learner: Practice, Quizzes
  * Content Creator: Upload material
  * Admin: User & content management

---

## 🧠 5. Firestore Structure & Rules

* Use subcollections for scalability:

  * `/languages/{lang}/modules/{id}`
  * `/languages/{lang}/quizzes/{id}`
* Include metadata fields: `createdAt`, `updatedAt`, `createdBy`
* Use denormalization for read efficiency

---

## 🔥 6. Cloud Functions & Security

* Written in TypeScript
* Input validation (Zod or Joi)
* Modular & unit-tested
* Firestore Security Rules:

  * Auth-based access
  * Role-based permissions
  * Read/write limits with `.where()` and `.limit()`

---

## 🧪 7. Testing Standards

* Unit: Jest
* Component: React Testing Library
* Firebase: Emulator Suite
* Test coverage: ≥ 80%

---

## ⚙️ 8. Deployment & CI/CD

* Hosting via Firebase
* CI with GitHub Actions
* Deploy `main` to production
* Preview deploys:

```bash
firebase hosting:channel:deploy feature-X
```

---

## 🤖 9. AI/MCP Prompting Guidelines

* Prompts must specify:

  * Output format (e.g. JSX, JSON, REST API)
  * Component context
  * User role involved
* AI-generated code must:

  * Follow naming conventions
  * Include developer comments

---

## 📘 10. Documentation Standards

* Each component should have:

  * JSDoc/TSDoc
  * Example usage
* Use a `/docs` directory or Docusaurus
* README should include:

  * Setup guide
  * Script list
  * PRD/SRS diagrams and links

