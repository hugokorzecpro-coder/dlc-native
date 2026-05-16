import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://db.phhnwqbhpobnhxfhmrnw.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_W5swQG9ambIT90Mu9zTzQg_6Sf3A300'

export const supabase = createClient(url, key)
