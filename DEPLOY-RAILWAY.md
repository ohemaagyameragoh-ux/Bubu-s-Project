# Deploying to Railway

This app is one full-stack Next.js service plus a Postgres database. Railway hosts both.
Migrations run automatically on every deploy (see railway.json). You only do the setup once.

## Plan note

Railway has no perpetual free tier. The one-time Trial credit (about 5 USD) is enough to deploy
and test. To keep the app and database online, use the Hobby plan (5 USD per month, which includes
5 USD of usage). The steps below are the same on either.

## What Railway needs from you

Three environment variables on the app service:

- DATABASE_URL  : the Postgres connection (reference the Postgres service, see below)
- DIRECT_URL    : same value as DATABASE_URL for Railway Postgres
- AUTH_SECRET   : a long random string for signing sessions

Generate an AUTH_SECRET locally and copy the output:

    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

## Option A: Deploy from GitHub (recommended, auto-redeploys on push)

1. Put this folder on GitHub:
   - Create an empty repo at github.com (private is fine).
   - In this folder:  git init && git add . && git commit -m "Ace Mobility platform"
   - git branch -M main
   - git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
   - git push -u origin main
   (.env, node_modules, .next, and .pgdata are gitignored, so no secrets are pushed.)

2. On railway.app: New Project, then "Deploy from GitHub repo", pick the repo.
   Railway auto-detects Next.js and builds it.

3. In the project, click "New" then "Database" then "Add PostgreSQL".

4. Open the app service, go to Variables, and add:
   - DATABASE_URL = ${{Postgres.DATABASE_URL}}
   - DIRECT_URL   = ${{Postgres.DATABASE_URL}}
   - AUTH_SECRET  = (the value you generated above)
   The ${{Postgres.DATABASE_URL}} syntax references the Postgres service you just added.

5. Redeploy if it did not redeploy automatically. The start command runs
   "prisma migrate deploy" first, so the schema is created on the database.

6. Generate a public URL: app service, Settings, Networking, "Generate Domain".

## Option B: Deploy with the Railway CLI (no GitHub needed)

    npm i -g @railway/cli
    railway login
    railway init                 # create a new project
    railway add --database postgres   # add Postgres to the project
    railway up                   # build and deploy this folder

Then set the variables (CLI):

    railway variables --set "DATABASE_URL=${{Postgres.DATABASE_URL}}"
    railway variables --set "DIRECT_URL=${{Postgres.DATABASE_URL}}"
    railway variables --set "AUTH_SECRET=PASTE_YOUR_SECRET_HERE"
    railway up                   # redeploy with the variables
    railway domain               # generate a public URL

## Seeding demo data (optional)

The app works empty: a new trader just signs up. If you want the demo workspace and sample
trades from prisma/seed.ts on the hosted database, run once:

    railway run npm run db:seed

For a real production launch, skip seeding and sign up fresh through the app instead.

## Notes

- The local embedded Postgres (npm run pg:start) and the .pgdata folder are for development only.
  Production uses the Railway Postgres through DATABASE_URL.
- The build does not need a database connection. Migrations run at deploy time.
- Auth.js is set with trustHost true, so it works behind Railway's proxy without extra config.
  If you later add a custom domain, you can optionally set AUTH_URL to that domain.
