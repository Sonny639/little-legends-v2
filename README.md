# Little Legends

Personalised children's story builder with checkout, admin fulfilment, SMTP-backed confirmation emails, and paid download pages.

## Run Locally

```bash
npm install
npm run dev -- --port 3003
```

Open `http://localhost:3003`.

## Environment

Copy `.env.example` to `.env.local` and fill in the values you need:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=order-photos
DATABASE_URL=
DATABASE_SSL=true
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FAL_API_KEY=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
ORDER_ACCESS_SECRET=
CONTACT_TO_EMAIL=hello@littlelegendsstory.com
SMTP_HOST=smtp.porkbun.com
SMTP_PORT=587
SMTP_USER=hello@littlelegendsstory.com
SMTP_PASSWORD=
SMTP_FROM_EMAIL=hello@littlelegendsstory.com
SMTP_FROM_NAME=Little Legends Story
```

When `STRIPE_SECRET_KEY` is empty in local development, checkout runs in demo mode and the success page marks the order as `paid_demo`. In production, checkout fails closed until Stripe is configured.

When Stripe is configured, checkout creates a real Stripe Checkout Session. Paid orders are confirmed by the Stripe webhook, and the checkout success page also verifies the returned Stripe session as a fallback.

When `SUPABASE_SERVICE_ROLE_KEY` is set, uploaded child reference photos are stored privately before checkout continues. Admin photo previews use short-lived signed links and require the admin session. In local development without that key, uploads fall back to the local `data/order-photos` folder.

Set `ADMIN_PASSWORD` to enable the admin login screen on `/admin/login`. Set `ORDER_ACCESS_SECRET` to a long random value before launch; customer download, upgrade, photo upload, and full-story generation links are signed with it. `POST /api/orders` stays public so checkout can save new orders; order management, enquiries, email logs, artwork planning tools, and admin pages require the admin session. In production, protected routes fail closed if `ADMIN_PASSWORD` is missing.

## Main Routes

- `/` - public homepage and main entry point into the story builder.
- `/create` - story builder, customisation, preview, and checkout. This route is marked `noindex` while the public launch page is live.
- `/admin/orders` - order list, fulfilment status updates, CSV export, and confirmation email resend.
- `/admin` - admin dashboard for paid orders, revenue, print queue, enquiries, and email logs.
- `/admin/print-queue` - paid hardback and upgrade orders with quick printer fulfilment status updates.
- `/admin/enquiries` - customer enquiry inbox.
- Contact page enquiries are saved into `/admin/enquiries` and, when SMTP env vars are set, emailed to `CONTACT_TO_EMAIL`.
- `/admin/email-log` - confirmation email log. Order confirmations are sent by SMTP when configured and still logged for support.
- `/download/[orderId]?access=...` - locked until payment is confirmed and the signed customer access token is present, then renders the printable story.
- `/artwork` - protected artwork manifest and prompt review.

## Design Priority

Design and QA should be mobile-first, with iPhone-sized screens treated as the primary experience and desktop as the secondary enhancement.

## Local Data

Development orders and email logs are stored in:

- `data/orders.json`
- `data/email-log.json`
- `data/enquiries.json`
- `data/order-photos/`

These files are useful for local testing only. Replace this file storage with a database before production traffic.

## Database

When `NEXT_PUBLIC_SUPABASE_URL` is set, orders, enquiries, and email logs use Supabase tables instead of local JSON files. In production, server-side table access requires `SUPABASE_SERVICE_ROLE_KEY`; this lets Supabase RLS stay locked down while the public app still submits orders and enquiries through trusted Next.js routes. The app uses the existing `orders`, `enquiries`, and `email_logs` tables from `db/schema.sql`.

The older `DATABASE_URL` Postgres path remains as a fallback for non-Supabase deployments. Leave both Supabase and `DATABASE_URL` blank to keep using the local JSON fallback during development.

Create the tables:

```bash
npm run db:init
```

Import the current local JSON data:

```bash
npm run db:import-json
```

For Supabase production, run `db/schema.sql` in the Supabase SQL editor, then run `db/supabase-security.sql` to enable RLS and remove direct `anon`/`authenticated` access to customer tables.

## Checks

```bash
npm run lint
npm run build
```

With the dev server running, check the core order path:

```bash
npm run smoke:order
```

For launch setup, see `PRODUCTION.md`.
