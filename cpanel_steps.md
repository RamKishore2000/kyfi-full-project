# Dealerbase cPanel Deployment Guide

This guide covers the first production deployment and future updates for:

- Website: `https://dealerbase.in`
- Admin: `https://admin.dealerbase.in`
- Backend API: `https://api.dealerbase.in/api`

Replace placeholders such as `CPANEL_USER`, `REPOSITORY_URL`, and folder names with the actual Dealerbase values. Never commit production `.env` files, passwords, API secrets, or private keys.

## 1. Required Information

Collect these details before starting:

- cPanel login and server IP
- Git repository URL and branch
- Backend, frontend, and admin folder names
- Backend startup file, usually `server.js`
- Database schema and optional seed/import scripts
- Production environment variables
- Payment, SMS, email, Maps, and storage credentials

## 2. Create Domains

Open `cPanel -> Domains -> Create A New Domain`.

Create:

```text
dealerbase.in
Document root: /home/CPANEL_USER/public_html

admin.dealerbase.in
Document root: /home/CPANEL_USER/admin.dealerbase.in

api.dealerbase.in
Document root: /home/CPANEL_USER/api.dealerbase.in
```

Do not share the main domain document root with the subdomains.

If DNS is external, add:

```text
Type  Name   Value
A     @      SERVER_IP
A     admin  SERVER_IP
A     api    SERVER_IP
```

## 3. Enable SSL

Open `cPanel -> SSL/TLS Status` and run AutoSSL for:

- `dealerbase.in`
- `www.dealerbase.in`
- `admin.dealerbase.in`
- `api.dealerbase.in`

Continue only after all required domains open through HTTPS without certificate errors.

## 4. Clone the Repository

Open `cPanel -> Terminal` and run:

```bash
whoami
pwd
git --version

cd /home/CPANEL_USER
git clone REPOSITORY_URL dealerbase-full-project
ls -la /home/CPANEL_USER/dealerbase-full-project
```

For private repositories, configure a GitHub deploy key. Do not store a Git token in deployment scripts.

## 5. Create the MySQL Database

Open `cPanel -> Database Wizard`.

Create:

```text
Database suffix: dealerbase_prod
User suffix: dealerbase_app
```

cPanel usually adds the account prefix. Record the exact final values, for example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=CPANEL_USER_dealerbase_prod
DB_USER=CPANEL_USER_dealerbase_app
DB_PASSWORD=GENERATED_STRONG_PASSWORD
```

Assign the database user to the database with `ALL PRIVILEGES`.

## 6. Prepare the Backend Folder

Use a separate production application folder instead of running directly from the Git clone:

```bash
mkdir -p /home/CPANEL_USER/dealerbase-backend

rsync -av --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude uploads \
  /home/CPANEL_USER/dealerbase-full-project/BACKEND_FOLDER/ \
  /home/CPANEL_USER/dealerbase-backend/
```

Replace `BACKEND_FOLDER` with the actual repository folder. The exclusions prevent deployment from deleting production secrets and uploaded files.

## 7. Create the Node.js Application

Open `cPanel -> Setup Node.js App` and create:

```text
Node.js version: 22.x or the version required by package.json
Application mode: Production
Application root: dealerbase-backend
Application URL: api.dealerbase.in
Startup file: server.js
```

Use the backend's real startup filename when it differs.

Activate the cPanel Node environment:

```bash
source /home/CPANEL_USER/nodevenv/dealerbase-backend/22/bin/activate
node -v
npm -v
```

Install dependencies:

```bash
cd /home/CPANEL_USER/dealerbase-backend
npm install
```

Use `npm ci --omit=dev` instead only when the project supports production-only dependencies and has a valid lockfile.

## 8. Create the Backend Environment File

```bash
cd /home/CPANEL_USER/dealerbase-backend
cp .env.example .env
nano .env
```

Example structure:

```env
NODE_ENV=production
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=CPANEL_USER_dealerbase_prod
DB_USER=CPANEL_USER_dealerbase_app
DB_PASSWORD=DATABASE_PASSWORD

JWT_SECRET=LONG_RANDOM_SECRET
FRONTEND_URL=https://dealerbase.in
ADMIN_URL=https://admin.dealerbase.in

RAZORPAY_KEY_ID=PRODUCTION_KEY_ID
RAZORPAY_KEY_SECRET=PRODUCTION_KEY_SECRET
SMS_AUTH_KEY=PRODUCTION_SMS_KEY
```

Use only variables required by Dealerbase. Generate a JWT secret with:

```bash
openssl rand -hex 64
```

Save Nano with `Ctrl+O`, `Enter`, then `Ctrl+X`.

Protect the environment file:

```bash
chmod 600 /home/CPANEL_USER/dealerbase-backend/.env
```

## 9. Import the Database Schema

Inspect the schema first:

```bash
cd /home/CPANEL_USER/dealerbase-backend
head -n 20 database/schema.sql
```

Import a production-ready schema:

```bash
mysql -u CPANEL_USER_dealerbase_app -p CPANEL_USER_dealerbase_prod < database/schema.sql
```

Shared hosting users usually cannot execute `CREATE DATABASE` or `USE another_database`. If those statements exist, create a cleaned schema:

```bash
grep -v -E '^[[:space:]]*(CREATE DATABASE|USE )[[:space:]]' database/schema.sql > database/schema.production.sql
mysql -u CPANEL_USER_dealerbase_app -p CPANEL_USER_dealerbase_prod < database/schema.production.sql
```

Verify:

```bash
mysql -u CPANEL_USER_dealerbase_app -p CPANEL_USER_dealerbase_prod -e "SHOW TABLES;"
```

If a foreign-key error occurs, make the referenced and referencing columns use identical type, size, and `UNSIGNED` settings. Do not remove constraints simply to bypass the error.

## 10. Import Seed or Master Data

Run only Dealerbase scripts, for example:

```bash
source /home/CPANEL_USER/nodevenv/dealerbase-backend/22/bin/activate
cd /home/CPANEL_USER/dealerbase-backend
npm run seed
```

or:

```bash
npm run import:locations
```

Before running an import, confirm:

- Required files exist on the server.
- The script uses production `.env` values.
- It contains no Windows path such as `C:\Users\...`.
- Re-running the import will not create incorrect duplicates.

Verify important row counts with project-specific SQL queries.

## 11. Start and Test the Backend

Restart from:

```text
cPanel -> Node.js -> api.dealerbase.in -> Restart
```

Test a real public endpoint:

```bash
curl -i https://api.dealerbase.in/api/health
```

Replace `/api/health` with an endpoint Dealerbase actually provides. A bare API domain may return `Route not found` when no `/` route exists; that does not prove the API is broken.

Check errors in the cPanel Node logs, application `stderr.log`, or `/home/CPANEL_USER/logs`.

## 12. Configure the Frontend API URL

Create the frontend production environment file using the exact variable expected by Dealerbase:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.dealerbase.in/api
```

Public variables are embedded at build time. Rebuild after changing them. Never expose backend secrets through `NEXT_PUBLIC_` variables.

## 13. Configure Static Next.js Export

For a static Next.js site hosted in File Manager, use:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
```

`trailingSlash: true` creates route folders such as `login/index.html`, allowing direct refreshes without complicated rewrite rules.

Do not use static export when the frontend requires Next.js server actions, middleware, server rendering, or Next.js API routes. Such a frontend must run as another Node.js application.

## 14. Build the Main Frontend Locally

Do not build a large Next.js frontend on shared cPanel hosting. Worker and memory limits can cause failures.

Windows PowerShell:

```powershell
cd "D:\PATH\TO\dealerbase-project\FRONTEND_FOLDER"
npm install
npm run build
Get-ChildItem .\out
```

The `out` directory must contain `index.html`, `_next`, and route folders.

Create a Linux-compatible ZIP:

```powershell
$zip = "D:\PATH\TO\dealerbase-project\deploy-artifacts\dealerbase-frontend.zip"
New-Item -ItemType Directory -Force -Path (Split-Path $zip) | Out-Null
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
tar.exe -a -c -f $zip -C "D:\PATH\TO\dealerbase-project\FRONTEND_FOLDER\out" .
tar.exe -tf $zip | Select-Object -First 30
```

Confirm `./index.html` and `./_next/static/` exist. Using `tar.exe -a` avoids Windows backslash paths that can cause JavaScript chunk 404 errors after cPanel extraction.

## 15. Upload the Main Frontend

Open File Manager at:

```text
/home/CPANEL_USER/public_html
```

Back up the existing live files first. Delete the files inside `public_html`, but do not delete the `public_html` folder.

Upload `dealerbase-frontend.zip` and extract it directly into:

```text
/home/CPANEL_USER/public_html
```

Correct structure:

```text
/home/CPANEL_USER/public_html/index.html
/home/CPANEL_USER/public_html/_next/static/...
/home/CPANEL_USER/public_html/login/index.html
```

Incorrect structure:

```text
/home/CPANEL_USER/public_html/out/index.html
```

Fix permissions:

```bash
find /home/CPANEL_USER/public_html -type d -exec chmod 755 {} \;
find /home/CPANEL_USER/public_html -type f -exec chmod 644 {} \;
```

Delete the uploaded ZIP after extraction. Test `https://dealerbase.in` and a direct route in an incognito window.

## 16. Build and Upload the Admin Frontend

Set the admin production API URL:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.dealerbase.in/api
```

Build locally:

```powershell
cd "D:\PATH\TO\dealerbase-project\ADMIN_FOLDER"
npm install
npm run build
```

Create the ZIP:

```powershell
$zip = "D:\PATH\TO\dealerbase-project\deploy-artifacts\dealerbase-admin.zip"
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
tar.exe -a -c -f $zip -C "D:\PATH\TO\dealerbase-project\ADMIN_FOLDER\out" .
```

Upload and extract directly into:

```text
/home/CPANEL_USER/admin.dealerbase.in
```

Fix permissions:

```bash
find /home/CPANEL_USER/admin.dealerbase.in -type d -exec chmod 755 {} \;
find /home/CPANEL_USER/admin.dealerbase.in -type f -exec chmod 644 {} \;
```

Test the admin root, login, dashboard, and a direct route refresh.

## 17. CORS and Upload Storage

Allow only required production origins:

```text
https://dealerbase.in
https://www.dealerbase.in
https://admin.dealerbase.in
```

If the backend stores files on disk:

- Exclude uploads from destructive deployment synchronization.
- Expose uploads through HTTPS.
- Back up uploads independently from the database.
- Confirm directory write permissions for the Node process.

## 18. Production Verification

Verify:

- Website and admin load without console errors.
- Direct route refreshes do not return 404.
- Real API endpoints return expected responses.
- Registration, password login, and OTP login work.
- Protected APIs reject missing or invalid tokens.
- Database writes and reads work.
- Uploaded files open through HTTPS.
- CORS has no browser errors.
- Payment uses production keys and verified webhooks.
- SMS uses approved production templates.
- SSL is valid on all domains.
- No secret exists in Git or frontend bundles.

## 19. Future Backend Updates

```bash
cd /home/CPANEL_USER/dealerbase-full-project
git pull origin main

rsync -av --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude uploads \
  /home/CPANEL_USER/dealerbase-full-project/BACKEND_FOLDER/ \
  /home/CPANEL_USER/dealerbase-backend/
```

If dependencies changed:

```bash
source /home/CPANEL_USER/nodevenv/dealerbase-backend/22/bin/activate
cd /home/CPANEL_USER/dealerbase-backend
npm install
```

Apply only reviewed database migrations. Never re-import the full schema over a live production database. Restart the cPanel Node application and test a real endpoint.

## 20. Future Frontend/Admin Updates

For each update:

1. Update source locally.
2. Confirm the production API URL.
3. Run tests and TypeScript checks.
4. Run `npm run build` locally.
5. Archive only `out` contents using `tar.exe -a`.
6. Back up the existing cPanel document root.
7. Replace and extract files into the correct root.
8. Verify `_next/static` and permissions.
9. Test in an incognito window.

A static frontend or admin update does not require a Node.js application restart.

## 21. Backup and Rollback

Before deployment, back up:

- Production database
- Backend `.env`
- Uploads
- Main frontend document root
- Admin document root

Database backup:

```bash
mysqldump -u CPANEL_USER_dealerbase_app -p CPANEL_USER_dealerbase_prod > /home/CPANEL_USER/dealerbase-backup-YYYY-MM-DD.sql
```

For rollback, restore the previous frontend/admin ZIP and backend release while preserving the current `.env` and uploads. Restore the database only when a migration damaged production data.

## 22. Common Problems

### `node` or `npm` not found

```bash
source /home/CPANEL_USER/nodevenv/dealerbase-backend/22/bin/activate
```

### Database access denied

Check the exact cPanel-prefixed database name, username, password, user assignment, and privileges.

### `CREATE DATABASE` access denied

Create the database through cPanel and remove `CREATE DATABASE` and `USE` statements from the production schema.

### Foreign key incorrectly formed

Match both columns' SQL type, length, and signed/unsigned configuration exactly.

### `_next/static` JavaScript files return 404

Confirm the ZIP uses forward-slash paths, `_next` is directly inside the document root, directories are `755`, files are `644`, and HTML/assets came from the same build.

### Route refresh returns 404

Use `output: "export"` and `trailingSlash: true`, rebuild, and upload the new `out` contents. Avoid unnecessary `.htaccess` rewrites.

### Backend root says `Route not found`

Test an actual endpoint under `/api`. The backend does not need a root route.

### Next.js build fails on cPanel

Build locally. Shared hosting often limits worker threads and memory.

## Final Rule

Build and test locally, keep secrets outside Git, back up production data, deploy only generated artifacts, preserve uploads and `.env`, and verify frontend, admin, API, database, authentication, SSL, and integrations after every release.
