# Use Case Diagram

## Actors
- **Learner**
- **Content Creator**
- **Administrator**
- **Firebase Authentication System** (implicit)

## System Boundary
- **Mother Tongue Language Learning Web App**

## Key Use Cases
### Learner
- Register
- Login
- Select Language
- View Lesson
- Take Quiz
- Track Progress
- Access Content Offline

### Content Creator
- Login to CMS
- Manage Lessons (CRUD)
- Manage Quizzes (CRUD)
- Publish Content

> Note: Manage Lessons/Quizzes can be generalized use cases with <<include>> or <<extend>> for specific content types.

### Administrator
- Manage Users
- Manage Languages
- Inherits all Content Creator capabilities

## Relationships
- Use <<include>>, <<extend>>, and generalization relationships for detailed diagrams.
