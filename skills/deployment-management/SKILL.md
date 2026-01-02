---
name: deployment-management
description: >
  Deploy and manage Thomas's infrastructure: Rust APIs on VPS via systemd, Next.js frontends on Vercel,
  and Supabase database.
  Trigger terms: deploy, deployment, server, vps, systemd, nginx, vercel, supabase, production,
  ssh, rsync, restart, redeploy, backend, frontend, api, service.
---

## When to Use
- Deploying or redeploying a backend API (Rust Axum services)
- Deploying frontend changes (Vercel auto-deploys from `main`)
- Checking service health or logs on production servers
- Brainstorming deployment strategy for a new project
- Troubleshooting production issues

## When NOT to Use
- Local development only (no production changes)
- Database schema changes (use Supabase dashboard or migrations)
- Minecraft plugin deployment (use **minecraft-control** skill instead)

## Quick Reference

### SSH Access (Main Server)
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60
```

### Check Service Status
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl status <service-name>"
```

### Restart Service
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl restart <service-name>"
```

### View Logs
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "journalctl -u <service-name> -f"
```

---

## Infrastructure Overview

### Main Dedicated Server (`95.216.244.60`)

| Property | Value |
|----------|-------|
| **Provider** | Hetzner |
| **SSH** | `ssh -i ~/.ssh/cursor root@95.216.244.60` |
| **Role** | Production APIs + Minecraft test server |

**Running Services:**

| Service | Port | Systemd Unit | Health Check |
|---------|------|--------------|--------------|
| AsyncAnticheat API | 3002 | `asyncanticheat-api.service` | `curl localhost:3002/health` |
| Movement Core Module | 4030 | `async-anticheat-movement-core.service` | `curl localhost:4030/health` |
| Movement Advanced | 4031 | `async-anticheat-movement-advanced.service` | `curl localhost:4031/health` |
| Combat Core Module | 4032 | `async-anticheat-combat-core.service` | `curl localhost:4032/health` |
| Combat Advanced | 4033 | `async-anticheat-combat-advanced.service` | `curl localhost:4033/health` |
| Player Core Module | 4034 | `async-anticheat-player-core.service` | `curl localhost:4034/health` |
| Player Advanced | 4035 | `async-anticheat-player-advanced.service` | `curl localhost:4035/health` |
| MCServerJars API | 3001 | `mcserverjars-api.service` | `curl localhost:3001/health` |
| Custom Capes API | 3000 | `customcapes-api.service` | `curl localhost:3000/health` |
| Minecraft Test Server | 25565 | `minecraft-test.service` | — |

### Frontend Deployments (Vercel)

All frontends auto-deploy when pushing to `main` branch.

| Project | Domain | Repository Path |
|---------|--------|-----------------|
| thomas.md | `thomas.md` | `thomas.md/` |
| Oraxen Website | `oraxen.com` | `oraxen/oraxen.com/` |
| Oraxen Docs | `docs.oraxen.com` | `oraxen/docs.oraxen.com/` |
| Oraxen Studio | `studio.oraxen.com` | `oraxen/studio.oraxen.com/` |
| HackedServer | `hackedserver.org` | `hackedserver/hackedserver.org/` |
| AsyncAnticheat | `asyncanticheat.com` | `asyncanticheat/asyncanticheat.com/` |
| MCServerJars | `mcserverjars.com` | `mcserverjars.com/` |
| SkinMotion Dashboard | `skin.thomas.md` | `skinmotion/dashboard/` |
| Open Agent Dashboard | `agent.thomas.md` | `open_agent/dashboard/` |

### Database (Supabase)

Single shared Supabase instance for all projects.

| Property | Value |
|----------|-------|
| **URL** | `https://dmtwdyasmifhjsxmqslv.supabase.co` |
| **Region** | EU (Frankfurt) |

See `references/supabase-database.md` for schema details and retrieval script.

---

## Deployment Patterns

### Backend APIs (Rust)

Standard deployment flow for Rust Axum services:

```bash
# 1. Sync source to server
rsync -avz --exclude 'target' --exclude '.git' -e "ssh -i ~/.ssh/cursor" \
  ./src/ root@95.216.244.60:/opt/<service>/src/

# 2. Build on server
ssh -i ~/.ssh/cursor root@95.216.244.60 "cd /opt/<service> && source ~/.cargo/env && cargo build --release"

# 3. Restart service
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl restart <service-name>"

# 4. Verify health
ssh -i ~/.ssh/cursor root@95.216.244.60 "curl -sf localhost:<port>/health && echo OK"
```

**Service locations on server:**
- AsyncAnticheat API: `/opt/async_anticheat_api/`
- MCServerJars API: `/opt/mcserverjars_api/`
- Detection modules: `/opt/async_anticheat_api/modules_src/<module>/`

### Frontends (Next.js on Vercel)

Frontends deploy automatically when pushing to `main`:

```bash
# Just push to main
git add . && git commit -m "feat: description" && git push origin main
```

Environment variables are configured in Vercel dashboard. Common vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

### Minecraft Plugins

For Minecraft plugin deployment, use the **minecraft-control** skill which covers:
- Plugin builds (Gradle)
- Test server deployment (`demo.oraxen.com`)
- MCServerJars API for version management
- Server commands via mcwrap

### MCServerJars Indexers

Bun scripts that sync JAR metadata to Supabase. Typically run via GitHub Actions:

```bash
cd mcserverjars.com/indexers
bun install
bun run index-paper  # or other indexer
```

Required env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (for changelogs).

---

## New Project Deployment Checklist

When deploying a new service, follow this pattern:

### Backend (Rust API)
1. **Provision directory**: `/opt/<service>/`
2. **Create systemd unit**: `/etc/systemd/system/<service>.service`
3. **Configure nginx** (if HTTP): reverse proxy to localhost port
4. **Set up SSL**: `certbot --nginx -d <domain>`
5. **Create `.env`**: copy from secrets.json template
6. **Enable service**: `systemctl enable --now <service>`
7. **Add health check**: ensure `/health` endpoint exists

### Frontend (Next.js)
1. **Connect repo to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Configure domain** in Vercel + DNS
4. **Push to main** to trigger deploy

### Systemd Unit Template

```ini
[Unit]
Description=<Service Description>
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/<service>
EnvironmentFile=/opt/<service>/.env
ExecStart=/opt/<service>/target/release/<binary>
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Nginx Reverse Proxy Template

```nginx
server {
    server_name <domain>;

    location / {
        proxy_pass http://127.0.0.1:<port>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
journalctl -u <service> -n 100

# Check config
cat /opt/<service>/.env

# Check binary exists
ls -la /opt/<service>/target/release/
```

### Port Already in Use
```bash
lsof -i :<port>
kill <PID>
```

### Database Connection Failed
1. Verify `DATABASE_URL` in `.env`
2. Check Supabase dashboard for connection limits
3. Try direct connection: `psql "$DATABASE_URL"`

### Health Check Failing
```bash
# Test locally on server
curl -v localhost:<port>/health

# Check if service is listening
ss -tlnp | grep <port>
```

---

## Checks & Guardrails

Before deploying:
- [ ] Changes tested locally
- [ ] No secrets hardcoded in code
- [ ] Health endpoint exists and returns 200
- [ ] Environment variables documented

After deploying:
- [ ] Health check passes
- [ ] Logs show no errors
- [ ] Functionality verified manually

**Never:**
- Push secrets to git
- Run `systemctl restart` without checking health after
- Deploy to production without testing locally first
- Modify systemd units without `systemctl daemon-reload`

---

## References

- `references/infrastructure-overview.md` - Full server and service details
- `references/supabase-database.md` - Database schema and retrieval script
- `references/deployment-patterns.md` - Detailed deployment procedures
- `references/open-agent-server.md` - Open Agent (separate VPS at 95.216.112.253)

## Related Skills

- **minecraft-control** - Minecraft plugin deployment, test server, MCServerJars API
