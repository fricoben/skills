#!/usr/bin/env python3
"""
Sync Accounting invoices/receipts to Revolut with a cutoff date and
human-in-the-loop confirmation.

- Reads/writes state in .context/revolut_accounting_sync.json
- Sends only messages arriving AFTER the stored cutoff
- Prompts for confirmation with count + cutoff before sending
"""
from __future__ import annotations

import json
import os
import re
import smtplib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email import message_from_bytes
from email.header import decode_header
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Iterable, List, Optional

import imaplib


INTERNALDATE_RE = re.compile(r'INTERNALDATE "([^"]+)"')
PDF_RE = re.compile(r'"(?:NAME|FILENAME)"\s*"([^"]+\.pdf)"', re.IGNORECASE)


@dataclass
class Config:
    imap_host: str
    imap_port: int
    smtp_host: str
    smtp_ports: List[int]
    accounts: List[str]
    password: str
    recipient: str
    cutoff_by_account: dict
    accounting_mailboxes: List[str]


@dataclass
class AttachmentToSend:
    filename: str
    payload: bytes
    subject: str
    sender: str
    date_str: str
    internaldate: datetime


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def workflows_dir() -> Path:
    return Path(__file__).resolve().parent


def state_path() -> Path:
    return repo_root() / ".context" / "revolut_accounting_sync.json"


def run_log_path() -> Path:
    return workflows_dir() / "revolut-sync-runs.json"


def load_run_log() -> List[dict]:
    p = run_log_path()
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return []


def save_run_log(log: List[dict]) -> None:
    p = run_log_path()
    p.write_text(json.dumps(log, indent=2, default=str), encoding="utf-8")


def decode_header_value(val: Optional[str]) -> str:
    if not val:
        return ""
    parts = decode_header(val)
    return "".join(
        p.decode(e or "utf-8", errors="replace") if isinstance(p, bytes) else p
        for p, e in parts
    )


def yesterday_midnight_local() -> datetime:
    now = datetime.now().astimezone()
    yday = (now.date() - timedelta(days=1))
    return datetime.combine(yday, datetime.min.time(), tzinfo=now.tzinfo)


def load_or_init_config() -> Config:
    path = state_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
    else:
        cutoff = yesterday_midnight_local().isoformat()
        data = {
            "imap": {"host": "127.0.0.1", "port": 1143},
            "smtp": {"host": "127.0.0.1", "ports": [1025, 1465]},
            "accounts": ["ben@lfglabs.dev", "ben@starknet.id"],
            "password": os.environ.get("PROTON_BRIDGE_PASSWORD", ""),
            "recipient": "benjamin.flores@expenses.revolut.com",
            "cutoff_by_account": {
                "ben@lfglabs.dev": cutoff,
                "ben@starknet.id": cutoff,
            },
            "accounting_mailboxes": [
                "Folders/Admin Work/Accounting",
                "Labels/Accounting",
            ],
        }
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    # Ensure cutoffs exist for all accounts
    cutoff_by_account = data.get("cutoff_by_account", {})
    for acct in data.get("accounts", []):
        if acct not in cutoff_by_account:
            cutoff_by_account[acct] = yesterday_midnight_local().isoformat()

    password = os.environ.get("PROTON_BRIDGE_PASSWORD") or data.get("password") or ""
    if not password:
        raise SystemExit("No password found. Set PROTON_BRIDGE_PASSWORD or add 'password' to state file.")

    return Config(
        imap_host=data["imap"]["host"],
        imap_port=int(data["imap"]["port"]),
        smtp_host=data["smtp"]["host"],
        smtp_ports=[int(p) for p in data["smtp"]["ports"]],
        accounts=list(data["accounts"]),
        password=password,
        recipient=str(data["recipient"]),
        cutoff_by_account=cutoff_by_account,
        accounting_mailboxes=list(data.get("accounting_mailboxes", [])),
    )


def save_config(cfg: Config) -> None:
    path = state_path()
    data = {
        "imap": {"host": cfg.imap_host, "port": cfg.imap_port},
        "smtp": {"host": cfg.smtp_host, "ports": cfg.smtp_ports},
        "accounts": cfg.accounts,
        "password": cfg.password,
        "recipient": cfg.recipient,
        "cutoff_by_account": cfg.cutoff_by_account,
        "accounting_mailboxes": cfg.accounting_mailboxes,
    }
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def list_mailboxes(imap: imaplib.IMAP4) -> List[str]:
    typ, boxes = imap.list()
    if typ != "OK" or not boxes:
        return []
    names: List[str] = []
    for b in boxes:
        s = b.decode(errors="replace")
        m = re.search(r'"([^"]+)"\s*$', s)
        name = m.group(1) if m else s.split()[-1].strip('"')
        names.append(name)
    return names


def resolve_accounting_mailboxes(available: List[str], configured: List[str]) -> List[str]:
    if configured:
        found = [m for m in configured if m in available]
        if found:
            return found
    return [m for m in available if "accounting" in m.lower()]


def parse_internaldate(raw: bytes) -> Optional[datetime]:
    try:
        text = raw.decode(errors="ignore")
    except Exception:
        text = str(raw)
    m = INTERNALDATE_RE.search(text)
    if not m:
        return None
    try:
        return datetime.strptime(m.group(1), "%d-%b-%Y %H:%M:%S %z")
    except Exception:
        return None


def extract_pdf_filenames_from_bodystructure(raw: bytes) -> List[str]:
    try:
        text = raw.decode(errors="ignore")
    except Exception:
        text = str(raw)
    # Deduplicate: BODYSTRUCTURE lists each filename in NAME + FILENAME fields
    seen: set = set()
    result: List[str] = []
    for f in PDF_RE.findall(text):
        f = f.strip()
        if f and f.lower() not in seen:
            seen.add(f.lower())
            result.append(f)
    return result


def smtp_pick_port(cfg: Config, account: str) -> Optional[int]:
    for port in cfg.smtp_ports:
        try:
            with smtplib.SMTP_SSL(cfg.smtp_host, port, timeout=10) as server:
                server.login(account, cfg.password)
            return port
        except Exception:
            continue
    return None


def imap_connect(cfg: Config, account: str) -> imaplib.IMAP4:
    imap = imaplib.IMAP4(cfg.imap_host, cfg.imap_port)
    imap.starttls()
    imap.login(account, cfg.password)
    return imap


def fetch_headers_and_bodystructure(imap: imaplib.IMAP4, uid: bytes) -> tuple[Optional[email.message.Message], Optional[bytes]]:
    typ, data = imap.uid(
        "FETCH",
        uid,
        "(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)] BODYSTRUCTURE INTERNALDATE)",
    )
    if typ != "OK" or not data or data[0] is None:
        return None, None
    # imaplib splits FETCH responses with literals: data[0] is a tuple
    # (preamble_bytes, header_bytes) and data[1] is bytes containing
    # BODYSTRUCTURE + INTERNALDATE. Concatenate all bytes to get full response.
    raw_parts: List[bytes] = []
    header_msg = None
    for item in data:
        if isinstance(item, tuple):
            for part in item:
                if isinstance(part, (bytes, bytearray)):
                    raw_parts.append(part)
            # The second element of the tuple is the header content
            if len(item) > 1 and isinstance(item[1], (bytes, bytearray)):
                header_msg = message_from_bytes(item[1])
        elif isinstance(item, (bytes, bytearray)):
            raw_parts.append(item)
    raw = b" ".join(raw_parts) if raw_parts else None
    return header_msg, raw


def fetch_full_message(imap: imaplib.IMAP4, uid: bytes) -> Optional[email.message.Message]:
    typ, data = imap.uid("FETCH", uid, "(RFC822)")
    if typ != "OK" or not data or data[0] is None:
        return None
    if isinstance(data[0], tuple):
        return message_from_bytes(data[0][1])
    return None


def collect_attachments_from_mailboxes(
    imap: imaplib.IMAP4,
    mailboxes: List[str],
    cutoff: datetime,
) -> List[AttachmentToSend]:
    """Scan mailboxes one at a time, deduplicating by Message-ID across all."""
    to_send: List[AttachmentToSend] = []
    seen_msg_ids: set = set()

    for mailbox in mailboxes:
        typ, _ = imap.select(f'"{mailbox}"')
        if typ != "OK":
            continue

        since_str = cutoff.strftime("%d-%b-%Y")
        typ, data = imap.search(None, "SINCE", since_str)
        if typ != "OK" or not data or not data[0]:
            continue

        uids = data[0].split()
        for uid in uids:
            hdr, raw = fetch_headers_and_bodystructure(imap, uid)
            if raw is None:
                continue
            internal = parse_internaldate(raw)
            if internal is None or internal <= cutoff:
                continue
            pdfs = extract_pdf_filenames_from_bodystructure(raw)
            if not pdfs:
                continue

            # Deduplicate by Message-ID: fetch full message in correct mailbox context
            msg = fetch_full_message(imap, uid)
            if not msg:
                continue
            msg_id = msg.get("Message-ID")
            if msg_id and msg_id in seen_msg_ids:
                continue
            if msg_id:
                seen_msg_ids.add(msg_id)

            # Skip emails previously forwarded by this script
            subject = decode_header_value(msg.get("Subject"))
            if subject.startswith("Invoice/Receipt:"):
                continue

            sender = decode_header_value(msg.get("From"))
            date_str = msg.get("Date") or ""

            pdf_lower = {p.lower() for p in pdfs}
            for part in msg.walk():
                if part.get_content_maintype() == "multipart":
                    continue
                filename = part.get_filename()
                if not filename or filename.lower() not in pdf_lower:
                    continue
                payload = part.get_payload(decode=True) or b""
                to_send.append(
                    AttachmentToSend(
                        filename=filename,
                        payload=payload,
                        subject=subject,
                        sender=sender,
                        date_str=date_str,
                        internaldate=internal,
                    )
                )
    return to_send


def send_attachments(
    cfg: Config,
    account: str,
    smtp_port: int,
    attachments: List[AttachmentToSend],
) -> int:
    sent = 0
    try:
        with smtplib.SMTP_SSL(cfg.smtp_host, smtp_port, timeout=30) as server:
            server.login(account, cfg.password)
            for idx, item in enumerate(attachments, 1):
                msg = MIMEMultipart()
                msg["From"] = account
                msg["To"] = cfg.recipient
                subj = item.subject or item.filename
                msg["Subject"] = f"Invoice/Receipt: {subj}"

                body = (
                    "Forwarding invoice/receipt.\n"
                    f"From: {item.sender}\n"
                    f"Date: {item.date_str}\n"
                    f"Original subject: {item.subject}\n"
                )
                msg.attach(MIMEText(body, "plain"))

                part = MIMEApplication(item.payload, Name=item.filename)
                part["Content-Disposition"] = f'attachment; filename="{item.filename}"'
                msg.attach(part)

                server.send_message(msg)
                sent += 1
                if idx % 25 == 0:
                    print(f"  sent {idx}/{len(attachments)}", flush=True)
    except smtplib.SMTPDataError as e:
        print(f"\n  SMTP error after {sent}/{len(attachments)}: {e}", flush=True)
        if "limit" in str(e).lower():
            print("  Rate limit hit. Progress saved — retry later.", flush=True)
    return sent


def main() -> int:
    cfg = load_or_init_config()
    cfg_changed = False

    run_log = load_run_log()
    run_entry = {
        "run_at": datetime.now().astimezone().isoformat(),
        "accounts": {},
    }

    for account in cfg.accounts:
        print(f"\n== {account} ==", flush=True)
        acct_log: dict = {"cutoff_used": None, "new_cutoff": None, "mailboxes": [], "pdfs_found": 0, "pdfs_sent": 0, "status": "pending", "pdf_details": []}

        cutoff_iso = cfg.cutoff_by_account.get(account)
        cutoff = None
        if cutoff_iso:
            try:
                cutoff = datetime.fromisoformat(cutoff_iso)
            except Exception:
                cutoff = None
        if cutoff is None:
            cutoff = yesterday_midnight_local()
            cfg.cutoff_by_account[account] = cutoff.isoformat()
            cfg_changed = True

        acct_log["cutoff_used"] = cutoff.isoformat()

        imap = imap_connect(cfg, account)
        available = list_mailboxes(imap)
        accounting_boxes = resolve_accounting_mailboxes(available, cfg.accounting_mailboxes)
        if not accounting_boxes:
            print("No Accounting mailbox found.")
            acct_log["status"] = "no_mailbox"
            run_entry["accounts"][account] = acct_log
            imap.logout()
            continue

        acct_log["mailboxes"] = accounting_boxes
        print(f"Accounting mailboxes: {', '.join(accounting_boxes)}")
        print(f"Cutoff (send after): {cutoff.isoformat()}")

        attachments = collect_attachments_from_mailboxes(imap, accounting_boxes, cutoff)
        acct_log["pdfs_found"] = len(attachments)
        acct_log["pdf_details"] = [
            {"filename": a.filename, "subject": a.subject, "sender": a.sender, "date": a.date_str, "internaldate": a.internaldate.isoformat()}
            for a in attachments
        ]

        if not attachments:
            print("No PDF attachments found after cutoff.")
            acct_log["status"] = "no_pdfs"
            acct_log["new_cutoff"] = cutoff.isoformat()
            run_entry["accounts"][account] = acct_log
            imap.logout()
            continue

        print(f"Ready to send: {len(attachments)} PDF(s) (deduplicated across mailboxes)")

        confirm = input("Send now? [y/N]: ").strip().lower()
        if confirm not in {"y", "yes"}:
            print("Skipped sending for this account.")
            acct_log["status"] = "skipped_by_user"
            acct_log["new_cutoff"] = cutoff.isoformat()
            run_entry["accounts"][account] = acct_log
            imap.logout()
            continue

        smtp_port = smtp_pick_port(cfg, account)
        if not smtp_port:
            print("SMTP login failed on ports 1025/1465. Skipping send.")
            acct_log["status"] = "smtp_failed"
            acct_log["new_cutoff"] = cutoff.isoformat()
            run_entry["accounts"][account] = acct_log
            imap.logout()
            continue

        sent_count = send_attachments(cfg, account, smtp_port, attachments)
        print(f"Sent {sent_count}/{len(attachments)}")

        acct_log["pdfs_sent"] = sent_count

        # Advance cutoff to latest internaldate of actually sent attachments
        if sent_count > 0:
            sent_attachments_list = attachments[:sent_count]
            latest = max(a.internaldate for a in sent_attachments_list)
            cfg.cutoff_by_account[account] = latest.isoformat()
            cfg_changed = True
            acct_log["new_cutoff"] = latest.isoformat()
        else:
            acct_log["new_cutoff"] = cutoff.isoformat()

        acct_log["status"] = "sent" if sent_count == len(attachments) else "partial_send" if sent_count > 0 else "rate_limited"
        run_entry["accounts"][account] = acct_log

        imap.logout()

    # Save run log
    run_log.append(run_entry)
    save_run_log(run_log)
    print(f"Run log saved: {run_log_path()}")

    if cfg_changed:
        save_config(cfg)
        print(f"Updated state: {state_path()}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
