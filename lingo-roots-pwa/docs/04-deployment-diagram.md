# Deployment Diagram (Firebase Conceptual View)

## Nodes
- **User Devices**: Desktop, Mobile Browsers
- **Firebase Infrastructure**: Cloud-hosted services

## Artifacts / Execution Environments
- React Build: HTML, CSS, JS deployed to Firebase Hosting
- Firebase Authentication Service
- Firestore Database
- Firebase Functions (Node.js runtime)

## Communication Paths
- Users access via Firebase Hosting URL
- Client securely interacts with Firebase Authentication, Firestore, Functions over HTTPS
- All hosted and served within Firebase’s global infrastructure
