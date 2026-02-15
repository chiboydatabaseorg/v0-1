"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth, db, doc, getDoc, onSnapshot } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"
import type { UserProfile } from "./types"

interface AuthContextType {
  user: UserProfile | null
  firebaseUser: any
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      if (userDoc.exists()) {
        setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile)
      }
    }
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        await fbUser.reload()
        const userDoc = await getDoc(doc(db, "users", fbUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUser({
            uid: fbUser.uid,
            ...data,
            emailVerified: fbUser.emailVerified,
          } as UserProfile)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!firebaseUser) return
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUser({
          uid: firebaseUser.uid,
          ...snapshot.data(),
          emailVerified: firebaseUser.emailVerified,
        } as UserProfile)
      }
    })
    return () => unsub()
  }, [firebaseUser])

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
