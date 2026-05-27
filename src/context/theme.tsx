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
  bg: '#F5F5F7',
  card: '#FFFFFF',
  input: '#F5F5F7',
  border: '#E8E8ED',
  borderStrong: '#D1D1D6',
  text: '#1C1C1E',
  textSub: '#636366',
  textMuted: '#8E8E93',
}

const DARK: Colors = {
  bg: '#000000',
  card: '#1C1C1E',
  input: '#2C2C2E',
  border: '#38383A',
  borderStrong: '#48484A',
  text: '#FFFFFF',
  textSub: '#EBEBF5',
  textMuted: '#636366',
}

type ThemeCtx = { dark: boolean; toggle: () => void; c: Colors }
const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {}, c: LIGHT })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('dlc-theme') === 'dark')

  useEffect(() => {
    localStorage.setItem('dlc-theme', dark ? 'dark' : 'light')
    document.body.style.background = dark ? '#000000' : '#F5F5F7'
    document.body.style.color = dark ? '#FFFFFF' : '#1C1C1E'
  }, [dark])

  return (
    <Ctx.Provider value={{ dark, toggle: () => setDark(d => !d), c: dark ? DARK : LIGHT }}>
      {children}
    </Ctx.Provider>
  )
}

export const useTheme = () => useContext(Ctx)
