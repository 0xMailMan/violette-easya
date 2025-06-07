import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth } from './firebase'

export interface AuthUser {
  uid: string
  isAnonymous: boolean
  createdAt?: string
}

class AuthService {
  private static instance: AuthService
  private currentUser: AuthUser | null = null
  private authStateListeners: ((user: AuthUser | null) => void)[] = []

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          createdAt: user.metadata.creationTime
        }
      } else {
        this.currentUser = null
      }
      
      // Notify listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser))
    })
  }

  // Sign in anonymously for privacy
  async signInAnonymously(): Promise<AuthUser> {
    try {
      const userCredential = await signInAnonymously(auth)
      const user = userCredential.user
      
      const authUser: AuthUser = {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        createdAt: user.metadata.creationTime
      }
      
      console.log('🔐 Signed in anonymously:', authUser.uid)
      return authUser
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      throw error
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth)
      console.log('🔐 Signed out')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  // Wait for auth to initialize
  async waitForAuth(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      if (auth.currentUser !== undefined) {
        resolve(this.currentUser)
      } else {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe()
          resolve(this.currentUser)
        })
      }
    })
  }

  // Auto sign-in if not authenticated
  async ensureAuthenticated(): Promise<AuthUser> {
    await this.waitForAuth()
    
    if (!this.currentUser) {
      return await this.signInAnonymously()
    }
    
    return this.currentUser
  }

  // Listen for auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback)
    
    // Call immediately with current state
    callback(this.currentUser)
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  // Get user ID for anonymous usage
  async getUserId(): Promise<string> {
    const user = await this.ensureAuthenticated()
    return user.uid
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  // Generate a human-readable anonymous ID for display
  getDisplayId(): string {
    if (!this.currentUser) return 'Not authenticated'
    
    // Create a short, human-readable ID from the Firebase UID
    const uid = this.currentUser.uid
    const shortId = uid.substring(0, 8).toUpperCase()
    return `ANON-${shortId}`
  }
}

export const authService = AuthService.getInstance()

// Convenience hook for React components
export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { user, loading }
}

// Import useState and useEffect for the hook
import { useState, useEffect } from 'react' 