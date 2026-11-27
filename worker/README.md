# Contact form relay (Cloudflare Worker)

The site posts contact messages to this Worker, which emails them to you through Resend. The API key
and your address are kept as encrypted secrets, so neither appears in the site's files.
(Web3Forms blocked messages sent from Cloudflare's servers, so the Worker uses Resend instead.)

## Set it up (about 10 minutes, free)

1. Create a free account at https://dash.cloudflare.com (no domain needed).
2. **Workers & Pages → Create → Create Worker.** Name it `portfolio-contact` → **Deploy** (the hello-world code is fine for now).
3. **Edit code.** Delete everything, paste the whole of `worker/contact.js`, then **Deploy**.
0. Create a free account at https://resend.com (sign up with the address you want messages sent to), then **API Keys → Create API Key** (permission: Sending access) and copy it.
4. **Settings → Variables and Secrets → Add:**
   - Type **Secret**, name `RESEND_API_KEY`, value = the Resend key.
   - Type **Secret**, name `TO_EMAIL`, value = the address that receives messages (it must be the email you signed up to Resend with) → **Deploy**.
   - (Optional) type **Text**, name `ALLOWED_ORIGINS`, value `https://cjnaidoo.github.io` (add more sites, comma separated, when the site moves or gets a custom domain).
5. Copy the Worker's address from the top of its page: `https://portfolio-contact.<your-subdomain>.workers.dev`.
6. Paste it into `js/content.js` → `connect.email.endpoint`, commit and push.
7. On the live site, send yourself a message from Let's Connect (check spam too).

## Moving the site later
Add the new address to `ALLOWED_ORIGINS` (step 4). Nothing else changes.

## Good to know
- The Worker only accepts posts from the allowed sites, trims and checks every field, silently drops
  anything that fills the hidden "botcheck" box, and allows 5 messages per IP every 10 minutes
  (a best-effort limit held in memory).
- Without a verified domain, Resend only delivers to the address you signed up with: exactly what a
  contact form needs. Messages come from `onboarding@resend.dev` with your visitor as the reply-to.
- Resend's free plan allows 100 emails a day, 3,000 a month.
- If something is wrong, the form shows the reason the Worker returns.
