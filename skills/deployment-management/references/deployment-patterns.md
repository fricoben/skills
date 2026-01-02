# Deployment Patterns

Detailed procedures for deploying different types of services.

---

## Backend APIs (Rust Axum)

All backend APIs follow the same pattern: Rust Axum services running via systemd.

### Prerequisites
- SSH access via `~/.ssh/cursor`
- Rust toolchain installed on server (`~/.cargo/env`)
- Systemd unit configured

### Full Deployment Flow

```bash
# 1. Build locally to verify (optional)
cargo build --release

# 2. Sync source to server (exclude target/ for speed)
rsync -avz --exclude 'target' --exclude '.git' -e "ssh -i ~/.ssh/cursor" \
  ./ root@95.216.244.60:/opt/<service>/

# 3. Build on server
ssh -i ~/.ssh/cursor root@95.216.244.60 << 'EOF'
cd /opt/<service>
source ~/.cargo/env
cargo build --release
EOF

# 4. Restart service
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl restart <service>.service"

# 5. Verify health
ssh -i ~/.ssh/cursor root@95.216.244.60 "sleep 2 && curl -sf localhost:<port>/health && echo ' OK'"
```

### AsyncAnticheat Deploy Scripts

AsyncAnticheat has dedicated deploy scripts at `asyncanticheat/api.asyncanticheat.com/scripts/`:

```bash
# Python script (full-featured)
./scripts/deploy.py                        # Deploy everything
./scripts/deploy.py api                    # Deploy only API
./scripts/deploy.py modules                # Deploy all modules
./scripts/deploy.py modules movement_core  # Deploy specific module
./scripts/deploy.py status                 # Check health of all services
./scripts/deploy.py logs api               # Tail API logs

# Bash script (simpler)
./scripts/deploy-quick.sh                  # Deploy everything
./scripts/deploy-quick.sh status           # Check health
```

### Environment Variables

Each service has a `.env` file on the server:

```bash
# Check current env
ssh -i ~/.ssh/cursor root@95.216.244.60 "cat /opt/<service>/.env"

# Edit env
ssh -i ~/.ssh/cursor root@95.216.244.60 "nano /opt/<service>/.env"

# Restart after env changes
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl restart <service>.service"
```

---

## Frontends (Next.js on Vercel)

Frontends auto-deploy when pushing to `main` branch.

### Deployment Flow

```bash
# 1. Make changes locally
# 2. Test build
bun install && bun run build

# 3. Commit and push
git add .
git commit -m "feat: description"
git push origin main

# Vercel automatically deploys
```

### Preview Deployments

Push to any branch other than `main` for preview deployments:

```bash
git checkout -b feature/my-feature
git push origin feature/my-feature
# Vercel creates preview URL
```

### Environment Variables

Set in Vercel dashboard. Common patterns:

**Public (client-side):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Secret (server-side only):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `DISCORD_BOT_TOKEN`

### Vercel Workflows

thomas.md uses Vercel Workflow SDK for durable tasks:

- 7-day follow-up emails
- Automatic Oraxen Studio grants

Code at: `thomas.md/app/workflows/`

---

## Minecraft Plugins

For Minecraft plugin deployment, see the **minecraft-control** skill:
- `minecraft-control/references/test-server-deployment.md`

Covers: Gradle builds, test server deployment, MCServerJars API, mcwrap commands.

---

## MCServerJars Indexers

Bun scripts that sync JAR metadata to Supabase.

### Manual Run

```bash
cd mcserverjars.com/indexers
bun install
bun run index-paper
bun run index-spigot
# etc.
```

### Environment Variables

```bash
SUPABASE_URL=https://dmtwdyasmifhjsxmqslv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...  # For changelog generation
```

### Scheduling

Typically run via GitHub Actions on a schedule:

```yaml
# .github/workflows/sync-jars.yml
name: Sync JAR Builds
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd indexers && bun install && bun run index-paper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## New Service Checklist

### Backend (Rust API)

1. **Create directory on server:**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "mkdir -p /opt/<service>"
   ```

2. **Initial source sync:**
   ```bash
   rsync -avz -e "ssh -i ~/.ssh/cursor" ./ root@95.216.244.60:/opt/<service>/
   ```

3. **Create .env file:**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "cat > /opt/<service>/.env << 'EOF'
   HOST=0.0.0.0
   PORT=<port>
   DATABASE_URL=postgresql://...
   RUST_LOG=info
   EOF"
   ```

4. **Build on server:**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "cd /opt/<service> && source ~/.cargo/env && cargo build --release"
   ```

5. **Create systemd unit:**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "cat > /etc/systemd/system/<service>.service << 'EOF'
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
   EOF"
   ```

6. **Enable and start:**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl daemon-reload && systemctl enable --now <service>.service"
   ```

7. **Configure nginx (if HTTP exposed):**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "cat > /etc/nginx/sites-available/<domain> << 'EOF'
   server {
       server_name <domain>;

       location / {
           proxy_pass http://127.0.0.1:<port>;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection \"upgrade\";
           proxy_set_header Host \$host;
           proxy_set_header X-Real-IP \$remote_addr;
       }
   }
   EOF"

   ssh -i ~/.ssh/cursor root@95.216.244.60 "ln -sf /etc/nginx/sites-available/<domain> /etc/nginx/sites-enabled/"
   ssh -i ~/.ssh/cursor root@95.216.244.60 "nginx -t && systemctl reload nginx"
   ```

8. **Add SSL:**
   ```bash
   ssh -i ~/.ssh/cursor root@95.216.244.60 "certbot --nginx -d <domain>"
   ```

### Frontend (Next.js)

1. Connect repo to Vercel
2. Set build command: `bun install && next build`
3. Set environment variables
4. Configure custom domain in Vercel + DNS
5. Push to main

---

## Rollback Procedures

### Backend Rollback

```bash
# 1. Check git history on server
ssh -i ~/.ssh/cursor root@95.216.244.60 "cd /opt/<service> && git log --oneline -5"

# 2. Revert to previous commit
ssh -i ~/.ssh/cursor root@95.216.244.60 "cd /opt/<service> && git checkout <previous-commit>"

# 3. Rebuild
ssh -i ~/.ssh/cursor root@95.216.244.60 "cd /opt/<service> && source ~/.cargo/env && cargo build --release"

# 4. Restart
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl restart <service>.service"
```

### Frontend Rollback

Use Vercel dashboard to redeploy a previous deployment.

---

## Monitoring & Logs

### View Logs

```bash
# Follow logs
ssh -i ~/.ssh/cursor root@95.216.244.60 "journalctl -u <service>.service -f"

# Last 100 lines
ssh -i ~/.ssh/cursor root@95.216.244.60 "journalctl -u <service>.service -n 100"

# Since specific time
ssh -i ~/.ssh/cursor root@95.216.244.60 "journalctl -u <service>.service --since '1 hour ago'"
```

### Health Checks

```bash
# Single service
ssh -i ~/.ssh/cursor root@95.216.244.60 "curl -sf localhost:<port>/health"

# All AsyncAnticheat services
ssh -i ~/.ssh/cursor root@95.216.244.60 "for port in 3002 4030 4031 4032 4033 4034 4035; do echo -n \"Port \$port: \"; curl -sf localhost:\$port/health || echo FAIL; done"
```
