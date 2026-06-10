#!/usr/bin/env bash
set -euo pipefail

# KYFI deployment script.
# Usage:
#   ./deploy.sh
#   ./deploy.sh --setup-nginx
#
# Requirements on server:
#   git, node, npm, pm2
# Optional for reverse proxy:
#   nginx with sudo access

SSH_USER="${SSH_USER:-kyfi}"
SSH_HOST="${SSH_HOST:-160.30.208.12}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"

REPO_URL="${REPO_URL:-https://github.com/RamKishore2000/kyfi-full-project.git}"
APP_DIR="${APP_DIR:-/home/kyfi/apps/kyfi-full-project}"

DEALER_DOMAIN="${DEALER_DOMAIN:-kyfi.in}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.kyfi.in}"
API_DOMAIN="${API_DOMAIN:-api.kyfi.in}"

DEALER_PORT="${DEALER_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3005}"
API_PORT="${API_PORT:-4000}"

SETUP_NGINX="false"
if [[ "${1:-}" == "--setup-nginx" ]]; then
  SETUP_NGINX="true"
fi

SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new)
if [[ -n "$SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

run_remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "$@"
}

echo "Deploying KYFI to $SSH_USER@$SSH_HOST..."

run_remote bash -s <<EOF
set -euo pipefail

APP_DIR="$APP_DIR"
REPO_URL="$REPO_URL"
DEALER_PORT="$DEALER_PORT"
ADMIN_PORT="$ADMIN_PORT"
API_PORT="$API_PORT"
API_DOMAIN="$API_DOMAIN"
SETUP_NGINX="$SETUP_NGINX"
DEALER_DOMAIN="$DEALER_DOMAIN"
ADMIN_DOMAIN="$ADMIN_DOMAIN"

command -v git >/dev/null 2>&1 || { echo "git is required on server"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node is required on server"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required on server"; exit 1; }

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing pm2..."
  npm install -g pm2
fi

mkdir -p "\$(dirname "\$APP_DIR")"

if [[ ! -d "\$APP_DIR/.git" ]]; then
  git clone "\$REPO_URL" "\$APP_DIR"
else
  cd "\$APP_DIR"
  git fetch origin main
  git reset --hard origin/main
fi

cd "\$APP_DIR"

cat > ecosystem.config.cjs <<'PM2_EOF'
module.exports = {
  apps: [
    {
      name: "kyfi-api",
      cwd: "./kyfi-backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.API_PORT || 4000,
      },
    },
    {
      name: "kyfi-dealer",
      cwd: "./New folder (2)",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p " + (process.env.DEALER_PORT || 3000),
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "kyfi-admin",
      cwd: "./kyfi-admin",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p " + (process.env.ADMIN_PORT || 3005),
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
PM2_EOF

cat > "New folder (2)/.env.production" <<DEALER_ENV
NEXT_PUBLIC_KYFI_API_BASE_URL=https://$API_DOMAIN/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
DEALER_ENV

cat > "kyfi-admin/.env.production" <<ADMIN_ENV
NEXT_PUBLIC_KYFI_API_BASE_URL=https://$API_DOMAIN/api
ADMIN_ENV

if [[ ! -f "kyfi-backend/.env" ]]; then
  cat > "kyfi-backend/.env" <<BACKEND_ENV
PORT=$API_PORT
NODE_ENV=production
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=CHANGE_ME
DB_PASSWORD=CHANGE_ME
DB_NAME=kyfi
JWT_SECRET=CHANGE_ME_LONG_RANDOM_SECRET
ADMIN_PASSWORD=CHANGE_ME
RAZORPAY_KEY_ID=CHANGE_ME
RAZORPAY_KEY_SECRET=CHANGE_ME
BACKEND_ENV
  echo "Created kyfi-backend/.env placeholder. Update DB/JWT/Razorpay values on server, then rerun deploy."
  exit 1
fi

install_deps() {
  local dir="\$1"
  cd "\$APP_DIR/\$dir"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
}

install_deps "kyfi-backend"
install_deps "New folder (2)"
install_deps "kyfi-admin"

cd "\$APP_DIR/New folder (2)"
npm run build

cd "\$APP_DIR/kyfi-admin"
npx next build

cd "\$APP_DIR/kyfi-backend"
node -c server.js

cd "\$APP_DIR"
DEALER_PORT="\$DEALER_PORT" ADMIN_PORT="\$ADMIN_PORT" API_PORT="\$API_PORT" pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

if [[ "\$SETUP_NGINX" == "true" ]]; then
  command -v nginx >/dev/null 2>&1 || { echo "nginx is required for --setup-nginx"; exit 1; }
  command -v sudo >/dev/null 2>&1 || { echo "sudo is required for --setup-nginx"; exit 1; }

  sudo tee /etc/nginx/sites-available/kyfi.conf >/dev/null <<NGINX_EOF
server {
  listen 80;
  server_name $DEALER_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$DEALER_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  listen 80;
  server_name $ADMIN_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$ADMIN_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

server {
  listen 80;
  server_name $API_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$API_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX_EOF

  sudo ln -sf /etc/nginx/sites-available/kyfi.conf /etc/nginx/sites-enabled/kyfi.conf
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "Deployment finished."
echo "Dealer frontend: https://$DEALER_DOMAIN"
echo "Admin frontend:  https://$ADMIN_DOMAIN"
echo "Backend API:     https://$API_DOMAIN/api"
EOF

