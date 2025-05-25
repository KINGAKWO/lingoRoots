import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase'; // Corrected import path
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  async function signup(email, password, role = 'learner', additionalData = {}) { // Ensure role defaults to 'learner'
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userDocData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: additionalData.displayName || `${additionalData.firstName} ${additionalData.lastName}` || userCredential.user.email, // Ensure displayName is set
      role: role, // Default role is 'learner'
      createdAt: serverTimestamp(),
    };
    // Add other fields from additionalData, but exclude ones already set or not part of the core user schema
    const { firstName, lastName, primaryLanguageInterest, ...otherData } = additionalData;
    if (firstName) userDocData.firstName = firstName;
    if (lastName) userDocData.lastName = lastName;
    if (primaryLanguageInterest) userDocData.primaryLanguageInterest = primaryLanguageInterest;

    await setDoc(doc(db, 'users', userCredential.user.uid), { ...userDocData, ...otherData });
    // No need to manually set currentUser and userRole here, onAuthStateChanged will handle it
    return userCredential;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Prioritize custom claims for role
          const idTokenResult = await getIdTokenResult(user);
          const claimsRole = idTokenResult.claims.role;

          if (claimsRole) {
            setUserRole(claimsRole);
            // Optionally, update Firestore if claims are canonical and Firestore is a mirror
            // const userDocRef = doc(db, 'users', user.uid);
            // await setDoc(userDocRef, { role: claimsRole }, { merge: true });
          } else {
            // Fallback to Firestore if no role claim is present
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUserRole(userDocSnap.data().role);
            } else {
              console.warn("No user document found in Firestore for UID:", user.uid);
              setUserRole(null); // Or a default/guest role
            }
          }
        } catch (error) {
          console.error("Error fetching user role or claims:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user: currentUser,
    role: userRole,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}