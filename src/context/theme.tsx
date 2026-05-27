import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Colors = {
  bg: string
  card: string
  input: string
  border: string
  borderStrong: string
  text: string
  textSub: string
  textMuted: string
}

const LIGHT: Colors = {
  bg: '#F2F2F7',
  card: '#ffffff',
  input: '#F9FAFB',
  border: '#F3F4F6',
  borderStrong: '#E5E7EB',
  text: '#111827',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
}

const DARK: Colors = {
  bg: '#1C1C1E',
  card: '#2C2C2E',
  input: '#3A3A3C',
  border: '#3A3A3C',
  borderStrong: '#48484A',
  text: '#F9FAFB',
  textSub: '#A1A1AA',
  textMuted: '#6B7280',
}

type ThemeCtx = { dark: boolean; toggle: () => void; c: Colors }
const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {}, c: LIGHT })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('dlc-theme') === 'dark')

  useEffect(() => {
    localStorage.setItem('dlc-theme', dark ? 'dark' : 'light')
    document.body.style.background = dark ? '#1C1C1E' : '#F2F2F7'
    document.body.style.color = dark ? '#F9FAFB' : '#111827'
  }, [dark])

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d), c: dark ? DARK : LIGHT }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)
