---
name: verity-scoping
description: >
  Research a protocol's EVM/Solidity contracts in depth, identify the best target for
  formal verification, and draft a scoping message for outreach. Trigger terms: verity
  scoping, scope protocol, research contracts, formal verification scope, scoping message,
  what to verify, contract research.
---

# Verity Scoping

Research a protocol's Solidity contracts and draft a concise scoping message for formal verification outreach.

## When to use

- User gives a protocol name, website, or GitHub repo and wants to scope formal verification
- User says "scope X", "research X contracts", "what should we verify on X"

## When NOT to use

- Lead enrichment or email finding (use `/find-leads` or `/lemlist`)
- Writing cold emails (use `/cold-email`)
- General CRM updates

## Sources of truth

- `projects/verity/CLAUDE.md` — Verity ICP, business model, outreach angle
- `projects/verity/data/leads.json` — check if protocol is already a lead
- `projects/verity/data/companies.json` — check if protocol is in prospect universe

## Procedure

### 1. Deep technical research

Run a thorough research pass on the protocol. Find:

- **Official docs and website**
- **GitHub org/repos** with Solidity contracts
- **Public audits** (who audited, when, which contracts)
- **Bug bounty programs** (Immunefi, etc.)
- **TVL / assets at risk** (DefiLlama, L2BEAT)
- **Existing formal verification** (any Lean/Coq/Isabelle work already done)

Focus on EVM/Solidity only. If the protocol is multi-chain, only care about Ethereum L1 contracts.

### 2. Identify the best target contract

Pick ONE concrete `.sol` file or contract system. Prioritize by:

1. **Highest value at risk** — bridges, vaults, token contracts securing real funds
2. **Highest complexity** — custom logic, not just OpenZeppelin wrappers
3. **Least verified** — no existing formal verification, limited or old audits
4. **Self-contained** — can be meaningfully verified without the entire codebase

If multiple strong candidates exist, rank them and present the top pick with alternatives.

### 3. Derive invariant and risk area for that SAME contract

Critical: the invariant and risk area MUST be about the same contract picked in step 2. All 3 points form one coherent story.

- **Key invariant**: one core property that, if proven, gives the most security value
- **Highest-risk area**: one or two specific code paths or edge cases in that contract where a bug would be most damaging

### 4. Draft the scoping message

Write a short message following this structure:

```
Hey [team/name] !

We're writing a research paper with the Ethereum Foundation on AI enabled formal
verification for smart contracts and we would like to use [protocol] [specific contracts]
as case study.

As it's all open source, we don't need anything from you, just a yes and a quick async
scope alignment so we formally verify part of your contracts for free.

1/ Which exact contract to cover? [ask their preference between 1-2 options, state default guess with repo path]
2/ Key invariant? [one invariant about the SAME contract from 1/]
3/ Highest-risk area? [one risk area about the SAME contract from 1/]

Thanks !
Have a good day
```

### Message rules

- Casual, peer-level tone, not salesy
- No em dashes, use commas instead
- No signature block on Slack (add "Ben, Cofounder LFG Labs" only for TG/cold outreach)
- Reference actual repo paths and `.sol` filenames when public code exists
- If public code is thin, stay generic and use cautious wording ("my guess would be...")
- Keep it short, no walls of text
- All 3 numbered points MUST be about the same contract, they tell one story

### 5. Present to user

Output:
1. **Research summary** — brief table of contracts found, TVL, audits, verification status
2. **Recommended target** — which contract and why
3. **Draft message** — ready to copy-paste

Wait for user feedback before updating CRM.

## Quality check

Before presenting the message, verify:
- [ ] Points 1/, 2/, 3/ are all about the same contract
- [ ] Contract name and repo path are real (not invented)
- [ ] Invariant is specific and meaningful, not generic "it should work correctly"
- [ ] Risk area points to actual code logic, not hand-wavy "edge cases"
- [ ] No em dashes
- [ ] Tone is casual, reads like a Slack message between engineers
