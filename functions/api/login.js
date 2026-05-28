const SUPABASE_URL = 'https://phhnwqbhpobnhxfhmrnw.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaG53cWJocG9ibmh4Zmhtcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njk1NTksImV4cCI6MjA5NDM0NTU1OX0.s800N5C1MFHysJAQutr7kRaNq0bVJ2YOJXo0WDQ7IAk'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }
  const { email, password } = await context.request.json()
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}
