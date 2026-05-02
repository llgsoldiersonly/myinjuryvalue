# MyInjuryValue.com

Mobile-first car-accident case-value calculator + lead-qualification + intake-acceleration system.

Stack: **Next.js (App Router) · TailwindCSS · Supabase · Twilio Voice + SMS · Resend · Meta Pixel + CAPI · Vercel.**

---

## Project structure

```
myinjuryvalue/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── supabase/
│   └── schema.sql
└── src/
    ├── middleware.ts                       # basic-auth gate for /dashboard + /api/dashboard
    ├── app/
    │   ├── layout.tsx                      # html shell, fonts, Meta Pixel mount
    │   ├── globals.css                     # Tailwind + brand utilities
    │   ├── page.tsx                        # landing
    │   ├── calculator/page.tsx
    │   ├── result/page.tsx
    │   ├── api/
    │   │   ├── leads/route.ts              # POST – create lead, score, side-effects
    │   │   ├── twilio/
    │   │   │   ├── intake-whisper/route.ts # plays whisper script, gathers DTMF
    │   │   │   ├── intake-gather/route.ts  # 1 = connect, 2 = skip
    │   │   │   ├── lead-intro/route.ts     # plays intro, joins conference
    │   │   │   ├── voicemail/route.ts      # vm + missed-call SMS + intake alert
    │   │   │   └── status/route.ts         # call status callbacks + backup roll-over
    │   │   └── dashboard/
    │   │       ├── notes/route.ts
    │   │       ├── status/route.ts
    │   │       ├── sms/route.ts
    │   │       ├── call/route.ts
    │   │       └── reps/route.ts
    │   └── dashboard/
    │       ├── layout.tsx
    │       ├── page.tsx                    # lead queue (filters, search, priority sort)
    │       ├── leads/[id]/page.tsx         # lead detail + opener + notes + activity
    │       ├── calls/page.tsx
    │       └── settings/page.tsx
    ├── components/
    │   ├── Logo.tsx                        # web-native adaptation of the logo mockup
    │   ├── MetaPixel.tsx
    │   ├── Landing.tsx
    │   ├── Calculator.tsx                  # conditional flow, auto-advance, mid-funnel
    │   ├── ProgressBar.tsx
    │   └── dashboard/
    │       ├── LeadQueue.tsx
    │       ├── LeadActions.tsx
    │       ├── RepEditor.tsx
    │       └── QualityPill.tsx
    └── lib/
        ├── types.ts
        ├── questions.ts                    # full conditional tree + showIf rules
        ├── scoring.ts                      # score, value_min/max, lead_quality
        ├── supabase.ts
        ├── twilio.ts                       # warm-transfer kickoff, scripts, SMS
        ├── resend.ts                       # case-value + intake + backup emails
        ├── meta-capi.ts                    # SHA-256 hashed Lead event
        ├── tracking.ts                     # UTM/fbclid/fbp/fbc capture (client)
        └── opener.ts                       # auto-generated intake opener
```

---

## Environment variables

Copy `.env.example` to `.env.local` (dev) or set in Vercel (prod):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_META_PIXEL_ID=
META_ACCESS_TOKEN=
META_TEST_EVENT_CODE=         # optional, for the Test Events tab

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=          # E.164, e.g. +18885550123

RESEND_API_KEY=
RESEND_FROM_EMAIL="My Injury Value <noreply@myinjuryvalue.com>"

PUBLIC_BASE_URL=https://myinjuryvalue.com   # MUST be the public URL Twilio can reach
CALLBACK_NUMBER=+18885550123                # the number we tell leads to call back

DASHBOARD_USER=admin
DASHBOARD_PASS=change-me

INTAKE_EMAIL_TO=intake@yourfirm.com,manager@yourfirm.com
```

---

## Setup

### 1. Install + dev

```bash
npm install
npm run dev
```

App runs at <http://localhost:3000>. The dashboard is at `/dashboard` (basic-auth via `DASHBOARD_USER`/`DASHBOARD_PASS`).

### 2. Supabase

1. Create a new Supabase project.
2. In the SQL editor, paste and run `supabase/schema.sql`.
3. Copy the project URL and **service role** key into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. (The dashboard reads via service role on the server — RLS is enabled but only the service role bypasses it.)
4. Insert at least one intake rep. Either via `/dashboard/settings`, or:
   ```sql
   insert into intake_reps (name, phone, priority_order, active)
   values ('Primary', '+15551234567', 1, true),
          ('Backup',  '+15557654321', 2, true);
   ```

### 3. Twilio

1. Buy a voice + SMS-capable number.
2. In **Phone Numbers → Active numbers → your number**:
   - **A call comes in** isn't actually used by the warm-transfer flow (we initiate calls *outbound* from the API), but you can leave the default or set a fallback voicemail.
3. The voice flow uses **outbound calls created from the server** — Twilio fetches TwiML from your public deploy, so `PUBLIC_BASE_URL` must be reachable. For local dev, expose with `ngrok http 3000` and set `PUBLIC_BASE_URL=https://<your>.ngrok.app`.

#### Twilio webhook URLs (all hosted by this app)

| Purpose | Method | URL |
| --- | --- | --- |
| Intake whisper TwiML | POST | `${PUBLIC_BASE_URL}/api/twilio/intake-whisper?lead_id=…&rep_phone=…` |
| Intake DTMF gather | POST | `${PUBLIC_BASE_URL}/api/twilio/intake-gather?lead_id=…&rep_phone=…` |
| Lead intro TwiML | POST | `${PUBLIC_BASE_URL}/api/twilio/lead-intro?lead_id=…&conference=…` |
| Lead voicemail / no-answer | POST | `${PUBLIC_BASE_URL}/api/twilio/voicemail?lead_id=…` |
| Call status callbacks | POST | `${PUBLIC_BASE_URL}/api/twilio/status?lead_id=…&leg=intake|lead&rep_phone=…` |

The app wires all of these as `url`/`statusCallback` params on the outbound `calls.create()` calls — you don't have to configure them in the Twilio console.

### 4. Meta

1. Create a Pixel; put its ID in `NEXT_PUBLIC_META_PIXEL_ID`.
2. Generate a CAPI access token (Events Manager → Settings → Conversions API).
3. Optional: set `META_TEST_EVENT_CODE` to verify in the Test Events tab.

The app fires the following:

- **Client (Meta Pixel):** `PageView`, `ViewContent`, `Lead`, `CompleteRegistration`, `Contact`.
- **Server (CAPI):** `Lead` with hashed email, phone, name, state + `fbp`/`fbc` cookies + IP + UA + `score`, `lead_quality`, `value_max` as custom data. The `event_id` is shared with the client `fbq('track','Lead', {}, { eventID })` call — Meta uses it for deduplication.

### 5. Resend

Verify your sending domain, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. The app sends:
- case-value email to the lead on submission
- intake-team alert email
- backup follow-up email when the lead misses the call

### 6. Deploy on Vercel

1. Import the repo into Vercel.
2. Set every env var from `.env.example` in the project settings (production + preview).
3. Set `PUBLIC_BASE_URL` to the production URL (e.g. `https://myinjuryvalue.com`).
4. Deploy.

---

## Lead flow at a glance

```
Landing → Calculator → POST /api/leads
                          ├─ score + insert into case_calculator_leads
                          ├─ Meta CAPI Lead event (hashed)
                          ├─ Twilio outbound to primary intake rep
                          │     └─ /intake-whisper plays the script
                          │           └─ /intake-gather (press 1)
                          │                 └─ Twilio outbound to lead
                          │                       └─ /lead-intro joins conference
                          ├─ Resend: case value email to lead
                          ├─ Resend: intake alert email
                          └─ Twilio SMS confirmation to lead
```

If the rep doesn't answer, `/api/twilio/status` rolls over to the next active rep by `priority_order`.

If the lead doesn't answer, `/api/twilio/voicemail` plays the missed-call message and fires:
- missed-call SMS to lead
- intake-missed-call SMS to all active reps
- backup follow-up email to lead

---

## Testing checklist

Pre-launch:

- [ ] `npm run typecheck` passes.
- [ ] `supabase/schema.sql` runs cleanly on a fresh project.
- [ ] At least one row in `intake_reps` is `active = true`.
- [ ] Landing renders, yellow CTA scrolls to / navigates to `/calculator`.
- [ ] Calculator: every conditional shows when expected (e.g. `medical_treatment = "Ambulance / ER"` reveals the hospital-admitted step).
- [ ] Auto-advance fires on each option tap.
- [ ] Back button works mid-flow and returns home from step 1.
- [ ] Mid-funnel reassurance shows once after the fault step.
- [ ] Submit succeeds: `case_calculator_leads` row appears with score, value_min, value_max, lead_quality.
- [ ] Result page shows the correct range.
- [ ] Meta Test Events shows `Lead` from both browser + server with the same `event_id`.
- [ ] Twilio call lands on the primary rep with the whisper script.
- [ ] Pressing 1 dials the lead and bridges both legs.
- [ ] Pressing 2 (or no answer) rolls over to the backup rep.
- [ ] If the lead doesn't answer, voicemail plays, missed-call SMS sends, intake alert SMS sends.
- [ ] Confirmation SMS arrives on the lead's phone.
- [ ] Case-value email arrives in the lead's inbox.
- [ ] Intake email alert arrives in `INTAKE_EMAIL_TO`.
- [ ] `/dashboard` lists the lead, sorted with `URGENT_REVIEW` first.
- [ ] Filters (quality / status / state / search) apply correctly.
- [ ] Lead detail page shows the auto-generated opener, notes, and activity.
- [ ] "Call lead now" from the dashboard re-triggers the warm transfer.
- [ ] "Send SMS" from the dashboard delivers a message.
- [ ] Status changes persist and reflect in the queue.

---

## Notes

- **Estimates are not legal advice.** The result page makes that clear, but make sure your final marketing copy and TCPA consent language match your jurisdiction.
- The dashboard auth is intentionally simple (basic auth at the edge). Swap to Supabase Auth or NextAuth if you want SSO + per-rep accounts.
- All Twilio numbers must be in E.164 (`+1XXXXXXXXXX`).
- The score weights and value buckets in `src/lib/scoring.ts` are tuned to the handoff's hot/bad-signal lists — calibrate them once you have a few weeks of data.
