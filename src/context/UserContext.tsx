import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as fbSignOut, deleteUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

type UserData = {
  uid: string;
  nickname?: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  totalEarned: number;
};

type UserContextType = {
  user: User | null;
  userData: UserData | null;
  authLoading: boolean;
  updateNickname: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  removeAccount: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({} as UserContextType);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setUserData({ uid: user.uid, ...snap.data() } as UserData);
      }
      setAuthLoading(false);
    }, () => { setAuthLoading(false); });
    return unsub;
  }, [user]);

  const updateNickname = async (nickname: string) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { nickname }, { merge: true });
  };

  const logout = async () => {
    await fbSignOut(auth);
  };

  const removeAccount = async () => {
    if (!user) return;
    try {
      await deleteUser(user);
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        throw new Error('보안을 위해 로그아웃 후 다시 로그인하고 탈퇴해주세요.');
      }
      throw e;
    }
  };

  return (
    <UserContext.Provider value={{ user, userData, authLoading, updateNickname, logout, removeAccount }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
