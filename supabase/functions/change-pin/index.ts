import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST')
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: cors })

  const authorization = request.headers.get('authorization')
  if (!authorization) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401, headers: cors })

  const { pin } = await request.json().catch(() => ({}))
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin) || pin === '0000') {
    return Response.json({ error: 'INVALID_NEW_PIN' }, { status: 400, headers: cors })
  }

  const url = Deno.env.get('SUPABASE_URL')!
  const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY')!
  const pepper = Deno.env.get('PIN_PEPPER')
  if (!pepper) return Response.json({ error: 'LOGIN_NOT_CONFIGURED' }, { status: 503, headers: cors })

  const userClient = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user) return Response.json({ error: 'INVALID_SESSION' }, { status: 401, headers: cors })

  const username = user.email?.split('@')[0]
  if (!username) return Response.json({ error: 'INVALID_ACCOUNT' }, { status: 400, headers: cors })

  const admin = createClient(url, secretKey, { auth: { persistSession: false } })
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: `${pepper}:${username}:${pin}`,
    app_metadata: { ...user.app_metadata, must_change_pin: false },
  })
  if (error) return Response.json({ error: 'PIN_UPDATE_FAILED' }, { status: 500, headers: cors })

  return Response.json({ ok: true }, { headers: { ...cors, 'Content-Type': 'application/json' } })
})
