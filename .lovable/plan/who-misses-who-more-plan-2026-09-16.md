# "Who Misses Who More" — Plan

A cute, playful two-button site for Liam & Hope. Each person taps their button to say "I miss you," their count goes up, and both phones see each other's number update live.

## How it works

- Two big buttons on one page:
  - **"I miss Hope 💛"** — Liam's button (counts how much Liam misses Hope)
  - **"I miss Liam 💛"** — Hope's button (counts how much Hope misses Liam)
- Tapping a button instantly bumps that person's number.
- Live sync: when Hope taps on her phone, Liam's phone updates within a second (and vice-versa), via realtime subscriptions.
- A little header line shows who's "winning" (e.g. "Hope misses Liam more… for now 💫").

## Cute & playful design

- Soft pastel palette: warm cream background, blush-pink and butter-yellow accents, friendly rounded buttons.
- Big chunky tappable buttons with a gentle press/scale animation.
- Floating heart particles burst out on each tap (CSS animation, no heavy libs).
- Counters shown as large friendly numbers with a tiny label under each.
- Playful rounded font (e.g. Nunito / Baloo-ish) loaded via `<link>` in the root head.
- Fully responsive — looks great on a phone since that's how they'll mostly use it.

## Backend (Lovable Cloud)

Since counts must sync live across two phones, this needs a backend. We'll enable **Lovable Cloud** (free, zero setup) to get a database.

- One table `miss_counts` with a single row holding `liam_count` and `hope_count`.
- A SQL function `increment_count(which)` that atomically bumps a counter and returns both new totals (avoids race conditions when both tap at once).
- Realtime enabled on the table so both phones get live updates.
- Public read access so the page works without logins (it's a fun shared toy, not sensitive data).

## Files to create/change

1. **Enable Lovable Cloud** via the integration tool.
2. **Database migration** — create `miss_counts` table (seeded at 0/0), the `increment_count` RPC, grants, and RLS allowing public reads.
3. `**src/lib/miss.functions.ts**` — server function wrapping the increment RPC (so the publishable key stays server-side).
4. `**src/routes/index.tsx**` — the main page: two buttons, live counts via Supabase realtime subscription, tap-to-increment, heart-burst animation, winner line. Replaces the current placeholder.
5. `**src/routes/__root.tsx**` — add the web-font `<link>` and a proper page title/description.
6. **Head metadata** — set a fun title like "Liam & Hope 💛 Who Misses Who More?" on the index route.

## What you'll see

A warm, playful single page with two heart buttons. Tap yours and your number climbs; watch Hope's number jump in real time when she taps hers on her own phone.

## Notes / open items

- No accounts needed — the page is public and shared. (Anyone with the link could tap, but it's just for fun. Say the word if you'd rather lock it to just the two of you.)
- For maxindlinemum battery friess the live updates use Supabase realtime; it falls back to a short poll if realtime isn't available.