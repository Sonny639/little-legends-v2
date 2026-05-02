# Little Legends Production Checklist

Use this before sending real customers through checkout.

## Environment

Set these in the production host:

```bash
NEXT_PUBLIC_APP_URL=https://littlelegendsstory.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=order-photos
DATABASE_URL=
DATABASE_SSL=true
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
FAL_API_KEY=
CONTACT_TO_EMAIL=hello@littlelegendsstory.com
SMTP_HOST=smtp.porkbun.com
SMTP_PORT=587
SMTP_USER=hello@littlelegendsstory.com
SMTP_PASSWORD=
SMTP_FROM_EMAIL=hello@littlelegendsstory.com
SMTP_FROM_NAME=Little Legends Story
```

Required before launch:

- `NEXT_PUBLIC_APP_URL` must be the real public URL.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must point to the production Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY` is required for private order photo uploads during checkout.
- `SUPABASE_STORAGE_BUCKET` should point to a private bucket such as `order-photos`.
- Launch page signups are saved in `/admin/enquiries`; use production Supabase before collecting real emails.
- Use `hello@littlelegendsstory.com` as the public contact/reply inbox.
- Contact form notifications use Porkbun SMTP when `SMTP_PASSWORD` is set. Porkbun's SMTP settings are `smtp.porkbun.com`, port `587`, STARTTLS, with the full email address as the username.
- Launch page signups are saved in admin only; they do not send email notifications while the landing page is temporary.
- `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` must be strong unique values.
- `STRIPE_SECRET_KEY` must be the correct live or test key for the environment.
- `STRIPE_WEBHOOK_SECRET` must match the Stripe endpoint webhook secret.

## Database

Create or migrate the production tables in Supabase using the SQL from `db/schema.sql`.

For photo uploads, also create a private Supabase Storage bucket named `order-photos` or set `SUPABASE_STORAGE_BUCKET` to the bucket you want to use.

If using the older direct Postgres path instead of Supabase, set `DATABASE_URL` and run:

```bash
npm run db:init
```

Optional one-time import from local JSON:

```bash
npm run db:import-json
```

## Stripe

Configure a Stripe webhook endpoint:

```text
POST https://littlelegendsstory.com/api/stripe/webhook
```

Listen for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Then copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Preflight Checks

Run locally or in CI:

```bash
npm run lint
npm run build
```

With the app running:

```bash
npm run smoke:order
```

If Stripe is configured, the smoke test checks order save and checkout session creation. Full paid download unlock still requires an actual Stripe payment or webhook event.

## Manual Launch Test

Before launch, manually test:

- Create a story from `/create`.
- Choose a digital order and confirm Stripe checkout opens.
- Upload 1 to 3 child reference photos and confirm checkout only continues after they save successfully.
- Complete a test payment in Stripe test mode.
- Confirm `/checkout/success` marks the order paid.
- Open the download link.
- Confirm the order appears in `/admin/orders`.
- Resend confirmation email from admin.
- Create a hardback order and confirm postage details appear in admin.

## Content

Confirm all 18 launch hero types have:

- Bespoke story title and theme.
- Preview choices that make sense.
- Download page rendering.
- Artwork fallback or generated artwork plan.

## Operations

Keep admin credentials private. Check `/admin/orders`, `/admin/print-queue`, `/admin/enquiries`, and `/admin/email-log` after each test order.
