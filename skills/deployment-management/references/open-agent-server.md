# Open Agent Server

**This is a separate VPS from the main dedicated server.**

Open Agent has its own infrastructure and should be managed independently.

---

## Server Details

| Property | Value |
|----------|-------|
| **IP** | `95.216.112.253` |
| **Provider** | Hetzner |
| **SSH Key** | `~/.ssh/agent.thomas.md` |
| **SSH User** | `root` |

**Connect:**
```bash
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253
```

---

## Services

### Open Agent Backend

| Property | Value |
|----------|-------|
| **Port** | 3000 |
| **Binary** | `/usr/local/bin/open_agent` |
| **Source** | `/root/open_agent` |
| **Env File** | `/etc/open_agent/open_agent.env` |
| **Systemd** | `open_agent.service` |
| **Public URL** | `https://agent-backend.thomas.md` |

### Nginx Proxy

- Proxies `agent-backend.thomas.md` → `127.0.0.1:3000`
- WebSocket upgrade enabled
- SSL via certbot

---

## Common Operations

### Check Status
```bash
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253 "systemctl status open_agent"
```

### View Logs
```bash
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253 "journalctl -u open_agent -f"
```

### Restart
```bash
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253 "systemctl restart open_agent"
```

### Edit Environment
```bash
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253 "vim /etc/open_agent/open_agent.env"
# Then restart
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253 "systemctl restart open_agent"
```

---

## Full Redeploy

```bash
ssh -i ~/.ssh/agent.thomas.md root@95.216.112.253 << 'EOF'
cd /root/open_agent
git pull
cargo build --release
cp target/release/open_agent /usr/local/bin/
systemctl restart open_agent
EOF
```

---

## Systemd Unit

Location: `/etc/systemd/system/open_agent.service`

```ini
[Unit]
Description=Open Agent Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/open_agent
EnvironmentFile=/etc/open_agent/open_agent.env
ExecStart=/usr/local/bin/open_agent
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## Dashboard

| Property | Value |
|----------|-------|
| **URL** | `https://agent.thomas.md` |
| **Hosting** | Vercel |
| **Source** | `open_agent/dashboard/` |

The dashboard is a Next.js app deployed to Vercel (auto-deploys from main).

---

## SSH Access Notes

**VPS to GitHub:** Uses `~/.ssh/cursor` key. Config on VPS:

```
Host github.com
    IdentityFile ~/.ssh/cursor
```

This allows `git pull` to work on the server.

---

## Key Differences from Main Server

| Aspect | Main Server | Open Agent Server |
|--------|-------------|-------------------|
| **IP** | 95.216.244.60 | 95.216.112.253 |
| **SSH Key** | `~/.ssh/cursor` | `~/.ssh/agent.thomas.md` |
| **Binary Location** | `/opt/<service>/target/release/` | `/usr/local/bin/open_agent` |
| **Env Location** | `/opt/<service>/.env` | `/etc/open_agent/open_agent.env` |
| **Source Location** | `/opt/<service>/` | `/root/open_agent/` |
