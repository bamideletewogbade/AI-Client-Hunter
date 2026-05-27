import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  auth, 
  isFirebaseConfigured, 
  googleProvider 
} from '../firebase';

// Toggle this to true for development — auto-logs a test user without needing the auth modal
const DEV_BYPASS_AUTH = true;

// Hardcoded test account credentials (always works when DEV_BYPASS_AUTH is active)
const TEST_ACCOUNT = {
  email: 'test@sgtshow.com',
  password: 'test123',
};

interface SgtUser extends Partial<User> {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isCommunityMember: boolean;
}

interface AuthContextType {
  user: SgtUser | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SgtUser | null>(null);
  const [loading, setLoading] = useState(true);

    // Synchronize Auth State
  useEffect(() => {
    // DEV BYPASS — auto-authenticate as test user so no modal interaction is needed
    if (DEV_BYPASS_AUTH) {
      const savedUser = localStorage.getItem('sgt_simulated_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // ignore
        }
      } else {
        const testUser: SgtUser = {
          uid: 'dev-test-user',
          displayName: 'Test Investor',
          email: TEST_ACCOUNT.email,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
          isCommunityMember: true,
        };
        setUser(testUser);
        localStorage.setItem('sgt_simulated_user', JSON.stringify(testUser));
      }
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      // Look for a persisted simulated session
      const savedUser = localStorage.getItem('sgt_simulated_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          isCommunityMember: true
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auth Operations
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      const mock = {
        uid: "mock-user-google",
        displayName: "African Investor (Google)",
        email: "investor@sgtshow.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
        isCommunityMember: true
      };
      setUser(mock);
      localStorage.setItem('sgt_simulated_user', JSON.stringify(mock));
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            message: "Connected with simulated Google credentials. Auto-joined SGT Hub community (Yes).",
            type: 'success'
          }
        })
      );
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication popup failed:", error);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!isFirebaseConfigured || !auth) {
      const mock = {
        uid: "mock-" + Date.now(),
        displayName: name,
        email: email,
        photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop",
        isCommunityMember: true
      };
      setUser(mock);
      localStorage.setItem('sgt_simulated_user', JSON.stringify(mock));
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            message: `Account created for ${name}! Auto-joined SGT Show Community (Yes).`,
            type: 'success'
          }
        })
      );
      return;
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
      setUser({
        uid: userCredential.user.uid,
        displayName: name,
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL,
        isCommunityMember: true
      });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { message: `Account created! Welcome to the SGT Show Community.`, type: 'success' }
        })
      );
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    // Hardcoded test account — always works during development
    if (DEV_BYPASS_AUTH && email === TEST_ACCOUNT.email && pass === TEST_ACCOUNT.password) {
      const mock: SgtUser = {
        uid: 'mock-test-account',
        displayName: 'Test Investor',
        email: TEST_ACCOUNT.email,
        photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=256&auto=format&fit=crop',
        isCommunityMember: true,
      };
      setUser(mock);
      localStorage.setItem('sgt_simulated_user', JSON.stringify(mock));
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { message: 'Test account signed in. SGT Show Community membership: Yes.', type: 'success' }
        })
      );
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      const mock = {
        uid: "mock-user-email",
        displayName: email.split('@')[0],
        email: email,
        photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=256&auto=format&fit=crop",
        isCommunityMember: true
      };
      setUser(mock);
      localStorage.setItem('sgt_simulated_user', JSON.stringify(mock));
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: {
            message: `Signed in successfully. SGT Show Community membership: Yes.`,
            type: 'success'
          }
        })
      );
      return;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (userCredential.user) {
      setUser({
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        photoURL: userCredential.user.photoURL,
        isCommunityMember: true
      });
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { message: `Welcome back to SGT Show!`, type: 'success' }
        })
      );
    }
  };

  const logout = async () => {
    localStorage.removeItem('sgt_simulated_user');
    if (DEV_BYPASS_AUTH || !isFirebaseConfigured || !auth) {
      setUser(null);
      window.dispatchEvent(
        new CustomEvent('show-toast', {
          detail: { message: "Disengaged account session. Refresh the page to auto-login as Test Investor.", type: 'info' }
        })
      );
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out fail:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
