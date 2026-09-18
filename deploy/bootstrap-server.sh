#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root: sudo bash deploy/bootstrap-server.sh" >&2
  exit 1
fi

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_ROOT="/var/www/yuyirrr"
SITE_CONFIG="/etc/nginx/sites-available/yuyirrr.com"

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx rsync

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
fi

install -d -o "${DEPLOY_USER}" -g www-data -m 0755 "${APP_ROOT}" "${APP_ROOT}/releases"
install -d -o www-data -g www-data -m 0755 /var/www/letsencrypt

cp deploy/nginx/yuyirrr.com.http.conf "${SITE_CONFIG}"
ln -sfn "${SITE_CONFIG}" /etc/nginx/sites-enabled/yuyirrr.com
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable --now nginx
systemctl reload nginx

echo "Bootstrap complete. Point DNS to this server, then run:"
echo "certbot --nginx -d yuyirrr.com -d www.yuyirrr.com"
echo "After the certificate exists, copy deploy/nginx/yuyirrr.com.https.conf to ${SITE_CONFIG} and reload nginx."
echo "Add the deploy user's public key to /home/${DEPLOY_USER}/.ssh/authorized_keys before enabling GitHub Actions."
