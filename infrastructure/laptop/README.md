# ehans on the Ubuntu laptop (ehans.qualixe.com)

ehans runs on the same laptop as eDealer, clothy and glowy, in its own Docker stack (`ehans`),
and does not touch the others.

| Part                          | Where                                                                      |
| ----------------------------- | -------------------------------------------------------------------------- |
| Entry point (nginx, non-root) | container `ehans-proxy-1`, listens on `127.0.0.1:8086` only                |
| Storefront + admin (Next.js)  | container `ehans-frontend-1` (no host port)                                |
| API (NestJS)                  | container `ehans-backend-1` (no host port), reached at `/api/v1`           |
| Database (PostgreSQL 17)      | container `ehans-postgres-1`, volume `ehans_postgres_data`, no port at all |
| Code                          | `~/ehans` (the previous version is kept in `~/ehans-prev`)                 |
| Settings                      | `~/ehans/.env` (written by the first deploy, random database password)     |
| Uploaded images (admin)       | volume `ehans_uploads` (kept across deploys)                               |
| Backups                       | `~/backups/ehans_<date>.dump`, made before every deploy (latest 30 kept)   |

Ports already in use on the laptop: clothy `8081`, glowy `8082`, kiddo `8083`, voltix `8084`, qchat
`8085` (and eDealer `80`). The deploy stops
if `8086` is taken by something else.

## One-time setup on the laptop

The site is reached only through the existing Cloudflare tunnel. Add a hostname to it.

**If the tunnel is managed from the Cloudflare dashboard** (Zero Trust → Networks → Tunnels → your
tunnel → Public Hostname → Add): subdomain `ehans`, domain `qualixe.com`, type `HTTP`,
URL `localhost:8086`.

**If the tunnel uses a config file** (`/etc/cloudflared/config.yml`), add this under `ingress:`,
**above** the final `- service: http_status:404` line:

```yaml
- hostname: ehans.qualixe.com
  service: http://localhost:8086
```

Then:

```bash
cloudflared tunnel list                                  # note the tunnel name
cloudflared tunnel route dns <tunnel-name> ehans.qualixe.com
sudo systemctl restart cloudflared
```

## Deploy (from this PC)

```powershell
cd C:\Users\hrido\Desktop\ehans-node
.\infrastructure\laptop\deploy-laptop.ps1
```

- **First deploy:** writes the laptop's `.env` (site address, random database password), builds,
  migrates and loads the demo catalog (33 collections, 46 products).
- **Every later deploy:** the `.env` and the data are kept. The database is backed up first, the new
  images are built before anything stops, then migrations run and the containers restart.

Then create the admin owner once (the password is typed on the laptop's prompt, never stored):

```powershell
.\infrastructure\laptop\create-admin-laptop.ps1 -Email you@example.com -Name "Your name"
```

Sign in at <https://ehans.qualixe.com/admin>.

## Useful commands on the laptop

```bash
cd ~/ehans
alias ec='docker compose -f docker-compose.yml -f infrastructure/laptop/compose.laptop.yaml'
ec ps
ec logs -f backend                      # or: frontend, proxy, postgres
nano .env && ec up -d                   # change settings (NEXT_PUBLIC_* need: ec build frontend)
```

Roll back to the previous code:

```bash
cd ~ && rm -rf ehans && mv ehans-prev ehans && cd ehans && \
  docker compose -f docker-compose.yml -f infrastructure/laptop/compose.laptop.yaml up -d --build
```

Restore a database backup (replaces the current data):

```bash
cd ~/ehans && ec stop backend frontend proxy
ec exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < ~/backups/ehans_<date>.dump
ec up -d
```

## Not wired yet

Checkout, orders and payments are the next admin slice: until then the storefront's order forms
validate and say ordering is "launching soon", and the admin dashboard shows zeros.
