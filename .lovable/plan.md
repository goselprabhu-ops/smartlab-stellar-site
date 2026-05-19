# SmartLab Online — Marketing Website Plan

A premium, investor-ready marketing site built on the default TanStack Start template, with a Lovable Cloud–backed contact form.

## Design system

Update `src/styles.css` with the Emerald Prestige palette in oklch:
- `--background` cream `#f5f0e0`, `--foreground` deep emerald `#064e3b`
- `--primary` emerald `#064e3b` / `--primary-foreground` cream
- `--accent` gold `#c9a84c` / `--accent-foreground` emerald
- Dark variant for hero sections (deep emerald bg, cream text, gold accents)
- Gradients: `--gradient-hero` emerald → near-black; `--gradient-gold` for subtle accent lines
- Shadows: soft gold-tinted elevation
- Typography: load Space Grotesk (headings) + DM Sans (body) via Google Fonts `<link>` in `__root.tsx` head; set `--font-display` and `--font-body`, apply via Tailwind utility classes

Generous whitespace (large section padding), thin gold dividers, restrained motion (fade/slide on scroll only).

## Routes (each a separate file with its own `head()` meta)

```
src/routes/
  __root.tsx        — adds shared <Header/> + <Footer/>, fonts, sitewide meta defaults, Toaster
  index.tsx         — Home (dark hero + pitch + dual CTA + feature teaser + pricing teaser)
  features.tsx      — 3 feature blocks
  pricing.tsx       — 3 tiers + annual discount + bulk note
  about.tsx         — Mission + tagline + audience
  contact.tsx       — Form (Cloud-backed) + support email + WhatsApp
```

Each route's `head()` sets unique `title`, `description`, `og:title`, `og:description`. Canonical only on leaves.

## Shared components

- `src/components/Header.tsx` — logo (left), nav links, "Experience Smart Lab" gold button (right)
- `src/components/Footer.tsx` — logo, nav, contact, copyright, gold top-border
- `src/components/CtaButton.tsx` — primary gold→emerald button linking to `https://smartlabonline.app` (opens new tab)
- `src/components/SectionHeading.tsx` — eyebrow + heading + subhead pattern
- Logo: user will attach `logo.png` → I'll save under `src/assets/logo.png` and import in Header/Footer

## Page content

**Home (`/`)** — Dark hero (emerald gradient + faint gold grid), eyebrow "AI-powered learning ecosystem", H1 with gold-accented phrase "intelligent progress", pitch paragraph, dual CTAs: "Experience Smart Lab" (primary, → smartlabonline.app) and "Book a Free Smart Learning Demo" (secondary, → smartlabonline.app). Below: 3-up feature teaser, pricing teaser, audience strip (Classes 6–12 CBSE • Strongest fit 8–10), final CTA band. Placeholder hero illustration generated and saved to `src/assets/`.

**Features (`/features`)** — 3 alternating blocks (zigzag):
1. AI Personalized Study Plans
2. Smart Revision & Concept Mastery
3. Parent & Teacher Visibility
Each: icon, headline, 2-sentence description, bullet list of capabilities.

**Pricing (`/pricing`)** — 3 cards (Smart Plus highlighted with gold border + "Most popular"):
- Starter — ₹499/mo
- Smart Plus — ₹999/mo
- Premium Pro — ₹1999/mo
Below cards: note "Save 20% with annual billing" + "School & tuition bulk pricing — contact us" linking to `/contact`. CTA on each card → smartlabonline.app.

**About (`/about`)** — Mission section, hero tagline "transforms studying into intelligent progress", who it's for, closing CTA band.

**Contact (`/contact`)** — Two-column: form (left) + contact info (right).
Form fields: name, email, grade (select 6–12), message. Validated with Zod, submitted to a Cloud table via `createServerFn`.
Right column: `support@smartlabonline.com`, WhatsApp `+91 9XXXXXXXXX` (placeholder, user to replace), response-time note.

## Lovable Cloud — contact form

Enable Lovable Cloud, then create:

```sql
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  grade text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_submissions enable row level security;

-- Public can insert (form submissions); no select policy = no public read
create policy "anyone can submit"
on public.contact_submissions for insert
to anon, authenticated
with check (true);
```

Server function `src/lib/contact.functions.ts`:
- `createServerFn({ method: "POST" })` with Zod input validation (length limits, email format, grade enum 6–12, message ≤ 1000 chars)
- Inserts via authenticated supabase client; returns `{ ok: true }` or error
Called from contact form via `useServerFn` + toast feedback (sonner).

## SEO

- Per-route `head()` with unique title/description/og tags
- JSON-LD `Organization` in `__root.tsx`
- Single H1 per page, semantic sections, alt text on logo/hero
- `/about` adds JSON-LD `AboutPage`; `/pricing` adds `Product`+`Offer` blocks

## Technical notes

- Stack: TanStack Start (existing template), Tailwind v4 tokens in `src/styles.css`
- All colors via semantic tokens — no raw hex in components
- Fonts loaded via Google Fonts link in root `head.links`
- Contact form uses `createServerFn` (NOT a loader) with `requireSupabaseAuth` omitted since form is public; uses `supabaseAdmin` server-side after Zod validation, or anon client respecting RLS insert policy (preferred — keeps service role unused)
- All "Experience Smart Lab" CTAs use `<a href="https://smartlabonline.app" target="_blank" rel="noopener noreferrer">`
- Hero image: generated placeholder (abstract emerald/gold geometric) saved to `src/assets/hero.jpg`, swappable later

## Build order

1. Enable Lovable Cloud + create `contact_submissions` table
2. Update `src/styles.css` tokens + load fonts
3. Save attached `logo.png` to `src/assets/`
4. Generate placeholder hero image
5. Build `Header`, `Footer`, `CtaButton`, `SectionHeading`
6. Update `__root.tsx` with layout, fonts, sitewide meta, JSON-LD
7. Implement 5 route files with content + per-route `head()`
8. Implement contact server function + wire form
9. Verify build, sanity-check each route

Ready to implement on approval.