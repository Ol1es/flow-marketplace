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
      from: 'Okify <onboarding@resend.dev>',
      to: email,
      subject: "You're on the Okify waitlist 🎬",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0e0e18; color: #e8e6f0;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.03em;">okify<span style="color: #8b5cf6;">.</span></span>
          </div>
          <h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin-bottom: 16px; letter-spacing: -0.02em;">You're on the list. ✦</h1>
          <p style="color: #6b6980; font-size: 15px; line-height: 1.7; margin-bottom: 12px;">Thanks for joining the Okify waitlist. We're building the marketplace that video editors and creators actually deserve — fair pay, real clients, no noise.</p>
          <p style="color: #6b6980; font-size: 15px; line-height: 1.7; margin-bottom: 32px;">We'll hit you up the moment we go live.</p>
          <div style="background: #13131f; border: 1px solid rgba(139,92,246,0.2); border-radius: 10px; padding: 16px 20px; margin-bottom: 32px;">
            <p style="color: #8b5cf6; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">While you wait</p>
            <p style="color: #6b6980; font-size: 13px; line-height: 1.6; margin: 0;">Tell your editor friends about Okify. The more editors we have at launch, the faster clients get matched. Everyone wins.</p>
          </div>
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 24px;">
            <p style="color: #3a3a52; font-size: 12px; margin: 0;">okify. — the marketplace built for video editors</p>
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
