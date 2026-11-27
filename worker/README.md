# Contact form relay (Cloudflare Worker)

The site posts contact messages to this Worker, which adds the Web3Forms access key (kept as an
encrypted secret) and forwards them. The key never appears in the site's files.

## Set it up (about 10 minutes, free)

1. Create a free account at https://dash.cloudflare.com (no domain needed).
2. **Workers & Pages → Create → Create Worker.** Name it `portfolio-contact` → **Deploy** (the hello-world code is fine for now).
3. **Edit code.** Delete everything, paste the whole of `worker/contact.js`, then **Deploy**.
4. **Settings → Variables and Secrets → Add:**
   - Type **Secret**, name `WEB3FORMS_KEY`, value = your Web3Forms access key → **Deploy**.
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
- Web3Forms' free plan has 250 messages a month.
- If Web3Forms refuses messages that come from a server (its free plan may), the Worker returns the
  reason and the form shows it. Then either upgrade Web3Forms or swap the final `fetch` in
  `contact.js` for another provider (Resend, Formspree...).
