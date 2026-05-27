import { useState, useRef, useEffect } from 'react'
import {
  Building2, Mail, LogOut, ChevronRight, ArrowLeft, Moon, Sun,
  Shield, Lock, Package, Tag, Check, X, Plus, Pencil, Trash2, Loader2,
  LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../context/auth'
import { useTheme } from '../context/theme'
import { useSpace, SPACE_TYPES, SPACE_ICONS, type Space, type SpaceType } from '../context/space'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'main' | 'profil' | 'password' | 'stockage' | 'categories' | 'espaces'

export type Category = { id: string; name: string; color: string }

export type StorageSettings = {
  defaultUnit: string
  thresholdCritical: number
  thresholdWarning: number
  thresholdSoon: number
}

const CAT_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
]

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Viandes', color: '#EF4444' },
  { id: 'c2', name: 'Poissons', color: '#3B82F6' },
  { id: 'c3', name: 'Produits laitiers', color: '#EAB308' },
  { id: 'c4', name: 'Légumes', color: '#22C55E' },
  { id: 'c5', name: 'Fruits', color: '#F97316' },
  { id: 'c6', name: 'Boissons', color: '#14B8A6' },
  { id: 'c7', name: 'Épicerie', color: '#6B7280' },
  { id: 'c8', name: 'Surgelés', color: '#8B5CF6' },
]

const DEFAULT_STORAGE: StorageSettings = {
  defaultUnit: 'kg',
  thresholdCritical: 1,
  thresholdWarning: 2,
  thresholdSoon: 5,
}

const UNITS = ['kg', 'g', 'L', 'mL', 'pièces', 'cartons', 'boîtes', 'portions']

function loadCategories(): Category[] {
  try { return JSON.parse(localStorage.getItem('dlc-categories') || 'null') ?? DEFAULT_CATEGORIES }
  catch { return DEFAULT_CATEGORIES }
}

function loadStorageSettings(): StorageSettings {
  try { return { ...DEFAULT_STORAGE, ...JSON.parse(localStorage.getItem('dlc-storage-settings') || '{}') } }
  catch { return DEFAULT_STORAGE }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 51, height: 31, borderRadius: 999, flexShrink: 0,
      background: value ? '#16A34A' : '#D1D5DB',
      position: 'relative', cursor: 'pointer',
      transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2, width: 27, height: 27,
        borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,.25)',
        transition: 'left .2s',
      }} />
    </div>
  )
}

function OverlayScreen({ children }: { children: React.ReactNode; onBack: () => void }) {
  const { c } = useTheme()
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: c.bg,
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, left: '50%', transform: 'translateX(-50%)',
      width: '100%',
      animation: 'slideInRight .22s ease-out',
    }}>
      {children}
    </div>
  )
}

function OverlayHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { c } = useTheme()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: 'max(env(safe-area-inset-top, 0px), 16px) 20px 16px',
      background: c.bg, flexShrink: 0,
      borderBottom: `1px solid ${c.border}`,
    }}>
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: 10, border: 'none',
        background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      }}>
        <ArrowLeft size={18} color={c.text} />
      </button>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>{title}</h2>
    </div>
  )
}

function Field({
  label, type = 'text', value, onChange, placeholder, disabled,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean
}) {
  const { c } = useTheme()
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </p>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: c.card, border: `1.5px solid ${c.borderStrong}`,
        borderRadius: 14, padding: '14px 16px',
        opacity: disabled ? 0.5 : 1,
      }}>
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, background: 'transparent', fontSize: 15, color: c.text,
            outline: 'none', border: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}

function PasswordConfirmModal({
  onConfirm, onCancel, loading, error,
}: {
  onConfirm: (pwd: string) => void; onCancel: () => void; loading: boolean; error: string
}) {
  const { c } = useTheme()
  const [pwd, setPwd] = useState('')
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 430,
        background: c.card, borderRadius: '24px 24px 0 0',
        padding: '24px 20px max(env(safe-area-inset-bottom, 0px), 24px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={20} color="#EF4444" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: 0 }}>Confirmer l'identité</p>
            <p style={{ fontSize: 13, color: c.textMuted, margin: '2px 0 0' }}>Entrez votre mot de passe actuel</p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          background: c.input, border: `1.5px solid ${c.borderStrong}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 10,
        }}>
          <input
            type="password" value={pwd} onChange={e => setPwd(e.target.value)}
            placeholder="Mot de passe actuel"
            autoFocus
            style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 10px', fontWeight: 500 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${c.borderStrong}`,
            background: 'transparent', color: c.textSub, fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Annuler</button>
          <button onClick={() => onConfirm(pwd)} disabled={!pwd || loading} style={{
            flex: 1, padding: '14px', borderRadius: 14, border: 'none',
            background: loading || !pwd ? '#D1D5DB' : '#111827',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: pwd && !loading ? 'pointer' : 'default', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Profil ────────────────────────────────────────────────────────────

function ProfilScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const { c } = useTheme()
  const [name, setName] = useState(user?.user_metadata?.establishment_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [saved, setSaved] = useState(false)

  const hasChanges = name !== (user?.user_metadata?.establishment_name ?? '') || email !== (user?.email ?? '')

  async function handleConfirm(pwd: string) {
    setConfirmLoading(true)
    setConfirmError('')
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: pwd })
    if (authErr) {
      setConfirmError('Mot de passe incorrect')
      setConfirmLoading(false)
      return
    }
    const updates: Record<string, unknown> = {}
    if (email !== user?.email) updates.email = email
    if (name !== user?.user_metadata?.establishment_name) updates.data = { establishment_name: name }
    if (Object.keys(updates).length > 0) await supabase.auth.updateUser(updates)
    if (name !== user?.user_metadata?.establishment_name && !updates.email) {
      await supabase.from('establishments').update({ name }).eq('id', user!.id)
    }
    setConfirmLoading(false)
    setShowConfirm(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <OverlayScreen onBack={onBack}>
      <OverlayHeader title="Informations personnelles" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <Field label="Nom de l'établissement" value={name} onChange={setName} placeholder="Mon Établissement" />
        <Field label="Adresse email" type="email" value={email} onChange={setEmail} placeholder="email@exemple.fr" />

        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            <Check size={16} color="#16A34A" />
            <p style={{ fontSize: 14, color: '#16A34A', fontWeight: 600, margin: 0 }}>Modifications enregistrées</p>
          </div>
        )}

        <button onClick={() => setShowConfirm(true)} disabled={!hasChanges} style={{
          width: '100%', padding: '16px', borderRadius: 16, border: 'none',
          background: hasChanges ? '#111827' : c.border,
          color: hasChanges ? '#fff' : c.textMuted,
          fontSize: 15, fontWeight: 700, cursor: hasChanges ? 'pointer' : 'default',
          fontFamily: 'inherit', marginTop: 8,
        }}>
          Enregistrer
        </button>

        <p style={{ fontSize: 12, color: c.textMuted, textAlign: 'center', margin: '12px 0 0' }}>
          Un mot de passe sera demandé pour confirmer les changements.
        </p>
      </div>

      {showConfirm && (
        <PasswordConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => { setShowConfirm(false); setConfirmError('') }}
          loading={confirmLoading}
          error={confirmError}
        />
      )}
    </OverlayScreen>
  )
}

// ─── Screen: Password ──────────────────────────────────────────────────────────

function PasswordScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const { c } = useTheme()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 6) { setError('Le nouveau mot de passe doit contenir au moins 6 caractères'); return }
    if (next !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user!.email!, password: current })
    if (authErr) { setError('Mot de passe actuel incorrect'); setLoading(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    if (updateErr) { setError(updateErr.message); setLoading(false); return }
    setLoading(false)
    setCurrent(''); setNext(''); setConfirm('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <OverlayScreen onBack={onBack}>
      <OverlayHeader title="Changer le mot de passe" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <form onSubmit={handleSubmit}>
          <Field label="Mot de passe actuel" type="password" value={current} onChange={setCurrent} placeholder="••••••••" />
          <div style={{ height: 1, background: c.border, margin: '4px 0 18px' }} />
          <Field label="Nouveau mot de passe" type="password" value={next} onChange={setNext} placeholder="Min. 6 caractères" />
          <Field label="Confirmer le nouveau mot de passe" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" />

          {error && (
            <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
              <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
              <Check size={16} color="#16A34A" />
              <p style={{ fontSize: 14, color: '#16A34A', fontWeight: 600, margin: 0 }}>Mot de passe modifié</p>
            </div>
          )}

          <button type="submit" disabled={!current || !next || !confirm || loading} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: current && next && confirm && !loading ? '#111827' : c.border,
            color: current && next && confirm && !loading ? '#fff' : c.textMuted,
            fontSize: 15, fontWeight: 700,
            cursor: current && next && confirm && !loading ? 'pointer' : 'default',
            fontFamily: 'inherit', marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </OverlayScreen>
  )
}

// ─── Screen: Stockage ──────────────────────────────────────────────────────────

function StockageScreen({ onBack }: { onBack: () => void }) {
  const { c } = useTheme()
  const [settings, setSettings] = useState<StorageSettings>(loadStorageSettings)
  const [saved, setSaved] = useState(false)

  function update(key: keyof StorageSettings, value: string | number) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  function save() {
    localStorage.setItem('dlc-storage-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <OverlayScreen onBack={onBack}>
      <OverlayHeader title="Paramètres de stockage" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Default unit */}
        <p style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Unité par défaut
        </p>
        <div style={{
          background: c.card, borderRadius: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 14 }}>
            {UNITS.map(u => (
              <button key={u} onClick={() => update('defaultUnit', u)} style={{
                padding: '8px 16px', borderRadius: 999, border: 'none',
                background: settings.defaultUnit === u ? '#111827' : c.input,
                color: settings.defaultUnit === u ? '#fff' : c.textSub,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{u}</button>
            ))}
          </div>
        </div>

        {/* Alert thresholds */}
        <p style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Seuils d'alerte
        </p>
        <div style={{ background: c.card, borderRadius: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 20, overflow: 'hidden' }}>
          {[
            { key: 'thresholdCritical' as const, label: 'Alerte critique', color: '#EF4444', badge: 'J-1' },
            { key: 'thresholdWarning' as const, label: 'Alerte attention', color: '#F97316', badge: 'J-2' },
            { key: 'thresholdSoon' as const, label: 'Alerte bientôt', color: '#3B82F6', badge: 'J-5' },
          ].map(({ key, label, color, badge }, i, arr) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : 'none',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 12, color: c.textMuted, margin: '2px 0 0' }}>
                  Actuellement : {badge} ({settings[key]} jour{settings[key] > 1 ? 's' : ''})
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => update(key, Math.max(1, settings[key] - 1))} style={{
                  width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${c.borderStrong}`,
                  background: c.input, color: c.text, fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>−</button>
                <span style={{ fontSize: 17, fontWeight: 700, color: c.text, minWidth: 24, textAlign: 'center' }}>
                  {settings[key]}
                </span>
                <button onClick={() => update(key, Math.min(30, settings[key] + 1))} style={{
                  width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${c.borderStrong}`,
                  background: c.input, color: c.text, fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
            <Check size={16} color="#16A34A" />
            <p style={{ fontSize: 14, color: '#16A34A', fontWeight: 600, margin: 0 }}>Paramètres enregistrés</p>
          </div>
        )}

        <button onClick={save} style={{
          width: '100%', padding: '16px', borderRadius: 16, border: 'none',
          background: '#111827', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Enregistrer
        </button>
      </div>
    </OverlayScreen>
  )
}

// ─── Screen: Categories ────────────────────────────────────────────────────────

function CategoriesScreen({ onBack }: { onBack: () => void }) {
  const { c } = useTheme()
  const [categories, setCategories] = useState<Category[]>(loadCategories)
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; cat?: Category } | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState(CAT_COLORS[0])

  function openAdd() {
    setEditName(''); setEditColor(CAT_COLORS[0])
    setModal({ type: 'add' })
  }

  function openEdit(cat: Category) {
    setEditName(cat.name); setEditColor(cat.color)
    setModal({ type: 'edit', cat })
  }

  function saveModal() {
    if (!editName.trim()) return
    let updated: Category[]
    if (modal?.type === 'add') {
      updated = [...categories, { id: Date.now().toString(), name: editName.trim(), color: editColor }]
    } else {
      updated = categories.map(c => c.id === modal?.cat?.id ? { ...c, name: editName.trim(), color: editColor } : c)
    }
    setCategories(updated)
    localStorage.setItem('dlc-categories', JSON.stringify(updated))
    setModal(null)
  }

  function deleteCategory(id: string) {
    const updated = categories.filter(c => c.id !== id)
    setCategories(updated)
    localStorage.setItem('dlc-categories', JSON.stringify(updated))
  }

  return (
    <OverlayScreen onBack={onBack}>
      <OverlayHeader title="Catégories" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
        <div style={{ background: c.card, borderRadius: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          {categories.map((cat, i) => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              borderBottom: i < categories.length - 1 ? `1px solid ${c.border}` : 'none',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
              </div>
              <p style={{ flex: 1, fontSize: 15, fontWeight: 600, color: c.text, margin: 0 }}>{cat.name}</p>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(cat)} style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none',
                  background: c.input, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Pencil size={14} color={c.textSub} />
                </button>
                <button onClick={() => deleteCategory(cat.id)} style={{
                  width: 34, height: 34, borderRadius: 10, border: 'none',
                  background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Trash2 size={14} color="#EF4444" />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: c.textMuted, margin: 0 }}>Aucune catégorie</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <div style={{
        position: 'absolute', bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)', right: 20,
      }}>
        <button onClick={openAdd} style={{
          width: 56, height: 56, borderRadius: 18, border: 'none',
          background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(22,163,74,.4)',
        }}>
          <Plus size={24} color="white" />
        </button>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{
            width: '100%', maxWidth: 430,
            background: c.card, borderRadius: '24px 24px 0 0',
            padding: '24px 20px max(env(safe-area-inset-bottom, 0px), 24px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: 0 }}>
                {modal.type === 'add' ? 'Nouvelle catégorie' : 'Modifier'}
              </p>
              <button onClick={() => setModal(null)} style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: c.input, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <X size={16} color={c.textSub} />
              </button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center',
              background: c.input, border: `1.5px solid ${c.borderStrong}`,
              borderRadius: 14, padding: '14px 16px', marginBottom: 18,
            }}>
              <input
                value={editName} onChange={e => setEditName(e.target.value)}
                placeholder="Nom de la catégorie"
                autoFocus
                style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Couleur</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {CAT_COLORS.map(col => (
                <button key={col} onClick={() => setEditColor(col)} style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: col, cursor: 'pointer',
                  outline: editColor === col ? `3px solid ${col}` : '3px solid transparent',
                  outlineOffset: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {editColor === col && <Check size={16} color="white" />}
                </button>
              ))}
            </div>

            <button onClick={saveModal} disabled={!editName.trim()} style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: editName.trim() ? editColor : c.border,
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: editName.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}>
              {modal.type === 'add' ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </OverlayScreen>
  )
}

// ─── Screen: Espaces ──────────────────────────────────────────────────────────

type SpaceForm = { name: string; type: SpaceType; access_pin: string }
const EMPTY_FORM: SpaceForm = { name: '', type: 'autre', access_pin: '' }

function EspacesScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const { c } = useTheme()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ type: 'add' | 'edit'; space?: Space } | null>(null)
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!user?.id) return
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('establishment_id', user.id)
      .order('name')
    setSpaces((data ?? []) as Space[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  function openAdd() {
    setForm(EMPTY_FORM)
    setModal({ type: 'add' })
  }

  function openEdit(space: Space) {
    setForm({ name: space.name, type: space.type, access_pin: space.access_pin ?? '' })
    setModal({ type: 'edit', space })
  }

  async function saveModal() {
    if (!form.name.trim() || !user?.id) return
    setSaving(true)
    if (modal?.type === 'add') {
      await supabase.from('spaces').insert({
        establishment_id: user.id,
        name: form.name.trim(),
        type: form.type,
        access_pin: form.access_pin.trim() || null,
      })
    } else if (modal?.type === 'edit' && modal.space) {
      await supabase.from('spaces').update({
        name: form.name.trim(),
        type: form.type,
        access_pin: form.access_pin.trim() || null,
      }).eq('id', modal.space.id)
    }
    setSaving(false)
    setModal(null)
    await load()
  }

  async function deleteSpace(id: string) {
    await supabase.from('spaces').delete().eq('id', id)
    await load()
  }

  return (
    <OverlayScreen onBack={onBack}>
      <OverlayHeader title="Espaces" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 size={24} color={c.textMuted} style={{ animation: 'spin .7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ background: c.card, borderRadius: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            {spaces.map((space, i) => (
              <div key={space.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                borderBottom: i < spaces.length - 1 ? `1px solid ${c.border}` : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {SPACE_ICONS[space.type] || '🏢'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: 0 }}>{space.name}</p>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: '2px 0 0' }}>
                    {SPACE_TYPES.find(t => t.value === space.type)?.label ?? space.type}
                    {space.access_pin ? ' · Code requis' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(space)} style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none',
                    background: c.input, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <Pencil size={14} color={c.textSub} />
                  </button>
                  <button onClick={() => deleteSpace(space.id)} style={{
                    width: 34, height: 34, borderRadius: 10, border: 'none',
                    background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </div>
            ))}
            {spaces.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: c.textMuted, margin: 0 }}>Aucun espace. Créez-en un ci-dessous.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <div style={{ position: 'absolute', bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)', right: 20 }}>
        <button onClick={openAdd} style={{
          width: 56, height: 56, borderRadius: 18, border: 'none',
          background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(22,163,74,.4)',
        }}>
          <Plus size={24} color="white" />
        </button>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{
            width: '100%', maxWidth: 430,
            background: c.card, borderRadius: '24px 24px 0 0',
            padding: '24px 20px max(env(safe-area-inset-bottom, 0px), 24px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: 0 }}>
                {modal.type === 'add' ? 'Nouvel espace' : 'Modifier'}
              </p>
              <button onClick={() => setModal(null)} style={{
                width: 32, height: 32, borderRadius: 10, border: 'none',
                background: c.input, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <X size={16} color={c.textSub} />
              </button>
            </div>

            {/* Name */}
            <p style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nom</p>
            <div style={{ display: 'flex', alignItems: 'center', background: c.input, border: `1.5px solid ${c.borderStrong}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex. Cuisine froide"
                autoFocus
                style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Type */}
            <p style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {SPACE_TYPES.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 999, border: 'none',
                  background: form.type === t.value ? '#111827' : c.input,
                  color: form.type === t.value ? '#fff' : c.textSub,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span>{SPACE_ICONS[t.value]}</span> {t.label}
                </button>
              ))}
            </div>

            {/* PIN */}
            <p style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Code d'accès (optionnel)</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${c.borderStrong}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <Lock size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
              <input
                type="password"
                value={form.access_pin}
                onChange={e => setForm(f => ({ ...f, access_pin: e.target.value }))}
                placeholder="Laisser vide = accès libre"
                style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <button onClick={saveModal} disabled={!form.name.trim() || saving} style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: form.name.trim() && !saving ? '#111827' : c.border,
              color: form.name.trim() && !saving ? '#fff' : c.textMuted,
              fontSize: 15, fontWeight: 700, cursor: form.name.trim() && !saving ? 'pointer' : 'default',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {saving
                ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} />
                : modal.type === 'add' ? 'Créer l\'espace' : 'Enregistrer'
              }
            </button>
          </div>
        </div>
      )}
    </OverlayScreen>
  )
}

// ─── Row & Card helpers ────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const { c } = useTheme()
  return <p style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, margin: '0 0 8px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
}

function Row({
  iconBg, icon, label, sub, right, onPress, last = false,
}: {
  iconBg: string; icon: React.ReactNode; label: string; sub?: string
  right?: React.ReactNode; onPress?: () => void; last?: boolean
}) {
  const { c } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 16px',
        borderBottom: last ? 'none' : `1px solid ${c.border}`,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: c.textMuted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
      </div>
      {right ?? (onPress ? <ChevronRight size={16} color={c.textMuted} /> : null)}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  const { c } = useTheme()
  return (
    <div style={{ background: c.card, borderRadius: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 8, overflow: 'hidden' }}>
      {children}
    </div>
  )
}

// ─── Main Reglages ─────────────────────────────────────────────────────────────

export function Reglages() {
  const { user } = useAuth()
  const { dark, toggle, c } = useTheme()
  const { clearSelection } = useSpace()
  const [screen, setScreen] = useState<Screen>('main')

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: 'max(env(safe-area-inset-top, 0px), 16px) 20px 16px',
          background: c.bg,
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: c.text, letterSpacing: -0.5, margin: 0 }}>Réglages</h1>
        </div>

        {/* Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>

          {/* Compte */}
          <SectionLabel label="Compte" />
          <Card>
            <Row
              iconBg="#F0FDF4" icon={<Building2 size={16} color="#16A34A" />}
              label={user?.user_metadata?.establishment_name ?? '—'}
              sub="Nom de l'établissement"
            />
            <Row
              iconBg="#EFF6FF" icon={<Mail size={16} color="#3B82F6" />}
              label={user?.email ?? '—'}
              sub="Adresse email"
              last
            />
          </Card>

          {/* Apparence */}
          <div style={{ height: 12 }} />
          <SectionLabel label="Apparence" />
          <Card>
            <Row
              iconBg={dark ? '#2C2C2E' : '#F3F4F6'}
              icon={dark ? <Moon size={16} color="#A1A1AA" /> : <Sun size={16} color="#6B7280" />}
              label="Mode sombre"
              sub={dark ? 'Activé' : 'Désactivé'}
              right={<Toggle value={dark} onChange={toggle} />}
              last
            />
          </Card>

          {/* Sécurité */}
          <div style={{ height: 12 }} />
          <SectionLabel label="Sécurité" />
          <Card>
            <Row
              iconBg="#FEF3C7" icon={<Shield size={16} color="#D97706" />}
              label="Informations personnelles"
              sub="Nom, email"
              onPress={() => setScreen('profil')}
            />
            <Row
              iconBg="#FEF2F2" icon={<Lock size={16} color="#EF4444" />}
              label="Mot de passe"
              sub="Modifier le mot de passe"
              onPress={() => setScreen('password')}
              last
            />
          </Card>

          {/* Espaces */}
          <div style={{ height: 12 }} />
          <SectionLabel label="Espaces" />
          <Card>
            <Row
              iconBg="#EFF6FF" icon={<LayoutGrid size={16} color="#2563EB" />}
              label="Gérer les espaces"
              sub="Cuisine, Bar, Room Service…"
              onPress={() => setScreen('espaces')}
              last
            />
          </Card>

          {/* Stock */}
          <div style={{ height: 12 }} />
          <SectionLabel label="Stock" />
          <Card>
            <Row
              iconBg="#ECFDF5" icon={<Package size={16} color="#10B981" />}
              label="Paramètres de stockage"
              sub="Unité par défaut, seuils d'alerte"
              onPress={() => setScreen('stockage')}
            />
            <Row
              iconBg="#EEF2FF" icon={<Tag size={16} color="#6366F1" />}
              label="Catégories"
              sub={`${loadCategories().length} catégorie${loadCategories().length !== 1 ? 's' : ''}`}
              onPress={() => setScreen('categories')}
              last
            />
          </Card>

          {/* Déconnexion */}
          <div style={{ height: 12 }} />
          <button
            onClick={() => { clearSelection(); supabase.auth.signOut() }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 18,
              padding: '16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <LogOut size={18} />Se déconnecter
          </button>
        </div>
      </div>

      {screen === 'profil' && <ProfilScreen onBack={() => setScreen('main')} />}
      {screen === 'password' && <PasswordScreen onBack={() => setScreen('main')} />}
      {screen === 'stockage' && <StockageScreen onBack={() => setScreen('main')} />}
      {screen === 'categories' && <CategoriesScreen onBack={() => setScreen('main')} />}
      {screen === 'espaces' && <EspacesScreen onBack={() => setScreen('main')} />}
    </>
  )
}

// ─── Exports ───────────────────────────────────────────────────────────────────

export { loadStorageSettings, loadCategories }
