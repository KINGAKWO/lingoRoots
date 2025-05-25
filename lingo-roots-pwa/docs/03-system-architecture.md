# System Architecture Diagram

## Components

### Client-Side (User's Browser)
- **React Application**: UI Components, State Management, Routing, Service Worker

### Firebase Services (Backend)
- **Firebase Hosting**: Serves React app
- **Firebase Authentication**: Manages login/sign-up
- **Firestore Database**: Stores app data
- **Firebase Functions**: Backend logic (if needed)

### External Services
- **YouTube**: Embedded video content

## Interactions
- User interacts with the React App
- React communicates with Firebase Authentication, Firestore, and Functions
- React embeds YouTube videos
- Service Worker handles offline support

## CMS Integration
- Uses same React App
- Access control via roles in Firebase Authentication
