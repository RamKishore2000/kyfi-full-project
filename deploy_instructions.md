# KYFI cPanel Deployment Instructions

This project is deployed on cPanel with:

- Dealer frontend: `https://kyfi.in`
- Admin frontend: `https://admin.kyfi.in`
- Backend API: `https://api.kyfi.in/api`

## 1. Backend API Deployment

Backend cPanel Node.js app:

- App URL: `api.kyfi.in`
- App root: `/home/kyfi/kyfi-backend`
- Startup file: `server.js`
- Node version: `22.22.2`
- Mode: `production`

### Update Backend Code

Run in cPanel Terminal:

```bash
cd /home/kyfi/kyfi-full-project
git pull origin main
```

Copy backend code into the cPanel Node app folder:

```bash
rsync -av --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude uploads \
  /home/kyfi/kyfi-full-project/kyfi-backend/ /home/kyfi/kyfi-backend/
```

If backend dependencies changed, run:

```bash
cd /home/kyfi/kyfi-backend
source /home/kyfi/nodevenv/kyfi-backend/22/bin/activate
npm install
```

Restart backend from cPanel:

```text
cPanel -> Node.js -> api.kyfi.in -> Restart
```

Test backend:

```text
https://api.kyfi.in/api/districts/search?q=west
```

## 2. Backend Database Setup

Database:

- DB name: `kyfi_prod`
- DB user: `kyfi_app`
- DB host: `localhost`

Backend environment file:

```text
/home/kyfi/kyfi-backend/.env
```

Required values:

```env
PORT=4000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=kyfi_app
DB_PASSWORD=your_database_password
DB_NAME=kyfi_prod
JWT_SECRET=your_long_jwt_secret
ADMIN_PASSWORD=your_admin_password
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Import schema only when creating a fresh database:

```bash
cd /home/kyfi/kyfi-backend
tail -n +4 database/schema.sql | mysql -u kyfi_app -p kyfi_prod
```

Import LGD district/mandal/village data:

```bash
cd /home/kyfi/kyfi-backend
source /home/kyfi/nodevenv/kyfi-backend/22/bin/activate
npm run import:lgd-locations
```

Verify LGD import:

```bash
mysql -u kyfi_app -p kyfi_prod -e "SELECT COUNT(*) AS districts FROM districts; SELECT COUNT(*) AS mandals FROM mandals; SELECT COUNT(*) AS villages FROM villages;"
```

## 3. Dealer Frontend Deployment

Dealer frontend is a static Next.js export.

Local folder:

```text
New folder (2)
```

Build locally:

```powershell
cd "D:\kyfi-full-project\New folder (2)"
$env:NEXT_PUBLIC_KYFI_API_BASE_URL="https://api.kyfi.in/api"
$env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
$env:NEXT_TELEMETRY_DISABLED="1"
npm run build
```

Create upload zip locally:

```powershell
cd "D:\kyfi-full-project"
Compress-Archive -Path "New folder (2)\out\*" -DestinationPath "deploy-artifacts\kyfi-dealer-static.zip" -Force
```

Upload in cPanel File Manager:

```text
Upload: deploy-artifacts/kyfi-dealer-static.zip
Extract to: /home/kyfi/public_html
```

Fix permissions:

```bash
chmod -R u+rwX,go+rX /home/kyfi/public_html
find /home/kyfi/public_html -type d -exec chmod 755 {} \;
find /home/kyfi/public_html -type f -exec chmod 644 {} \;
```

Test:

```text
https://kyfi.in/
https://kyfi.in/login/
https://kyfi.in/dashboard/
```

## 4. Admin Frontend Deployment

Admin frontend is also a static Next.js export.

Local folder:

```text
kyfi-admin
```

Build locally:

```powershell
cd "D:\kyfi-full-project\kyfi-admin"
$env:NEXT_PUBLIC_KYFI_API_BASE_URL="https://api.kyfi.in/api"
$env:NEXT_TELEMETRY_DISABLED="1"
npx next build
```

Create upload zip locally:

```powershell
cd "D:\kyfi-full-project"
Compress-Archive -Path "kyfi-admin\out\*" -DestinationPath "deploy-artifacts\kyfi-admin-static.zip" -Force
```

Upload in cPanel File Manager:

```text
Upload: deploy-artifacts/kyfi-admin-static.zip
Extract to: /home/kyfi/admin.kyfi.in
```

Fix permissions:

```bash
chmod -R u+rwX,go+rX /home/kyfi/admin.kyfi.in
find /home/kyfi/admin.kyfi.in -type d -exec chmod 755 {} \;
find /home/kyfi/admin.kyfi.in -type f -exec chmod 644 {} \;
```

Test:

```text
https://admin.kyfi.in/
https://admin.kyfi.in/login/
https://admin.kyfi.in/dashboard/
```

## 5. Important Notes

- Do not build Next.js frontend/admin on cPanel. Shared hosting blocks worker threads.
- Build frontend/admin locally, zip the `out` folder, then upload to cPanel.
- Do not overwrite backend `.env` during backend deployment.
- Do not delete backend `uploads` folder during backend deployment.
- Dealer and admin frontends use `trailingSlash: true`, so route refresh works without `.htaccess`.
- Backend source lives in `/home/kyfi/kyfi-backend`, not `/home/kyfi/api.kyfi.in`.

