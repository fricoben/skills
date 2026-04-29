---
name: verity-prove-invariant
description: >
  Four-phase workflow for adding a new Verity benchmark case: (1) research the protocol
  and confirm the invariant, (2) modelize in Verity as close to Solidity as possible
  with agent + human verification, (3) prove the invariant in a persistent loop with
  intellectual honesty checks, (4) write a case study article for lfglabs.dev.
  Trigger terms: verity prove, new benchmark case, prove invariant, formally verify,
  add verity case, verify protocol, model contract in verity, lean contract verification.
---

# Verity Prove Invariant

Add a new formal-verification case to the Verity benchmark. Four phases, each **gated
by explicit user acknowledgement** — never cross a phase boundary silently.

See [references/full-workflow.md](references/full-workflow.md) for the complete
step-by-step procedure for each phase.

---

## Phase 1 — Research & invariant alignment

Research the protocol, read the Solidity source, then output ONE response covering:

1. What the protocol does (one paragraph)
2. Candidate invariants (1-3, highest-value first)
3. Evaluation of any user-proposed invariant
4. Translation fidelity audit (line-by-line feasibility in Verity)
5. Draft simplifications list

Check Verity capabilities against: `.lake/packages/verity/`, any repo-local fork,
and [veritylang.com](https://veritylang.com).

**Stop and wait for user confirmation before Phase 2.**

## Phase 2 — Modelize in Verity

Goal: near line-by-line translation of Solidity into Verity. Every deviation must be
justified by a concrete Verity limitation.

1. Create file layout matching Safe/Lido/Zama pattern
2. Write Contract.lean (with simplification doc-comment), Specs.lean, Generated placeholders
3. List proposed Verity issues (do NOT file them — proposals only)
4. Build scaffold: `lake build` must be green
5. Two-part verification: agent check + human review

**Stop and wait for user confirmation before Phase 3.**

## Phase 3 — Proving (persistent loop)

Write `Proofs.lean`. Do not stop until one of three terminal conditions:

1. **PROOF**: `lake build` succeeds, no `sorry`
2. **COUNTER-EXAMPLE**: concrete inputs that falsify the conclusion
3. **AXIOM**: added with doc-comment explaining assumption and why it couldn't be discharged

After proof lands: intellectual honesty check (no abusive axioms, every spec covered,
no `sorry`). Then open PR on `lfglabs-dev/verity-benchmark`.

## Phase 4 — Article

Write a case study for [lfglabs.dev](https://github.com/lfglabs-dev/lfglabs.dev).

1. Study existing case studies and components in the repo first
2. Ensure article math matches `Specs.lean` (refactor specs if needed)
3. Follow writing style: no em dashes, no filler, short sentences, active voice
4. Structure: Guarantee, Context, Why This Matters, How Modeled & Proven, Proof Status, Assumptions
5. Open PR on `lfglabs-dev/lfglabs.dev`

## Anti-patterns

- Starting code before listing simplifications and Verity friction points
- Writing proofs in `Generated/.../Tasks/*.lean` (that file stays `exact ?_`)
- Using `sorry` instead of a justified `axiom`
- Skipping Phase 1 even when the user gave an invariant
- Prematurely abstracting Solidity into a toy model
- Article math diverging from `Specs.lean`
- Creating Verity issues without user confirmation
- Em dashes or AI-sounding prose in articles

## Reference Files

- [full-workflow.md](references/full-workflow.md): Complete step-by-step procedure for all four phases
- [delegated-model-and-prove-prompt.md](references/delegated-model-and-prove-prompt.md): Prompt template for delegated proving agents
