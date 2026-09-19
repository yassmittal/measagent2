# Off-page — setup, launch and links

Written 2026-09-16. **Nothing here has been done.** Every step is for you to
run: no account was connected, nothing was submitted or posted.

---

## 1. Search Console and Bing (do this the day the SEO deploy is live)

### Google Search Console

1. <https://search.google.com/search-console> → **Add property** → **URL prefix**
   → `https://measagent.vercel.app/`. (A *Domain* property needs DNS, which a
   `vercel.app` subdomain does not give you.)
2. ~~Verify~~ **Done 2026-09-17** with the HTML file method:
   `web/public/google2d0134d554a0af0d.html`. Keep that file for as long as the
   property exists.
3. **Sitemaps** → submit `sitemap.xml`. Expect "Success" and 13+ discovered URLs.
4. **URL Inspection** → request indexing, in this order: `/`, `/how-it-works`,
   `/guides/make-an-ai-version-of-yourself`, `/compare/delphi`, then each
   listed avatar you want found first. Google rate-limits this to about ten a day.
5. **Settings → Associations**: nothing to do until the domain exists.

### Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → **Import from Google Search Console** (fastest),
   or add the site and verify with Bing's `BingSiteAuth.xml` file dropped into
   `web/public/`, the same way the Google file was.
2. Submit `https://measagent.vercel.app/sitemap.xml`.
3. Other engines and AI search products draw on Bing's index (DuckDuckGo most visibly), so this is worth the ten minutes.

### Checks after deploy (paste each URL)

- Rich Results Test: <https://search.google.com/test/rich-results> —
  `/how-it-works` (FAQ), `/guides/make-an-ai-version-of-yourself` (Article, FAQ,
  Breadcrumb), `/compare/delphi`, one listed avatar (Profile page, Breadcrumb).
- Schema validator: <https://validator.schema.org/> — `/` (Organization, WebSite,
  WebApplication) and a project avatar (ProfilePage → Organization).
- Share previews: <https://www.opengraph.xyz/> or paste links into X, LinkedIn
  (Post Inspector: <https://www.linkedin.com/post-inspector/>) and WhatsApp.
- Robots: Search Console → Settings → robots.txt report.

**Expect:** Google does not show FAQ rich results for most sites (limited to
authoritative government and health sites since 2023). The markup still
describes the page for other engines and AI answers; do not read "no FAQ rich
result" as a bug.

---

## 2. Launch sequence

One channel a day or two apart, so each gets your attention in the comments.
Check each community's rules **on the day** — they change. Never ask for upvotes.

| # | Where | Angle | Link it earns |
|---|---|---|---|
| 1 | **Your own X and LinkedIn** | Build-in-public: why you built it, what you learned | Social (nofollow), referral, brand searches |
| 2 | **Show HN** | The technical story: speech-to-speech with the api owning persona and history, memory written by a background pass under a lease, identity-bound avatars | news.ycombinator.com (nofollow) — high referral, often picked up by aggregators that do link |
| 3 | **Indie Hackers** (product page + a post) | Solo builder, free while in early access, what owners get back | Product page link (check whether it is followed) |
| 4 | **Product Hunt** | "Your AI avatar answers people, and you still hear what matters" | producthunt.com product page; widely scraped by AI-tool directories |
| 5 | **r/SideProject**, then **r/artificial** if allowed | Show-and-tell, ask for feedback on the owner view | Referral; Reddit threads are heavily cited by AI answers |
| 6 | **AI-tool directories** (There's An AI For That, Futurepedia, Toolify, AI Tools Directory) | Category: AI clone / digital twin; free | Mostly nofollow; they matter because AI answers cite them |

Skip: paid "submit to 100 directories" services, link exchanges, guest-post
networks. Each is either a link scheme or worthless.

### Draft posts (edit to your voice)

**Before posting any of these:** the weekly email is only real if Resend is set
up on the production api (`../decisions/owner-view.md` — it needs a verified sending domain,
which `vercel.app` cannot be). If it is not sending in production, cut the email
line from every draft *and* tell me, so the site copy that mentions it changes
too.

**X / LinkedIn**

> I built meAsAgent: launch an AI avatar of yourself that people can talk to, by
> text or voice, at your own link.
>
> The part I cared about: you still hear what matters. You can read every
> conversation, and a Monday email tells you who talked to your avatar and who
> asked for you personally.
>
> It can only be of you (or something you run) — the name and photo come from your
> Google account. Free while it's in early access.
>
> measagent.vercel.app

**Show HN**

> Title: Show HN: meAsAgent – an AI avatar of yourself that tells you who needs you
>
> I kept getting the same questions and couldn't answer everyone, so I built an
> AI avatar people can talk to at a link (text, or hold-to-speak voice).
>
> A few things that were interesting to build:
> - The avatar can only be of the Google account that launches it — there is no
>   name or photo field to lie in.
> - Voice runs through a separate speech-to-speech service that calls our api as
>   its model; the api signs a per-session token so the browser can't choose whose
>   history it writes to.
> - Memory is per visitor per avatar, written by a background pass after a
>   conversation goes quiet, claimed with a lease in MongoDB so several instances
>   never do it twice. A failing memory never fails a turn.
> - Owners read their conversations and get a weekly summary; visitors are told
>   so under the message box.
>
> What it doesn't do yet: learn from your documents, clone your voice, embed on
> other sites. Free while in early access. Feedback on the owner side especially
> welcome.

**Product Hunt**

> Tagline (≤60): Your AI avatar answers people. You still hear what matters.
>
> Description: Launch an AI avatar of yourself — or of something you run — in a
> few minutes. People talk to it by text or voice at your link; it remembers
> visitors who sign in; you read every conversation and get a weekly email about
> who needs you personally. Free while in early access.
>
> First comment: why you built it, what it deliberately doesn't do yet, what you
> want feedback on.

**Indie Hackers / r/SideProject**

> I built an AI avatar you share like a link-in-bio: people ask it what they'd ask
> you, and you get a weekly email flagging anyone who needs you personally. Solo
> project, free while in early access. The thing I'm least sure about is [the
> owner view / the weekly email / whether people want voice] — would love
> opinions. measagent.vercel.app

---

## 3. Owners are the backlink engine

Every owner who shares their `/<handle>` link from a site they control gives the
domain a real, relevant link — and a person searching their name finds it.

What is already built for this: the share card on `/launch` (copy link + preview
of the share image), per-avatar share images, the "Made with meAsAgent" link on
avatar pages (wider than a phone), and the owner's own website as a `rel="me"` link.

What you can do without building anything:
- Put your own avatar link on your GitHub profile README, personal site and X bio.
- When you talk to people who launched an avatar, suggest the same three places.
- Later, if wanted: an "Add to your website" snippet (a plain link with the
  share image) on `/launch`. Not a widget, no script.

---

## 4. Honest outreach targets

People who already maintain lists that AI answers cite (from `RESEARCH.md` §3).
Write once, personally, with something useful for their readers. No payment
for links.

| Who | Page | Ask |
|---|---|---|
| David Riha | [7 Best Tools to Create an AI Version of Yourself in 2026](https://davidriha.com/blog/best-tools-create-ai-version-of-yourself-2026/) and [12 Best AI Digital Twin Tools](https://davidriha.com/blog/best-ai-digital-twin-tools-2026/) | Consider it for the next update; offer a free avatar to try |
| meetaiyou | [AI clone platform comparison 2026](https://meetaiyou.com/comparisons/ai-clone-platform-comparison-2026) | Same |
| Dupple | [How to Make an AI of Yourself](https://dupple.com/learn/how-to-make-an-ai-of-yourself) | Mention as a free, text-and-voice option |
| Newsletters on indie AI tools (e.g. Ben's Bites, TLDR AI) | submission forms | A one-line, factual listing |

Skip Steno's comparison page: it is a competitor's.

---

## 5. Domain migration runbook (for when `meAsAgent.com` is bought)

Do it in one sitting, early in a week.

**Before**
1. Buy `measagent.com` (lowercase is what will be canonical). Add it to the web
   Vercel project as the **primary** domain; keep `measagent.vercel.app` attached.
2. Verify the new domain in **Resend** too — it also unblocks the weekly email.
3. Add a **Domain property** for `measagent.com` in Search Console (DNS TXT) and
   verify it. Keep the old URL-prefix property.

**Code (one PR)**
4. `web/src/lib/product.ts`: `SITE_URL = 'https://measagent.com'`. Everything —
   canonicals, sitemap, robots, JSON-LD, OG URLs, `llms.txt`, the share card — reads
   it.
5. `api/.env` on the server: add `https://measagent.com` to `MA_WEB_ORIGIN` (keep
   the vercel.app origin for the transition), set `MA_WEB_BASE_URL` to the new
   domain. Admin: `MA_WEB_BASE_URL`.
6. Google Cloud Console → OAuth client → add `https://measagent.com` to
   Authorised JavaScript origins.
7. Update `../../CLAUDE.md`, `../../README.md` and `../ROADMAP.md` where they name the Vercel domain.

**Redirects**
8. In Vercel → Domains, set `measagent.vercel.app` to **redirect (308) to
   measagent.com**, preserving the path. If the dashboard will not redirect the
   project's own `vercel.app` domain, do it in code instead: a `proxy.ts` (read the
   Next 16 proxy guide in `node_modules/next/dist/docs/` first) that answers any
   request whose host is `measagent.vercel.app` with a 308 to the same path on the
   new domain. Check `curl -sI
   https://measagent.vercel.app/how-it-works` → `308` with
   `location: https://measagent.com/how-it-works`, and the same for an avatar
   handle and `/sitemap.xml`.

**After**
9. Search Console (old property) → **Settings → Change of address** → choose the
   new property. (It requires the 301/308s in step 8 to be live.)
10. Submit `https://measagent.com/sitemap.xml` in both Google and Bing.
11. Re-scrape share previews for your main links (LinkedIn Post Inspector, X
    posts will refresh on their own).
12. Ask the outreach targets that linked to you to update the URL (the redirect
    covers them in the meantime; keep it **permanently**).
13. Watch Search Console → Pages for a month: old URLs should move to "Page with
    redirect", new ones to "Indexed".
