# Deployment (Ubuntu 24.04 LTS VPS)

Target: one VPS running Docker Compose (PostgreSQL, backend, frontend) behind **host** Nginx
with Let's Encrypt certificates. Containers publish ports on `127.0.0.1` only. PostgreSQL
publishes nothing.

> **Running it on the office Ubuntu laptop instead** (next to eDealer, clothy and glowy, published
> through the Cloudflare tunnel as `ehans.qualixe.com`): use the kit in
> [`infrastructure/laptop/`](../infrastructure/laptop/README.md). Same images and stack, plus one
> nginx container as the entry point on `127.0.0.1:8086`; no host Nginx or certificates needed.

> `example.com` / `api.example.com` are placeholders. Replace them with your real domains in
> `.env` and the Nginx site files. This guide never assumes a specific IP or credentials.

## 1. Server preparation (once)

```bash
# As root or a sudo user
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw nginx certbot unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Non-root deploy user
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
# Copy your SSH public key to /home/deploy/.ssh/authorized_keys, then harden SSH in
# /etc/ssh/sshd_config.d/hardening.conf:
#   PasswordAuthentication no
#   PermitRootLogin no
systemctl reload ssh

# Firewall: only SSH + HTTP(S). Never open 3000, 4000 or 5432.
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

**Docker Engine and Compose plugin** (official repository):

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker deploy
```

> **Docker and UFW:** Docker-published ports bypass UFW rules. That's why every port in
> `docker-compose.yml` is bound to `127.0.0.1`. Never change a binding to `0.0.0.0`.

## 2. Get the code and configure secrets

```bash
sudo mkdir -p /opt/ehans && sudo chown deploy:deploy /opt/ehans
sudo -iu deploy
git clone <your-repo-url> /opt/ehans && cd /opt/ehans
chmod +x infrastructure/scripts/*.sh

cp .env.example .env
chmod 600 .env
openssl rand -hex 32          # paste as POSTGRES_PASSWORD
nano .env                     # set domains, CORS_ORIGINS, NEXT_PUBLIC_* etc.
```

### Production environment variables (`/opt/ehans/.env`)

| Variable                | Required | Example / default                             | Notes                                                                                    |
| ----------------------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `APP_VERSION`           | no       | `0.1.0` or git SHA                            | Image tag and `/health` version                                                          |
| `POSTGRES_USER`         | **yes**  | `ehans`                                       |                                                                                          |
| `POSTGRES_PASSWORD`     | **yes**  | `openssl rand -hex 32`                        | Hex keeps `DATABASE_URL` URL-safe. Setting it only takes effect on **first** volume init |
| `POSTGRES_DB`           | **yes**  | `ehans`                                       |                                                                                          |
| `CORS_ORIGINS`          | **yes**  | `https://example.com,https://www.example.com` | Exact origins, comma-separated, no trailing slash                                        |
| `TRUST_PROXY`           | no       | `1`                                           | Number of proxies in front of the backend (host Nginx)                                   |
| `COOKIE_DOMAIN`         | no       | empty or `.example.com`                       | For future auth cookies                                                                  |
| `SWAGGER_ENABLED`       | no       | `false`                                       | Only enable behind access control                                                        |
| `LOG_LEVEL`             | no       | `log`                                         | `fatal`, `error`, `warn`, `log`, `debug`, `verbose`                                      |
| `NEXT_PUBLIC_API_URL`   | **yes**  | `https://api.example.com/api/v1`              | **Public**, baked in at build time. Rebuild the frontend after changing it               |
| `NEXT_PUBLIC_SITE_URL`  | **yes**  | `https://example.com`                         | **Public**, baked in at build time                                                       |
| `BACKEND_HOST_PORT`     | no       | `4000`                                        | Bound to 127.0.0.1. Must match the Nginx upstream                                        |
| `FRONTEND_HOST_PORT`    | no       | `3000`                                        | Bound to 127.0.0.1. Must match the Nginx upstream                                        |
| `BACKUP_DIR`            | no       | `./backups`                                   | Used by backup/restore scripts                                                           |
| `BACKUP_RETENTION_DAYS` | no       | `14`                                          | `0` disables pruning                                                                     |

Set by Compose (not in `.env`): `DATABASE_URL` (built from the `POSTGRES_*` values),
`NODE_ENV=production`, `LOG_FORMAT=json`, `API_INTERNAL_URL=http://backend:4000/api/v1`,
`UPLOADS_DIR=/app/uploads` (admin image uploads, kept in the `uploads` volume: the backend's
only writable path).

Secrets live **only** in this file on the server. They're injected as container environment
variables at runtime. Nothing secret is passed as a build arg or copied into an image
(`.dockerignore` excludes all `.env*` files).

## 3. First deploy

```bash
cd /opt/ehans
./infrastructure/scripts/deploy.sh --no-backup     # first run: nothing to back up yet
```

`deploy.sh` validates the config, builds all images, starts Postgres, backs up, runs
`prisma migrate deploy`, starts backend and frontend, and waits for their health checks.

Verify locally on the server:

```bash
curl -fsS http://127.0.0.1:4000/api/v1/health/ready
curl -fsS http://127.0.0.1:3000/api/health
docker compose ps
```

Create the store owner account for the admin at `/admin` (once; run it again to reset the
owner's password, which also signs out every session of that account). The password is asked
for on the terminal, so it never lands in shell history or a file:

```bash
docker compose run --rm -it -e ADMIN_EMAIL=owner@example.com -e ADMIN_NAME="Store owner" \
  backend node dist/database/create-admin.js
```

Staff accounts and their section permissions are managed by the owner in the admin
(Settings → Staff & permissions, ported in a later slice).

## 4. Nginx and HTTPS (Let's Encrypt and Certbot)

DNS first: create `A` (and `AAAA` if you have IPv6) records for `example.com`,
`www.example.com` and `api.example.com` pointing to the VPS, and wait until they resolve.

```bash
cd /opt/ehans/infrastructure/nginx
sudo mkdir -p /var/www/certbot
sudo cp conf.d/ehans-http.conf /etc/nginx/conf.d/
sudo cp snippets/ehans-*.conf /etc/nginx/snippets/
sudo cp sites-available/*.conf /etc/nginx/sites-available/
# Replace placeholder domains (edit the domain names to yours):
sudo sed -i 's/api\.example\.com/api.YOURDOMAIN.TLD/g; s/example\.com/YOURDOMAIN.TLD/g' \
  /etc/nginx/sites-available/{00-acme-bootstrap,example.com,api.example.com}.conf

# Step 1: HTTP-only bootstrap config to pass the ACME challenge
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/00-acme-bootstrap.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Step 2: issue certificates (webroot; certbot never edits the Nginx files)
sudo certbot certonly --webroot -w /var/www/certbot \
  -d YOURDOMAIN.TLD -d www.YOURDOMAIN.TLD --email you@YOURDOMAIN.TLD --agree-tos --no-eff-email
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.YOURDOMAIN.TLD --email you@YOURDOMAIN.TLD --agree-tos --no-eff-email

# Step 3: switch to the real HTTPS sites
sudo rm /etc/nginx/sites-enabled/00-acme-bootstrap.conf
sudo ln -s /etc/nginx/sites-available/example.com.conf     /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.example.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The cert directory names under `/etc/letsencrypt/live/` are the first `-d` value of each command.
Make sure they match the `ssl_certificate` paths in the site files.

**Renewal:** the certbot package installs a systemd timer. Reload Nginx after each renewal:

```bash
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

Once HTTPS is confirmed on all hosts, you can raise HSTS in `snippets/ehans-ssl.conf` to
`max-age=63072000` (and consider `includeSubDomains` only if **every** subdomain serves HTTPS).

Check from outside: `curl -I https://example.com` and `curl https://api.example.com/api/v1/health`.

## 5. Routine deploys

```bash
cd /opt/ehans
git pull --ff-only
./infrastructure/scripts/deploy.sh          # backup → build → migrate → restart → health check
```

**Rollback (code):** `git checkout <previous-tag>` and re-run `deploy.sh`. Migrations are not
rolled back automatically. Write backward-compatible migrations (expand/contract, see
[database-design.md](database-design.md)) so the previous code still works against the newer schema.
If a migration must be undone, restore the pre-deploy backup.

## 6. Backups and restore

```bash
./infrastructure/scripts/backup-db.sh                    # → backups/<db>_<UTC>.dump (+ .sha256)
ls -lh backups/
```

- `pg_dump --format=custom` of the running database (online, consistent). The script verifies
  the archive with `pg_restore --list`, writes a SHA-256 checksum, sets mode 600, and prunes
  backups older than `BACKUP_RETENTION_DAYS` (only files matching its own naming pattern).
- **Schedule it** (crontab of `deploy`):
  `15 3 * * * cd /opt/ehans && ./infrastructure/scripts/backup-db.sh >> /home/deploy/ehans-backup.log 2>&1`
- **Uploaded images** (products, categories added in the admin) live in the `ehans_uploads`
  volume, not in the database dump. Back them up too, e.g.
  `docker run --rm -v ehans_uploads:/u:ro -v "$PWD/backups":/b alpine tar czf /b/uploads_$(date +%F).tgz -C /u .`
- **Ship backups off the server** (S3-compatible storage, another host). Encrypt them at rest
  (e.g. `age` or `gpg`) because they contain customer data.

**Restore rehearsal (recommended monthly). Production data is untouched:**

```bash
./infrastructure/scripts/restore-db.sh backups/ehans_20260101T031500Z.dump --target-db ehans_restore_test
docker compose exec postgres psql -U ehans -d ehans_restore_test -c '\dt'
docker compose exec postgres dropdb -U ehans ehans_restore_test
```

**Real restore (destructive):**

```bash
./infrastructure/scripts/restore-db.sh backups/ehans_20260101T031500Z.dump
```

It verifies checksum and archive, asks you to type the database name, takes a safety backup,
stops backend and frontend, restores in a single transaction (all or nothing), and restarts the apps.

## 7. Operations cheat sheet

| Task                  | Command                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| Status                | `docker compose ps`                                                       |
| Logs (JSON)           | `docker compose logs -f --tail 100 backend`                               |
| Restart a service     | `docker compose restart backend`                                          |
| Migration status      | `./infrastructure/scripts/migrate.sh status`                              |
| DB shell              | `docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"` |
| Disk usage            | `docker system df`                                                        |
| Clean old images      | `docker image prune -f`                                                   |
| Update Postgres minor | `docker compose pull postgres && docker compose up -d postgres`           |

## Security checklist

- [ ] `.env` is mode 600, not in Git, and has no `CHANGE_ME` values
- [ ] `ufw status` shows only OpenSSH and Nginx Full
- [ ] `ss -tlnp` shows 3000/4000 on `127.0.0.1` only and nothing on 5432
- [ ] SSH: key-only, no root login
- [ ] HTTPS works on all hosts, HTTP redirects, `certbot renew --dry-run` passes
- [ ] `SWAGGER_ENABLED=false` (or protected)
- [ ] Daily backups run, are copied off-site, and a restore rehearsal has been done
- [ ] `unattended-upgrades` enabled
