# Supabase Setup

## 1. Configure the app

The project is already wired to your Supabase instance in:

- [`assets/supabase-config.js`](C:/Users/MOHAMED%20SHAM/Downloads/sham%20posh...2/2026-04-19-act-as-a-senior-ui-ux/assets/supabase-config.js)

## 2. Deploy the schema

Open the Supabase SQL editor and run:

- [`supabase-deploy.sql`](C:/Users/MOHAMED%20SHAM/Downloads/sham%20posh...2/2026-04-19-act-as-a-senior-ui-ux/supabase-deploy.sql)

That script creates:

- `site_settings`
- `services`
- `leads`
- `bookings`
- `gallery_items`
- `testimonials`

It also creates the public Supabase Storage bucket `gallery-media` for image and video uploads.

It also enables row-level security, creates the public/admin policies, and seeds starter content.

## 3. Create an admin user

In Supabase Auth:

1. Open `Authentication`.
2. Create a new user with email and password.
3. Use those credentials on:

- [`admin.html`](C:/Users/MOHAMED%20SHAM/Downloads/sham%20posh...2/2026-04-19-act-as-a-senior-ui-ux/admin.html)

## 4. Verify the schema

Use the browser health check page:

- [`health.html`](C:/Users/MOHAMED%20SHAM/Downloads/sham%20posh...2/2026-04-19-act-as-a-senior-ui-ux/health.html)

What you should see:

- `Live: schema is reachable.` if the tables are deployed
- `Not live yet: schema missing.` if the SQL has not been run

## 5. Test the site

After deployment, check these flows:

- homepage content loads from Supabase
- contact form inserts into `leads`
- admin sign-in works
- admin CRUD saves to the live tables

## 6. Security note

The current admin policies allow any authenticated Supabase user to manage the dashboard tables. That is fine for a single-admin setup.

If you want stricter security later, the next step is to add an admin role table or custom claims and restrict authenticated CRUD to admins only.
