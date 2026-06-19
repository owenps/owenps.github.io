+++
title = "tdiff"
description = "Local diff review, built for agents."
+++

<style>
.tdiff-hero {
  padding: 2rem 0 1rem;
}
.tdiff-eyebrow {
  font-family: monospace;
  color: var(--link-color);
  margin-bottom: 0.5rem;
}
.tdiff-hero h1 {
  font-size: 2.4rem;
  line-height: 1.1;
  margin: 0 0 1rem;
}
.tdiff-lede {
  font-size: 1.15rem;
  color: var(--heading-color);
}
.tdiff-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.5rem 0;
}
.tdiff-button {
  border: 1px solid var(--link-color);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.tdiff-button.primary {
  background: var(--link-color);
  color: var(--background-color);
}
.tdiff-button:hover {
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 2px 2px 0 var(--link-color);
}
.tdiff-button.primary:hover {
  box-shadow: 2px 2px 0 #2459ad;
}
html[data-theme="dark"] .tdiff-button.primary:hover {
  box-shadow: 2px 2px 0 #5f9fbb;
}
.tdiff-shot {
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.12);
  margin: 1rem 0 2rem;
}
</style>

<section class="tdiff-hero">
  <div class="tdiff-eyebrow">tdiff ∓</div>
  <h1>Local diff review, built for agents.</h1>
  <p class="tdiff-lede">tdiff is a terminal diff reviewer for AI-heavy workflows. Annotate lines ontop of your local changes, then export clean markdown for Claude, Codex, Pi, or wherever you work.</p>
  <div class="tdiff-actions">
    <a class="tdiff-button primary" href="https://github.com/owenps/tdiff">View on GitHub</a>
    <a class="tdiff-button" href="#install">Install</a>
  </div>
</section>

<img class="tdiff-shot" src="https://raw.githubusercontent.com/owenps/tdiff/main/docs/assets/screenshots/main-ui.png" alt="tdiff terminal diff review UI">

## Why tdiff?

Coding agents are better with precise context. tdiff lets you review your local diff without leaving the terminal, attach notes to specific lines, and export those annotations as focused markdown.

## Built for review loops

- Annotate lines/ranges, then export markdown for an agent to address.
- Sync GitHub PR comments/review threads into your local review.
- Navigate fast with keyboard-first hunk/file movement.
- Keep context readable with syntax highlighting, split/unified views, and whitespace toggles.
- Data stored 100% locally.

## Install {#install}

```sh
go install github.com/owenps/tdiff@latest
tdiff
```

[Read the README](https://github.com/owenps/tdiff) for keybinds and development notes.
