import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  isFirebaseConfigured, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { Lead } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  crmLeads: Lead[];
  leadsLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  saveLead: (lead: Lead) => Promise<boolean>;
  updateLeadStatus: (id: string, nextStatus: Lead['status']) => Promise<boolean>;
  updateLeadDetails: (lead: Lead) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Synchronize Auth State
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize Firestore Leads in Real-Time when logged in
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) {
      setCrmLeads([]);
      return;
    }

    setLeadsLoading(true);
    const leadsCollectionPath = `users/${user.uid}/leads`;
    const q = query(collection(db, leadsCollectionPath));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedLeads: Lead[] = [];
        snapshot.forEach((docSnap) => {
          fetchedLeads.push(docSnap.data() as Lead);
        });
        
        // Sort leads by creation date descending
        fetchedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCrmLeads(fetchedLeads);
        setLeadsLoading(false);
      },
      (error) => {
        setLeadsLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, leadsCollectionPath);
        } catch (wrappedErr) {
          console.error("Firestore sync error:", wrappedErr);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Auth Operations
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      alert("Firebase setup is needed! Please configure Firebase inside the AI Studio console UI first.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication popup failed:", error);
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out fail:", error);
    }
  };

  // Safe Database Writes implementing user scope and error-wrapping
  const saveLead = async (lead: Lead): Promise<boolean> => {
    // Lead needs to include the userId for security rule validation
    const leadWithUser = {
      ...lead,
      userId: user?.uid || 'guest'
    };

    if (!isFirebaseConfigured || !db || !user) {
      // Offline fallback: handled by parent App.tsx endpoint proxy calls
      return false;
    }

    const path = `users/${user.uid}/leads/${lead.id}`;
    try {
      await setDoc(doc(db, `users/${user.uid}/leads`, lead.id), leadWithUser);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return false;
    }
  };

  const updateLeadStatus = async (id: string, nextStatus: Lead['status']): Promise<boolean> => {
    if (!isFirebaseConfigured || !db || !user) {
      return false;
    }

    const path = `users/${user.uid}/leads/${id}`;
    try {
      await updateDoc(doc(db, `users/${user.uid}/leads`, id), {
        status: nextStatus
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const updateLeadDetails = async (lead: Lead): Promise<boolean> => {
    if (!isFirebaseConfigured || !db || !user) {
      return false;
    }

    const path = `users/${user.uid}/leads/${lead.id}`;
    try {
      await setDoc(doc(db, `users/${user.uid}/leads`, lead.id), {
        ...lead,
        userId: user.uid
      }, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    if (!isFirebaseConfigured || !db || !user) {
      return false;
    }

    const path = `users/${user.uid}/leads/${id}`;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/leads`, id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      crmLeads,
      leadsLoading,
      signInWithGoogle,
      logout,
      saveLead,
      updateLeadStatus,
      updateLeadDetails,
      deleteLead
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
