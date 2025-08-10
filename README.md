# Pred Link Tracker (Vercel + Google Sheets)

This project implements a minimal honey‑link system for per‑target tracking. Each link (e.g. `/ab12`) records visits to a Google Sheets backend and optionally sends Telegram alerts. It is designed for deployment on Vercel using Next.js (app router). No persistent server is required.

## Features

- Generate unique links for each target via the `/admin` interface.
- Log IP address, user agent, referrer and approximate geolocation to a Google Sheet via Apps Script.
- Optional Telegram notifications on each visit.
- Automatically redirect visitors to a configured fallback URL after a brief loading page.

## Setup

1. **Google Sheets & Apps Script**
   - Create a new Google Sheet with two tabs: **Visits** and **Links**. Use the following headers:
     - `Visits`: `ts`, `link_id`, `ip`, `country`, `region`, `city`, `lat`, `lon`, `asn`, `org`, `ua`, `referer`, `raw`
     - `Links`: `id`, `label`, `created_at`
   - Open **Extensions → Apps Script**, replace the default content with the script from the reference in the design, and deploy it as a **Web app** (execute as `Me`, access: `Anyone`). Note the deployment URL.
   - Update `.env` in your deployment with `GOOGLE_SCRIPT_BASE` set to the deployment URL (no trailing slash).

2. **Environment variables**
   - Copy `.env.example` to `.env` and fill in:
     - `GOOGLE_SCRIPT_BASE`: Web app base URL (no trailing slash).
     - `ADMIN_SECRET`: a strong secret used in the `/admin` API.
     - `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (optional) for alerts.
     - Branding variables (`NEXT_PUBLIC_BRAND_TITLE`, `NEXT_PUBLIC_FALLBACK_REDIRECT`).

3. **Deploy to Vercel**
   - Push this repository to GitHub and import it into Vercel.
   - In Vercel project settings, add the environment variables from your `.env` file.
   - Deploy the project. Ensure the project is running on Node.js and edge environments (Vercel handles this automatically).

4. **Generate a link**
   - Visit `/admin` on your deployed site.
   - Enter the `ADMIN_SECRET` and an optional label.
   - The interface returns a short path (e.g. `/ab12`). Share only that path; visits will be logged.

## How It Works

1. **Middleware (`middleware.ts`)** intercepts requests to any single‑segment path (e.g. `/abcd`). It forwards a background POST request to `/api/track` with the path via an `x-pathname` header.
2. **Tracking endpoint (`/api/track/route.ts`)** runs on the edge runtime. It extracts the visitor IP, looks up geolocation via `ipapi.co`, and POSTs the data to Google Sheets (`GOOGLE_SCRIPT_BASE?path=visit`). If Telegram credentials are provided, it sends a notification.
3. **Admin endpoint (`/api/admin/links/route.ts`)** requires a bearer token set to `ADMIN_SECRET`. It generates a random ID, records it in the Google sheet (`path=link`), and returns the ID.
4. **Client pages** provide a basic UI: a home page, per‑ID landing page with spinner and redirect, and an admin page to create new links.

## Legal Disclaimer

Use this software responsibly and consult legal counsel before deploying in jurisdictions with strict privacy or cybersecurity laws. This project collects minimal visitor data (IP, UA, approximate geo) and stores it in a Google Sheet you control. Do not use this without the informed consent of your users or proper authority.
