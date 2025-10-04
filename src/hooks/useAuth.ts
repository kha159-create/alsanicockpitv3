


import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase.js';
import type { User, UserProfile } from '../types.js';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, profile: null, loading: true });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          let userProfile: UserProfile | null = null;
          
          // Strategy 1: Assume document ID is user's UID (most efficient)
          const docRef = db.collection('users').doc(user.uid);
          const userDocById = await docRef.get();
          
          if (userDocById.exists) {
              userProfile = userDocById.data() as UserProfile;
          } else {
              // Strategy 2: If not found, query for a document with a matching 'uid' field
              const usersRef = db.collection('users');
              const userQuery = await usersRef.where('uid', '==', user.uid).limit(1).get();
              if (!userQuery.empty) {
                  userProfile = userQuery.docs[0].data() as UserProfile;
              }
          }

          if (userProfile) {
              setAuthState({ user, profile: userProfile, loading: false });
          } else {
              // If both strategies fail, use a safe fallback
              console.warn(`No profile document found for user with uid ${user.uid}. Falling back to default profile.`);
              // FIX: Add missing 'id' property to satisfy UserProfile type.
              const fallbackProfile: UserProfile = {
                  id: user.uid,
                  name: user.displayName || user.email?.split('@')[0] || 'User',
                  email: user.email || '',
                  role: 'employee', // default safe role
              };
              setAuthState({ user, profile: fallbackProfile, loading: false });
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // On error, also use a safe fallback to prevent app from crashing
            // FIX: Add missing 'id' property to satisfy UserProfile type.
            const errorFallbackProfile: UserProfile = {
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || '',
                role: 'employee',
            };
            setAuthState({ user, profile: errorFallbackProfile, loading: false });
        }
      } else {
        setAuthState({ user: null, profile: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};