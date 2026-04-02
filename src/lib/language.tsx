import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'zh' | 'en'

const STORAGE_KEY = 'llmbench-language'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'zh' || stored === 'en') {
      setLanguageState(stored)
    }
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        setLanguageState(nextLanguage)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, nextLanguage)
        }
      },
      toggleLanguage: () => {
        const nextLanguage = language === 'zh' ? 'en' : 'zh'
        setLanguageState(nextLanguage)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, nextLanguage)
        }
      },
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }

  return context
}