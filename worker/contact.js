// Contact-form relay for the portfolio (Cloudflare Worker).
// The site posts the message here; this emails it to you through Resend. The API key and your
// address live as encrypted secrets, so neither appears on the site. Set in the Worker's settings:
//   RESEND_API_KEY (Secret)   your Resend API key
//   TO_EMAIL       (Secret)   the address messages are sent to
//   ALLOWED_ORIGINS (Text, optional)  comma-separated sites allowed to post, default below

const DEFAULT_ORIGINS = ['https://cjnaidoo.github.io'];
const LIMITS = { name: 100, email: 200, subject: 150, message: 4000 };
const hits = new Map();                                   // ip -> [timestamps]: a small per-instance rate limit
const WINDOW_MS = 10 * 60 * 1000, MAX_HITS = 5;

const json = (obj, status, origin) => new Response(JSON.stringify(obj), {
    status,
    headers: {
        'Content-Type': 'application/json',
        ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    },
});

export default {
    async fetch(req, env) {
        const allowed = (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : DEFAULT_ORIGINS);
        const origin = req.headers.get('Origin') || '';
        const ok = allowed.includes(origin);

        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: ok ? 204 : 403,
                headers: ok ? {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400',
                    Vary: 'Origin',
                } : {},
            });
        }
        if (req.method !== 'POST') return json({ success: false, message: 'Not found.' }, 404, ok ? origin : '');
        if (!ok) return json({ success: false, message: 'Not allowed from this site.' }, 403, '');

        const ip = req.headers.get('CF-Connecting-IP') || 'unknown', now = Date.now();
        const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
        if (recent.length >= MAX_HITS) return json({ success: false, message: 'Too many messages. Try again in a few minutes.' }, 429, origin);
        recent.push(now); hits.set(ip, recent);

        let b;
        try { b = await req.json(); } catch { return json({ success: false, message: 'That message could not be read.' }, 400, origin); }
        const s = (v, max) => String(v ?? '').trim().slice(0, max);
        const name = s(b.name, LIMITS.name), email = s(b.email, LIMITS.email), message = s(b.message, LIMITS.message);
        const subject = s(b.subject, LIMITS.subject) || `Portfolio message from ${name}`;

        if (b.botcheck) return json({ success: true, message: 'Sent.' }, 200, origin);          // a bot filled the hidden field: pretend it worked
        if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return json({ success: false, message: 'Add your name, a valid reply-to email and a message.' }, 400, origin);
        }

        if (!env.RESEND_API_KEY || !env.TO_EMAIL) return json({ success: false, message: 'The form is not connected yet.' }, 500, origin);
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
            body: JSON.stringify({
                from: 'Portfolio <onboarding@resend.dev>',
                to: [env.TO_EMAIL],
                reply_to: email,
                subject,
                text: `From: ${name} <${email}>\n\n${message}`,
            }),
        });
        if (!res.ok) {
            const out = await res.json().catch(() => ({}));
            return json({ success: false, message: out.message || 'The message service refused it.' }, 502, origin);
        }
        return json({ success: true, message: 'Sent.' }, 200, origin);
    },
};
