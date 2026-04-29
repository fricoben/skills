# Verity Prove Invariant — Full Workflow Details

## Phase 1 — Research, invariant alignment, and translation audit (before any code)

You will receive an entry point: a Solidity contract address, a GitHub repository, a
protocol name, or similar. Your first job is to find and read the actual Solidity source
code.

**Research the protocol first.** Use web fetches to read:
- The protocol's documentation and website
- The actual Solidity source on GitHub (raw.githubusercontent.com)
- Read enough source to identify the require checks, state variables, storage layout
  decisions, loops / queues, and external calls

Once you have done this research, output ONE text response covering all of the
following, then **stop and wait for user acknowledgement**. Do not proceed to Phase 2
until the user explicitly confirms.

1. **What the protocol does.** One-paragraph plain-English summary. Include: what it's
   for, who uses it, what's the unit of value at risk, and what function(s) the user
   is asking about.
2. **Candidate invariants.** Propose 1–3 invariants ordered from highest-value to
   least. For each, state what it prevents (e.g. "no tokens created out of thin air",
   "balance state cannot leak through revert"). Pick the minimum invariant that
   actually exercises the contract's non-trivial logic — not a tautology like "storage
   slot X is written".
3. **If the user proposed an invariant,** say explicitly whether it makes sense. If
   it's too weak (trivially true), too strong (requires modelling the whole world),
   or mis-targets the contract, say so and propose an adjustment.
4. **Translation fidelity audit.** For the exact Solidity files/functions in scope,
   identify the constructs that can be translated near line-by-line in Verity and the
   constructs that would require rewrites or trusted boundaries. For each non-trivial
   rewrite, include:
   - the exact Solidity construct / snippet / file path
   - the closest Verity surface you would use
   - the classification: no issue / proof-gap-only / Verity-gap / hard blocker
   - whether this changes syntax only, or also risks changing semantics

   To assess Verity capabilities, check in this order:
   - the current local package at `.lake/packages/verity/`
   - any repo-local or user-provided Verity fork (e.g. `.context/lfglabs-verity`)
   - the Verity documentation at [veritylang.com](https://veritylang.com)

   Distinguish clearly between "cannot express", "can express but proof story is
   incomplete", and "can express cleanly".
5. **Draft simplifications before code.** List every simplification you currently
   expect to make, or explicitly say "none yet". If a simplification is driven by
   Verity limitations, say whether:
   - there is a workaround in the current local package
   - there is a workaround in a repo-local or user-provided Verity fork
   - this should probably become a Verity issue
6. **Wait.** End with: "Confirm you're aligned on this invariant, the line-by-line
   modeling plan, and the listed simplifications / Verity gaps, and I'll start
   modelling."

---

## Phase 2 — Modelize in Verity

Only start after the user acknowledges Phase 1.

### 2a. File layout (match Safe/Lido/Zama)

Create or update:

```text
Benchmark/Cases/<Project>/<Case>/
├── Contract.lean
├── Specs.lean
├── Proofs.lean
└── Compile.lean

Benchmark/Generated/<Project>/<Case>/Tasks/
└── <TheoremName>.lean   ← placeholder only, body stays `exact ?_`

cases/<project>/<case>/
├── case.yaml
├── tasks/<theorem_name>.yaml
└── verity/{Contract,Specs,Compile}.lean

families/<family>/
├── family.yaml
└── implementations/<impl>/implementation.yaml
```

Inversion warning: the reference proof goes in `Cases/.../Proofs.lean`, NOT in the
`Generated/.../Tasks/*.lean` placeholder. The placeholder stays `exact ?_` forever.

### 2b. Write the Verity model as close to Solidity as possible

The goal is a near line-by-line translation. Every deviation must be justified by a
concrete Verity limitation.

**Translation preference order:**

1. Line-by-line Verity translation preserving function boundaries, branch structure,
   helper names, slot layout, and external-call boundaries.
2. Syntax-close rewrite that preserves semantics and keeps the source mapping obvious.
3. Narrower semantic model with explicit acknowledged simplifications — only as a last
   resort.

Do not silently jump from (1) to (3).

**If you discover a new simplification** not listed in Phase 1, do not stop. Use your
judgment, continue writing, but **mention it at the end** when presenting to the user.

Before claiming any Verity limitation, verify against:
- `.lake/packages/verity/` (the local package)
- any repo-local or user-provided Verity fork
- the Verity documentation at [veritylang.com](https://veritylang.com)

**Contract.lean** must have a doc-comment at the top listing every simplification in
two columns: "what was simplified" and "why".

**Specs.lean** — each property as a `def foo_spec (... : ContractState) : Prop`. Keep
specs minimal.

**Generated placeholders + YAMLs** for each theorem.

### 2c. Proposed Verity issues

For every modeling deviation, produce a section listing proposals. For each:
- What construct could not be expressed
- What you did instead
- Proposed Verity improvement
- Severity: nice-to-have / proof-gap-only / blocks-faithful-modeling

**Do not create issues on the Verity repository.** These are proposals only.

Before proposing any gap, check the Verity repository for existing coverage:
- Open issues and PRs
- Recently merged PRs
- Umbrella/tracking issues and their comments
- Roadmap docs

### 2d. Build the scaffold

```bash
lake build Benchmark.Cases.<Project>.<Case>.Contract
lake build Benchmark.Cases.<Project>.<Case>.Specs
lake build
```

All three must be green BEFORE moving to Phase 3.

### 2e. Verification

**Part A — Agent verification**: Spawn a verification agent that checks:
1. Are the claimed Verity gaps legitimate?
2. Is semantics preserved?
3. Is the model as close to Solidity as possible?

**Part B — Human review**: Present the modelization with:
- Side-by-side snippets
- File pointers
- Simplification summary
- Proposed Verity issues for user to confirm or reject

Do not proceed to Phase 3 until the user confirms.

---

## Phase 3 — Proving (persistent loop)

Write `Proofs.lean` and do not come back until you reach one of three terminal conditions.

### Terminal conditions

1. **PROOF**: `lake build` succeeds, no `sorry`.
2. **COUNTER-EXAMPLE**: concrete `ContractState` + inputs that falsify the conclusion.
3. **AXIOM**: an `axiom` with doc-comment explaining what is assumed and why it couldn't
   be discharged mechanically.

### 3a. Verification — intellectual honesty check

Check: Are axioms abusive? Is every spec proven? Any `sorry` remaining?

### 3b. Open a PR on the verity-benchmark repository

Use `gh pr create` with `--base main`.

### Quick reference: proving recipe

For state-transition theorems on monadic contracts:

```lean
theorem my_theorem ... (hFrom : (addr != zeroAddress) = true) ... := by
  have hAddrNZ := address_ne_of_neq_zero hFrom
  unfold my_spec balanceOf supply
  by_cases hCond : <condition>
  · dsimp
    simp [ContractName.fn, ContractName.fields..., helper_functions...,
          getStorage, setStorage, getMapping, setMapping, getMapping2, setMapping2,
          Verity.require, Verity.bind, Bind.bind, Verity.pure, Pure.pure,
          Contract.run, ContractResult.snd,
          <all the hypothesis names>]
    <calc / rw / Uint256 lemmas>
  · ... symmetric branch ...
```

If the residual goal involves `% 2^64`, use `uint256_mod_uint64_of_lt`.
If it involves EVM-add vs hadd, `rw [Verity.Proofs.Stdlib.Automation.evm_add_eq_hadd]`.
If it involves `sub + add` cancellation, use `Verity.Core.Uint256.sub_add_cancel_left`.

---

## Phase 4 — Article

Write a case study article for [lfglabs.dev](https://github.com/lfglabs-dev/lfglabs.dev).

### 4a. Learn existing components and patterns (mandatory before writing)

Read from the lfglabs.dev repo:
1. Existing case study pages in `pages/research/`
2. Reusable components in `components/research/`
3. Data model in `data/research.js`
4. Layout and shared components

### 4b. Specs readability check

The math in the article must match `Specs.lean`. If too complex, refactor `Specs.lean`
with helper definitions first.

### 4c. Writing style

- No em dashes. Use commas, periods, parentheses, or colons.
- No filler phrases.
- No inflated language.
- Short sentences. Active voice. Be specific.
- Strip anything that sounds AI-generated.

### 4d. Article structure

1. **The Guarantee** — invariant with `<Guarantee>` component (English + math)
2. **Context** — protocol and contract explanation (2-3 paragraphs)
3. **Why This Matters** — what failure mode the invariant prevents
4. **How This Was Modeled & Proven** — Verity approach, links, `<CodeBlock>`
5. **Proof Status** — Proven / Proven with assumptions / In progress
6. **Assumptions** — each axiom/hypothesis with `<Hypothesis>` components

### 4e. Metadata entry

Add entry to `data/research.js` with slug, title, subtitle, description, date, tag.

### 4f. Verification

Confirm: math matches Specs.lean, assumptions match proof, status is accurate, real
component APIs used, no em dashes, no AI-sounding prose.

### 4g. Open a PR on lfglabs.dev

Use `gh pr create` with `--base main`.
