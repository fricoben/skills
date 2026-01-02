---
name: thomas-communication
description: >
  Writes in Thomas's voice across two modes: (1) updates/announcements for Discord and changelogs, (2) narrative blog posts for thomas.md. Both are warm, simple, and avoid em dashes.
  Trigger terms: write like Thomas, thomas.md, communication style, tone of voice, blog post, update, release notes, changelog, announcement, patch notes, story, essay.
---

## When to Use
- Writing a blog post or personal essay for thomas.md.
- Drafting release notes, changelogs, or update announcements.
- Writing community messages (Discord, email, forum) in Thomas's voice.

## When NOT to Use
- Legal, compliance, or PR statements that require formal wording.
- Marketing copy that must follow a brand style guide different from Thomas's.
- Technical documentation that requires a neutral, impersonal tone.

## Content Types

There are three distinct modes. Identify which applies before writing:

| Mode | Use For | Key Traits |
|------|---------|------------|
| **Update** | Release notes, changelogs, Discord announcements | Greeting + summary + lists + sign-off |
| **Blog** | thomas.md essays, travel stories, reflections | Section headings, narrative arc, philosophical close |
| **Reply** | Short community responses, emails | Minimal, warm, direct |

## Inputs the Agent Should Ask For (only if missing; otherwise proceed)
- Content type: update, blog post, or short reply.
- Key points to include (features, fixes, themes, story beats).
- Audience and channel (blog, Discord, email, forum).
- Desired sign-off name (default: Thomas).

## Outputs / Definition of Done
- A text that matches Thomas's style for the chosen content type.
- No em dashes, no heavy marketing tone, no overly complex sentences.
- Updates: greeting, body with lists, sign-off.
- Blog posts: section headings, narrative flow, philosophical close.
- Replies: minimal and warm.

## Procedure

### For Updates (release notes, changelogs, announcements)
1. Open with "Hey," or "Hi everyone,".
2. State the update purpose in 1-2 direct sentences using first person.
3. Use numbered lists (1, 2, 3) for features; use bullet lists for fixes.
4. Add "See:" lines for documentation links.
5. Close with a warm line: "Enjoy!", "I hope you enjoy it,", or "Best,".
6. Add a blank line, then "Thomas" on its own line.

### For Blog Posts (essays, travel stories, reflections)
1. Open with a concrete, sensory scene or a direct personal statement.
2. Use short section headings as thematic chapters (e.g., "The Polish Man", "Falling Sick").
3. Mix short punchy sentences with longer descriptive ones.
4. Ground the narrative in specific places, people, and moments.
5. Build toward a philosophical reflection or lesson learned.
6. Close with a understated insight that ties back to the opening theme.
7. No sign-off needed for blog posts; end with the final reflection.

### For Short Replies (community responses, emails)
1. Open with "Hey [name]," or just "Hey,".
2. Acknowledge the topic in one sentence.
3. Provide information or next steps in 1-2 sentences.
4. Close with "Best," or "Thanks," then a blank line, then "Thomas".

### General Rules (all modes)
1. Output only the final text, no preface or meta commentary.
2. Remove any accidental preface lines if they appear during drafting.
3. Never use em dashes; prefer commas or parentheses for asides.

## Checks & Guardrails

### Universal
- Never use em dashes. Use commas or parentheses instead.
- Prefer simple verbs and concrete nouns; avoid buzzwords.
- Use mild warmth, not hype. One exclamation point at most per piece.
- Use contractions sparingly but naturally ("don't", "it's").
- Acknowledge uncertainty when relevant ("I might be wrong", "I'm not sure").
- Include "I" statements and a human, humble tone.
- Do not add any meta lines like "Sure" or "Here is the post". Only the final text.

### For Updates
- Keep paragraphs to 1-3 sentences.
- Avoid headings or separators like "---".
- Lists should be concise (one line per item).

### For Blog Posts
- Section headings should be evocative, not descriptive (e.g., "The Polish Man" not "Meeting Someone on the Plane").
- Ground abstractions in specific sensory details.
- The closing insight should feel earned, not preachy.
- Vary sentence length for rhythm.

## References
- references/thomas-style-notes.md
