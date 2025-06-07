// Storage utility with fallbacks for when localStorage is not available
interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

class MemoryStorage implements StorageAdapter {
  private storage = new Map<string, string>()

  getItem(key: string): string | null {
    return this.storage.get(key) || null
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value)
  }

  removeItem(key: string): void {
    this.storage.delete(key)
  }
}

class SafeLocalStorage implements StorageAdapter {
  private fallback = new MemoryStorage()

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('localStorage.getItem failed, using memory storage:', error)
      return this.fallback.getItem(key)
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('localStorage.setItem failed, using memory storage:', error)
      this.fallback.setItem(key, value)
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('localStorage.removeItem failed, using memory storage:', error)
      this.fallback.removeItem(key)
    }
  }
}

// Check if localStorage is available
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Export the safe storage adapter
export const safeStorage = new SafeLocalStorage()

// Helper function to detect storage context issues
export function detectStorageIssues(): string[] {
  const issues: string[] = []
  
  // Check if we're in a secure context
  if (typeof window !== 'undefined') {
    if (!window.isSecureContext) {
      issues.push('Not in secure context (HTTPS required for some features)')
    }
    
    // Check localStorage availability
    if (!isLocalStorageAvailable()) {
      issues.push('localStorage is not available (using memory storage fallback)')
    }
    
    // Check if we're in an iframe with restrictions
    try {
      if (window.self !== window.top) {
        issues.push('Running in iframe - storage may be restricted')
      }
    } catch {
      issues.push('Cross-origin iframe detected - storage access restricted')
    }
    
    // Check for browser extension conflicts
    const extensionConflicts = detectExtensionConflicts()
    if (extensionConflicts.length > 0) {
      issues.push(`Browser extensions detected: ${extensionConflicts.join(', ')}`)
      issues.push('Extensions may interfere with storage and camera access')
    }
  }
  
  return issues
}

// Detect browser extension conflicts
// Type definitions for browser extension objects
interface WindowWithExtensions extends Window {
  ethereum?: unknown
  chrome?: {
    runtime?: unknown
  }
}

function detectExtensionConflicts(): string[] {
  const conflicts: string[] = []
  
  if (typeof window !== 'undefined') {
    const extendedWindow = window as WindowWithExtensions
    
    // Check for MetaMask
    if (extendedWindow.ethereum) {
      conflicts.push('MetaMask/Web3 wallet')
    }
    
    // Check for Namada
    if (typeof document !== 'undefined') {
      const namadaScripts = document.querySelectorAll('script[src*="namada"]')
      if (namadaScripts.length > 0) {
        conflicts.push('Namada wallet')
      }
    }
    
    // Check for common extension patterns
    if (extendedWindow.chrome?.runtime) {
      conflicts.push('Chrome extension')
    }
  }
  
  return conflicts
} 