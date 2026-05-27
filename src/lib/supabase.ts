import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://phhnwqbhpobnhxfhmrnw.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaG53cWJocG9ibmh4Zmhtcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njk1NTksImV4cCI6MjA5NDM0NTU1OX0.s800N5C1MFHysJAQutr7kRaNq0bVJ2YOJXo0WDQ7IAk'

export const supabase = createClient(url, key)
