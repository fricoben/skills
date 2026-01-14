Sync Accounting invoices/receipts to Revolut with a cutoff date and human confirmation.

What it does:
- Connects to Proton Bridge for both `ben@lfglabs.dev` and `ben@starknet.id`
- Scans Accounting mailboxes only
- Sends only messages that arrived *after* the stored cutoff
- Prompts with count + cutoff date before sending
- Advances the cutoff after a successful send

Run:
```bash
python3 bin/revolut-accounting-sync.py
```

State file:
`.context/revolut_accounting_sync.json`

Notes:
- The first run initializes the cutoff to yesterday 00:00 local time
- Edit the state file to adjust cutoff, accounts, or mailbox list if needed
