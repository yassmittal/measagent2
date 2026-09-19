# Measurement

What to watch, where to read it, where it stands today, and what is realistic.
Baseline taken **2026-09-16**, before the SEO deploy.

## Baseline today

| Measure | Value | Source |
|---|---|---|
| Pages indexed | **0** (`site:measagent.vercel.app` returns nothing) | Google search |
| Brand search "meAsAgent" | Returns the *Me-Agent* arXiv paper and dictionary pages, nothing of ours | Google search |
| Search Console / Bing | Not connected | — |
| robots.txt / sitemap.xml | Both 404 | curl |
| Crawlable words: `/`, avatar page, `/launch` | ~120 · ~25 · 1 | curl, no JavaScript |
| Lighthouse production, mobile `/` | Perf 96–97 · A11y 96 · BP 96 · SEO 100 · LCP 2.6 s · CLS 0 | Lighthouse 12, local Chrome, two runs |
| Lighthouse production, mobile `/yashmittal` | Perf 97 · A11y 100 · SEO 100 · LCP 2.5 s · CLS 0 | Lighthouse 12 |
| Field Core Web Vitals (CrUX) | None — too little traffic | PageSpeed Insights |
| Listed avatars | 4 | production directory |

## After the change (local production build, same machine, same day)

| Page, mobile | Perf | A11y | BP* | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 98 | **100** | 96 | 100 | 2.4 s | 0 |
| test avatar page | 97 | 100 | 96 | 100 | 2.6 s | 0 |
| `/how-it-works` | 100 | 100 | 96 | 100 | 1.8 s | 0 |
| `/compare/delphi` | 99 | 100 | 96 | 100 | 2.2 s | 0 |

\* Best practices is 96 locally only because Vercel Analytics' script does not
exist outside Vercel (a console error); production has the same 96 today for its
own reasons. Local and production numbers are not strictly comparable (local
TTFB ~450 ms vs production ~700 ms from India); re-run on production after deploy.

## KPIs

| KPI | Where to read it | Cadence |
|---|---|---|
| Indexed pages (and why others are not) | Search Console → Pages | Weekly |
| Impressions, clicks, CTR, average position — **per cluster** | Search Console → Performance → Queries, filtered by regex per cluster (below) | Weekly, reviewed monthly |
| Pages that get impressions | Search Console → Performance → Pages | Monthly |
| Brand searches ("measagent", "me as agent") | Search Console → Queries containing `measagent\|me as agent` | Monthly |
| Launches that came from organic search | Vercel Analytics → Referrers (google.com, bing.com) on `/launch`; compare with launches in the admin portal | Monthly |
| Referrals from AI answers | Vercel Analytics → Referrers: chatgpt.com, perplexity.ai, claude.ai, copilot.microsoft.com | Monthly |
| Core Web Vitals (field) | Search Console → Core Web Vitals, once there is enough traffic; Vercel Speed Insights if enabled | Monthly |
| Backlinks and referring domains | Search Console → Links; openSEO backlinks overview when credits allow | Monthly |
| Rich result validity | Search Console → Enhancements (Breadcrumbs, Profile page) | After each deploy |

### Cluster filters for Search Console (Queries → Custom (regex))

| Cluster | Regex |
|---|---|
| Make / clone yourself | `(ai (clone\|version\|chatbot) (of )?(yourself\|myself\|me))\|make an ai of` |
| Digital twin | `digital twin\|ai twin` |
| Comparisons | `delphi\|personify\|coachvox\|alternative` |
| Personas | `founder\|creator\|teacher\|student` |
| Brand | `measagent\|me as agent` |
| Avatars (people's names) | everything landing on `/<handle>` pages — read by Page, not Query |

## Targets (realistic for a new `vercel.app` site with no links yet)

| | 30 days | 60 days | 90 days |
|---|---|---|---|
| Indexed pages | Home, how-it-works, guide, comparison, 3 personas, legal, listed avatars that pass the thin-page rule | All of those + weeks 3 & 5 pieces | All sitemap URLs indexed or explained |
| Impressions / month (all queries) | 100+ | 500+ | 1,500+ |
| Clicks / month | 5–20 (mostly brand and avatar names) | 30+ | 80+ |
| Guide cluster average position | measured, likely 40+ | top 30 for long-tail variants | top 20 for "how to make an ai of yourself" family |
| Brand query "measagent" | our home page ranks #1 | — | — |
| Referring domains | 3+ (launch channels) | 8+ | 15+ |
| Organic launches | first one attributed | — | 5+ |

These are deliberately modest: DataForSEO puts the whole target set at a few
thousand US searches a month, and a new subdomain earns trust slowly. The number
that says the strategy works is **impressions growing month on month in the
guide and digital-twin clusters**; if they stay flat at 90 days, the next move
is links (OFF-PAGE §4), not more pages.
