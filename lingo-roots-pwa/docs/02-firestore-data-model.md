# Firestore Data Model (Collection-Subcollection Structure)

## Collections

### users
- **Fields**: userId (doc ID), email, displayName, role (learner, contentCreator, admin), createdAt
- **Subcollection: userProgress**
  - **Doc ID**: languageId
  - **Fields**: completedLessons (array), quizScores (map), badges (array), currentStreak, points

### languages
- **Fields**: languageId (doc ID), name, description, imageUrl, isActive
- **Subcollection: lessons**
  - **Fields**: lessonId (doc ID), title, order, description
  - **Content**: vocabulary (array), dialogues (array), culturalTips, youtubeVideoUrl
  - **Subcollection: quizzes**
    - **Fields**: quizId (doc ID), title
    - **Subcollection: questions**
      - **Fields**: questionId (doc ID), text, type, options, correctAnswer(s)

### cmsUsers
- Managed via users collection using the `role` field.
