import { createContext, useContext, useState } from 'react'

export type SpaceType = 'cuisine' | 'bar' | 'office' | 'room_service' | 'reserve' | 'autre'

export type Space = {
  id: string
  name: string
  type: SpaceType
  establishment_id: string
  access_pin: string | null
  created_at?: string
}

export const SPACE_ICONS: Record<string, string> = {
  cuisine: '🍳',
  bar: '🍸',
  office: '☕️',
  room_service: '🛎',
  reserve: '📦',
  autre: '🏢',
}

export const SPACE_TYPES: { value: SpaceType; label: string }[] = [
  { value: 'cuisine',      label: 'Cuisine' },
  { value: 'bar',          label: 'Bar' },
  { value: 'office',       label: 'Office / Petit-déj.' },
  { value: 'room_service', label: 'Room Service' },
  { value: 'reserve',      label: 'Réserve' },
  { value: 'autre',        label: 'Autre' },
]

type SpaceCtx = {
  space: Space | null
  selected: boolean
  setSpace: (space: Space | null) => void
  clearSelection: () => void
}

const Ctx = createContext<SpaceCtx>({
  space: null,
  selected: false,
  setSpace: () => {},
  clearSelection: () => {},
})

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [space, setSpaceState] = useState<Space | null>(() => {
    try { return JSON.parse(localStorage.getItem('dlc-active-space') || 'null') }
    catch { return null }
  })
  const [selected, setSelected] = useState(
    () => localStorage.getItem('dlc-space-selected') === 'true'
  )

  function setSpace(s: Space | null) {
    setSpaceState(s)
    setSelected(true)
    localStorage.setItem('dlc-space-selected', 'true')
    if (s) localStorage.setItem('dlc-active-space', JSON.stringify(s))
    else localStorage.removeItem('dlc-active-space')
  }

  function clearSelection() {
    setSpaceState(null)
    setSelected(false)
    localStorage.removeItem('dlc-space-selected')
    localStorage.removeItem('dlc-active-space')
  }

  return (
    <Ctx.Provider value={{ space, selected, setSpace, clearSelection }}>
      {children}
    </Ctx.Provider>
  )
}

export const useSpace = () => useContext(Ctx)
