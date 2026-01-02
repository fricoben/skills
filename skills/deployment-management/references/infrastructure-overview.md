# Infrastructure Overview

Complete reference for Thomas's production infrastructure.

---

## Servers

### Main Dedicated Server

| Property | Value |
|----------|-------|
| **IP** | `95.216.244.60` |
| **Provider** | Hetzner |
| **Location** | EU |
| **SSH User** | `root` |
| **SSH Port** | `22` |
| **SSH Key** | `~/.ssh/cursor` |

**Connect:**
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60
```

**SSH Config (recommended):**
```
Host minecraft-dedicated
  HostName 95.216.244.60
  User root
  IdentityFile ~/.ssh/cursor
```

### Open Agent Server

Separate VPS for Open Agent project. See `open-agent-server.md` for details.

| Property | Value |
|----------|-------|
| **IP** | `95.216.112.253` |
| **SSH Key** | `~/.ssh/agent.thomas.md` |

---

## Services on Main Server

### AsyncAnticheat Ecosystem

**Main API:**
| Property | Value |
|----------|-------|
| Port | 3002 |
| Systemd | `asyncanticheat-api.service` |
| Binary | `/opt/async_anticheat_api/target/release/async_anticheat_api` |
| Config | `/opt/async_anticheat_api/.env` |
| Health | `curl localhost:3002/health` |

**Detection Modules:**

| Module | Port | Systemd Unit | Checks |
|--------|------|--------------|--------|
| Movement Core | 4030 | `async-anticheat-movement-core.service` | flight, speed, nofall, groundspoof |
| Movement Advanced | 4031 | `async-anticheat-movement-advanced.service` | Y prediction, hover, timer, step, noslow |
| Combat Core | 4032 | `async-anticheat-combat-core.service` | autoclicker, reach, killaura, noswing |
| Combat Advanced | 4033 | `async-anticheat-combat-advanced.service` | aim (GCD, snap), autoclicker stats |
| Player Core | 4034 | `async-anticheat-player-core.service` | badpackets, fastplace, fastbreak, scaffold |
| Player Advanced | 4035 | `async-anticheat-player-advanced.service` | inventory, pattern-based scaffold |

**Health check all:**
```bash
for port in 3002 4030 4031 4032 4033 4034 4035; do
  echo -n "Port $port: " && curl -sf http://127.0.0.1:$port/health && echo
done
```

### MCServerJars API

| Property | Value |
|----------|-------|
| Port | 3001 |
| Systemd | `mcserverjars-api.service` |
| Binary | `/opt/mcserverjars_api/target/release/mcserverjars_api` |
| Config | `/opt/mcserverjars_api/.env` |
| Health | `curl localhost:3001/health` |

### Custom Capes API

| Property | Value |
|----------|-------|
| Port | 3000 |
| Systemd | `customcapes-api.service` |
| Health | `curl localhost:3000/health` |

### Minecraft Test Server

| Property | Value |
|----------|-------|
| Port | 25565 |
| Systemd | `minecraft-test.service` |
| Root Dir | `/root/minecraft/paper-1.21` |
| Plugins | `/root/minecraft/paper-1.21/plugins` |
| Paper Version | 1.21.4 build 232 |
| RCON | `127.0.0.1:25575` |

---

## Vercel Frontends

All auto-deploy from `main` branch.

| Project | Domain | Path | Build Command |
|---------|--------|------|---------------|
| thomas.md | `thomas.md` | `thomas.md/` | `bun install && next build` |
| Oraxen Website | `oraxen.com` | `oraxen/oraxen.com/` | `bun install && next build` |
| Oraxen Docs | `docs.oraxen.com` | `oraxen/docs.oraxen.com/` | `bun install && next build` |
| Oraxen Studio | `studio.oraxen.com` | `oraxen/studio.oraxen.com/` | `bun install && next build` |
| HackedServer Website | `hackedserver.org` | `hackedserver/hackedserver.org/` | `bun install && next build` |
| HackedServer Docs | `docs.hackedserver.org` | `hackedserver/docs.hackedserver.org/` | `bun install && next build` |
| AsyncAnticheat | `asyncanticheat.com` | `asyncanticheat/asyncanticheat.com/` | `bun install && next build` |
| MCServerJars | `mcserverjars.com` | `mcserverjars.com/` | `bun install && next build` |
| SkinMotion Dashboard | `skin.thomas.md` | `skinmotion/dashboard/` | `bun install && next build` |
| Open Agent Dashboard | `agent.thomas.md` | `open_agent/dashboard/` | `bun install && next build` |

---

## SSH Keys Reference

| Key | Purpose | Location |
|-----|---------|----------|
| `~/.ssh/cursor` | Main dedicated server | `95.216.244.60` |
| `~/.ssh/agent.thomas.md` | Open Agent server | `95.216.112.253` |
| `~/.ssh/github_ci` | GitHub Actions CI | — |
| `~/.ssh/github_read` | GitHub read access | — |

---

## Common Operations

### Check All Services
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl status asyncanticheat-api mcserverjars-api customcapes-api minecraft-test --no-pager"
```

### Restart All AsyncAnticheat
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "systemctl restart asyncanticheat-api async-anticheat-{movement,combat,player}-{core,advanced}"
```

### View Combined Logs
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "journalctl -u asyncanticheat-api -u mcserverjars-api -f"
```

### Disk Usage
```bash
ssh -i ~/.ssh/cursor root@95.216.244.60 "df -h && du -sh /opt/*"
```
