const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const { email, type } = JSON.parse(event.body)

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) }
  }

  const { error } = await supabase
    .from('waitlist')
    .insert([{ email, type: type || 'client', created_at: new Date() }])

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Flow <onboarding@resend.dev>',
      to: email,
      subject: "You're on the Flow waitlist 🎬",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 28px; font-weight: 800; color: #0a0a0a;">You're in. ✦</h1>
          <p style="color: #6b6b6b; font-size: 16px; line-height: 1.6;">Thanks for joining the Flow waitlist. We're building the marketplace that video editors actually deserve — fair pay, real clients, no noise.</p>
          <p style="color: #6b6b6b; font-size: 16px; line-height: 1.6;">We'll hit you up the moment we go live.</p>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
            <p style="color: #9a9a9a; font-size: 13px;">flow. — the marketplace built for video editors</p>
          </div>
        </div>
      `
    })
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  }
}
