import { useEffect, useState } from 'react'
import { Lock, Shield, ScanLine, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useTheme } from '../context/theme'
import { useSpace, type Space, SPACE_ICONS, SPACE_TYPES } from '../context/space'
import { supabase } from '../lib/supabase'

function PinSheet({
  space,
  onConfirm,
  onCancel,
}: {
  space: Space
  onConfirm: (space: Space) => void
  onCancel: () => void
}) {
  const { c } = useTheme()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function confirm() {
    if (pin === space.access_pin) {
      onConfirm(space)
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        background: c.card, borderRadius: '24px 24px 0 0',
        padding: '24px 20px max(env(safe-area-inset-bottom, 0px), 28px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={20} color="#D97706" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: 0 }}>Code d'accès</p>
            <p style={{ fontSize: 13, color: c.textMuted, margin: '2px 0 0' }}>{SPACE_ICONS[space.type] || '🏢'} {space.name}</p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: c.input, border: `1.5px solid ${error ? '#EF4444' : c.borderStrong}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 10,
          transition: 'border-color .15s',
        }}>
          <Lock size={16} color={error ? '#EF4444' : c.textMuted} style={{ flexShrink: 0 }} />
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && confirm()}
            placeholder="Code d'accès"
            autoFocus
            style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 12px', fontWeight: 500 }}>Code incorrect</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', borderRadius: 14,
            border: `1.5px solid ${c.borderStrong}`, background: 'transparent',
            color: c.textSub, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Annuler
          </button>
          <button onClick={confirm} disabled={!pin} style={{
            flex: 2, padding: '14px', borderRadius: 14, border: 'none',
            background: pin ? '#16A34A' : c.border,
            color: pin ? '#fff' : c.textMuted,
            fontSize: 15, fontWeight: 700, cursor: pin ? 'pointer' : 'default',
            fontFamily: 'inherit',
            boxShadow: pin ? '0 4px 14px rgba(22,163,74,.3)' : 'none',
          }}>
            Accéder
          </button>
        </div>
      </div>
    </div>
  )
}

export function SpaceSelect() {
  const { user } = useAuth()
  const { c } = useTheme()
  const { setSpace } = useSpace()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [pinTarget, setPinTarget] = useState<Space | null>(null)
  const estName = (user?.user_metadata?.establishment_name ?? user?.email?.split('@')[0] ?? '') as string

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('spaces')
      .select('*')
      .eq('establishment_id', user.id)
      .order('name')
      .then(({ data }) => {
        setSpaces((data ?? []) as Space[])
        setLoading(false)
      })
  }, [user?.id])

  function selectSpace(space: Space) {
    if (space.access_pin) {
      setPinTarget(space)
    } else {
      setSpace(space)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: c.bg,
      paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
    }}>

      {/* Header */}
      <div style={{ padding: '16px 24px 28px', flexShrink: 0 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(145deg, #16A34A 0%, #22C55E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(22,163,74,.28)', marginBottom: 20,
        }}>
          <ScanLine size={26} color="white" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: c.text, letterSpacing: -0.8, margin: '0 0 4px' }}>
          Quel espace ?
        </h1>
        <p style={{ fontSize: 14, color: c.textMuted, margin: 0, fontWeight: 500 }}>
          {estName}
        </p>
      </div>

      {/* Spaces list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #BBF7D0', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
          </div>
        ) : spaces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: '0 0 8px' }}>Aucun espace configuré</p>
            <p style={{ fontSize: 13, color: c.textMuted, margin: '0 0 24px' }}>
              Accédez en mode admin pour créer vos espaces dans les Réglages.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {spaces.map(space => (
              <button
                key={space.id}
                onClick={() => selectSpace(space)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: c.card, borderRadius: 18, padding: '16px 18px',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  textAlign: 'left', width: '100%',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14, background: '#F0FDF4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {SPACE_ICONS[space.type] || '🏢'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: 0 }}>{space.name}</p>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: '2px 0 0' }}>
                    {SPACE_TYPES.find(t => t.value === space.type)?.label ?? space.type}
                  </p>
                </div>
                {space.access_pin ? (
                  <Lock size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
                ) : (
                  <ChevronRight size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Admin mode */}
      <div style={{ padding: '20px 20px 0', flexShrink: 0 }}>
        <div style={{ height: 1, background: c.border, marginBottom: 18 }} />
        <button
          onClick={() => setSpace(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'transparent', border: `1.5px solid ${c.borderStrong}`,
            borderRadius: 16, padding: '14px 18px',
            cursor: 'pointer', width: '100%', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Shield size={18} color="#2563EB" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0 }}>Mode Admin</p>
            <p style={{ fontSize: 12, color: c.textMuted, margin: '2px 0 0' }}>Vue complète de l'établissement</p>
          </div>
          <ChevronRight size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
        </button>
      </div>

      {pinTarget && (
        <PinSheet
          space={pinTarget}
          onConfirm={s => { setSpace(s); setPinTarget(null) }}
          onCancel={() => setPinTarget(null)}
        />
      )}
    </div>
  )
}
