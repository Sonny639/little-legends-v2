# Little Legends

Personalised children's story builder with checkout, admin fulfilment, confirmation email logging, and paid download pages.

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
DATABASE_URL=
DATABASE_SSL=true
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FAL_API_KEY=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
CONTACT_TO_EMAIL=hello@littlelegendsstory.com
SMTP_HOST=smtp.porkbun.com
SMTP_PORT=587
SMTP_USER=hello@littlelegendsstory.com
SMTP_PASSWORD=
SMTP_FROM_EMAIL=hello@littlelegendsstory.com
SMTP_FROM_NAME=Little Legends Story
```

When `STRIPE_SECRET_KEY` is empty, checkout runs in demo mode and the success page marks the order as `paid_demo`.

When Stripe is configured, checkout creates a real Stripe Checkout Session. Paid orders are confirmed by the Stripe webhook, and the checkout success page also verifies the returned Stripe session as a fallback.

Set `ADMIN_PASSWORD` to enable the admin login screen on `/admin/login`. `POST /api/orders` stays public so checkout can save new orders; order management, enquiries, email logs, and admin pages require the admin session.

## Main Routes

- `/` - public Coming Soon landing page for the domain.
- `/create` - story builder, customisation, preview, and checkout. This route is marked `noindex` while the public launch page is live.
- `/admin/orders` - order list, fulfilment status updates, CSV export, and confirmation email resend.
- `/admin` - admin dashboard for paid orders, revenue, print queue, enquiries, and email logs.
- `/admin/print-queue` - paid hardback and upgrade orders for printer fulfilment.
- `/admin/enquiries` - customer enquiry inbox.
- Launch page email signups are saved into `/admin/enquiries` with the subject `Coming soon launch list`.
- Contact page enquiries are saved into `/admin/enquiries` and, when SMTP env vars are set, emailed to `CONTACT_TO_EMAIL`.
- `/admin/email-log` - confirmation email log.
- `/download/[orderId]` - locked until payment is confirmed, then renders the printable story.
- `/artwork` - artwork manifest and prompt review.

## Design Priority

Design and QA should be mobile-first, with iPhone-sized screens treated as the primary experience and desktop as the secondary enhancement.

## Local Data

Development orders and email logs are stored in:

- `data/orders.json`
- `data/email-log.json`
- `data/enquiries.json`

These files are useful for local testing only. Replace this file storage with a database before production traffic.

## Database

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, orders, enquiries, and email logs use Supabase tables instead of local JSON files. The app uses the existing `orders`, `enquiries`, and `email_logs` tables from `db/schema.sql`.

The older `DATABASE_URL` Postgres path remains as a fallback for non-Supabase deployments. Leave both Supabase and `DATABASE_URL` blank to keep using the local JSON fallback during development.

Create the tables:

```bash
npm run db:init
```

Import the current local JSON data:

```bash
npm run db:import-json
```

For Supabase production, make sure the schema in `db/schema.sql` has already been run in the Supabase SQL editor.

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
