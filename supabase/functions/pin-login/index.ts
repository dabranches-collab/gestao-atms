import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST')
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: cors })

  const publishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default ??
    Deno.env.get('SUPABASE_ANON_KEY')!
  if (request.headers.get('apikey') !== publishableKey)
    return Response.json({ error: 'INVALID_API_KEY' }, { status: 401, headers: cors })

  const { username, pin } = await request.json().catch(() => ({}))
  if (
    typeof username !== 'string' ||
    !/^[a-zA-Z0-9._-]{3,32}$/.test(username) ||
    typeof pin !== 'string' ||
    !/^\d{4}$/.test(pin)
  ) {
    return Response.json({ error: 'INVALID_CREDENTIAL_FORMAT' }, { status: 400, headers: cors })
  }

  const url = Deno.env.get('SUPABASE_URL')!
  const secretKey =
    Deno.env.get('SUPABASE_SECRET_KEY') ??
    JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const pepper = Deno.env.get('PIN_PEPPER')
  if (!pepper) return Response.json({ error: 'LOGIN_NOT_CONFIGURED' }, { status: 503, headers: cors })

  const admin = createClient(url, secretKey, { auth: { persistSession: false } })
  const normalized = username.toLowerCase()
  const { data: status } = await admin
    .rpc('pin_login_status', { candidate_username: normalized })
    .maybeSingle()
  if (status?.is_locked)
    return Response.json({ error: 'ACCOUNT_TEMPORARILY_LOCKED' }, { status: 429, headers: cors })

  const authClient = createClient(url, publishableKey, { auth: { persistSession: false } })
  const internalPassword = `${pepper}:${normalized}:${pin}`
  const { data, error } = await authClient.auth.signInWithPassword({
    email: `${normalized}@pin.gestao-atms.com`,
    password: internalPassword,
  })
  await admin.rpc('record_pin_login_attempt', {
    candidate_username: normalized,
    succeeded: !error,
    failure: error ? 'INVALID_CREDENTIALS' : null,
  })
  if (error || !data.session)
    return Response.json({ error: 'INVALID_CREDENTIALS' }, { status: 401, headers: cors })

  return Response.json(
    { session: data.session },
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  )
})
