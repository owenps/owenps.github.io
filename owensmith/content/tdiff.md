+++
title = "tdiff"
description = "Repo-local review threads for human-agent loops."
+++

<style>
.tdiff-hero {
  --tdiff-add: #1f7a35;
  --tdiff-add-bg: rgba(31, 122, 53, 0.14);
  --tdiff-paper: #fffdf8;
  --tdiff-ink: var(--heading-color);
  padding: 2rem 0 1rem;
}
html[data-theme="dark"] .tdiff-hero {
  --tdiff-add: #55b86c;
  --tdiff-add-bg: rgba(85, 184, 108, 0.16);
  --tdiff-paper: #07313d;
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
.tdiff-diffmark {
  background: var(--tdiff-add-bg);
  border-radius: 4px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  padding: 0 0.14em;
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
  align-items: center;
  background: var(--tdiff-paper);
  border: 1.5px solid var(--tdiff-ink);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--tdiff-ink);
  color: var(--tdiff-ink);
  display: inline-flex;
  font-family: inherit;
  gap: 0.35rem;
  padding: 0.65rem 0.9rem;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.tdiff-button.primary {
  background: var(--link-color);
  color: var(--background-color);
}
.tdiff-button:hover {
  box-shadow: 1px 1px 0 var(--tdiff-ink);
  text-decoration: none;
  transform: translate(2px, 2px);
}
.tdiff-shot {
  border: 1.5px solid var(--heading-color);
  border-radius: 10px;
  margin: 1rem 0 2rem;
}
.tdiff-star {
  flex: 0 0 auto;
  height: 1em;
  width: 1em;
}
.tdiff-perspectives {
  margin: 0 0 2.5rem;
}
.tdiff-perspective {
  margin-top: 1.25rem;
}
.tdiff-perspective h3 {
  margin-top: 0;
}
.tdiff-card-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin: 1rem 0 1.5rem;
}
.tdiff-card {
  background: var(--background-color);
  border: 1.5px solid var(--heading-color);
  border-radius: 8px;
  box-shadow: 3px 3px 0 var(--heading-color);
  padding: 0.85rem;
}
.tdiff-card .mark {
  display: block;
  font-family: monospace;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}
.tdiff-card.add .mark {
  color: #1f7a35;
}
.tdiff-card.del .mark {
  color: #c0392b;
}
html[data-theme="dark"] .tdiff-card.add .mark {
  color: #8ce99a;
}
html[data-theme="dark"] .tdiff-card.del .mark {
  color: #ffa8a8;
}
.tdiff-card strong {
  display: block;
  margin-bottom: 0.25rem;
}
.tdiff-card p {
  margin: 0;
}
.tdiff-event-log {
  font-family: monospace;
  font-size: 0.86rem;
}
.tdiff-harness {
  background: #101418;
  border-radius: 8px;
  overflow: hidden;
}
.tdiff-event-log {
  background: #101418;
  color: #d6deeb;
  line-height: 1.05;
  margin: 0;
  overflow-x: hidden;
  padding: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.tdiff-event-log .tool-label {
  border: 1px solid #303844;
  border-radius: 4px;
  color: #d6deeb;
  margin-right: 0.45rem;
  padding: 0.05rem 0.35rem;
}
.tdiff-event-log .event-line {
  display: block;
  opacity: 0;
  transform: translateY(3px);
  white-space: pre-wrap;
}
.tdiff-event-log .tool-call {
  background: #171d24;
  border: 1px solid #303844;
  border-radius: 6px;
  color: #d6deeb;
  margin: 0.25rem 0 0.15rem;
  padding: 0.28rem 0.45rem;
}
.tdiff-event-log .tool-output {
  border-left: 2px solid #303844;
  color: #8a93a3;
  margin: 0.12rem 0 0.28rem 0.45rem;
  padding-left: 0.55rem;
}
.tdiff-event-log .agent-msg {
  color: #d6deeb;
  margin: 0.28rem 0;
}
.tdiff-harness.is-visible .event-line {
  animation: tdiff-stream-in 0.28s ease forwards;
  animation-delay: var(--delay, 0s);
}
.tdiff-event-log .event-line {
  color: #8a93a3;
}
.tdiff-event-log .thread-created .event-type {
  color: #bff3c9;
}
.tdiff-event-log .thread-replied .event-type {
  color: #8cc2dd;
}
.tdiff-event-log .status-changed .event-type {
  color: #ffd166;
}
.tdiff-event-log .review-approved .event-type {
  color: #c3f584;
}
.tdiff-event-log .agent-action {
  color: #d6deeb;
}
.tdiff-input-bar {
  align-items: center;
  border-top: 1px solid #303844;
  color: #d6deeb;
  display: flex;
  font-family: monospace;
  font-size: 0.86rem;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
}
.tdiff-spinner::before {
  content: "⠋";
}
.tdiff-harness.is-visible .tdiff-spinner::before {
  animation: tdiff-braille 0.72s steps(8) infinite;
}
.tdiff-check,
.tdiff-done-text {
  display: none;
}
.tdiff-harness.is-visible .tdiff-spinner,
.tdiff-harness.is-visible .tdiff-running-text {
  animation: tdiff-hide 0s 6.35s forwards;
}
.tdiff-harness.is-visible .tdiff-check,
.tdiff-harness.is-visible .tdiff-done-text {
  animation: tdiff-show 0s 6.35s forwards;
  display: inline;
  opacity: 0;
}
.tdiff-check {
  color: #c3f584;
}
@keyframes tdiff-stream-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes tdiff-braille {
  0% { content: "⠋"; }
  12.5% { content: "⠙"; }
  25% { content: "⠹"; }
  37.5% { content: "⠸"; }
  50% { content: "⠼"; }
  62.5% { content: "⠴"; }
  75% { content: "⠦"; }
  87.5% { content: "⠧"; }
  100% { content: "⠇"; }
}
@keyframes tdiff-hide {
  to { display: none; opacity: 0; }
}
@keyframes tdiff-show {
  to { opacity: 1; }
}
</style>

<section class="tdiff-hero">
  <div class="tdiff-eyebrow">tdiff ∓</div>
  <h1>Talk to your agent <span class="tdiff-diffmark">on the diff</span></h1>
  <p class="tdiff-lede">tdiff gives you a local diff review canvas where humans and coding agents talk directly on changed lines. Open a terminal review, leave feedback, and let your agent watch, reply, fix, or wait for approval.</p>
  <div class="tdiff-actions">
    <a class="tdiff-button primary" href="https://github.com/owenps/tdiff"><svg class="tdiff-star" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.193a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.981a.75.75 0 0 1-1.088-.79l.72-4.194-3.047-2.97a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>Star on GitHub</a>
    <a class="tdiff-button" href="#install">Install</a>
  </div>
</section>

<img class="tdiff-shot" src="https://raw.githubusercontent.com/owenps/tdiff/main/docs/assets/screenshots/main-ui.png" alt="tdiff terminal diff review UI">

<section class="tdiff-perspectives" aria-label="human and agent review loop">
  <h2>Built for feedback that agents can act on</h2>
  <div class="tdiff-card-grid">
    <div class="tdiff-card add">
      <span class="mark">+ thread</span>
      <strong>Review threads</strong>
      <p>Feedback attaches to exact lines/ranges in your local diff.</p>
    </div>
    <div class="tdiff-card add">
      <span class="mark">+ inbox</span>
      <strong>Agent inbox</strong>
      <p>Agents discover open review work without copy/paste.</p>
    </div>
    <div class="tdiff-card add">
      <span class="mark">+ reply</span>
      <strong>In-thread replies</strong>
      <p>Human and agent messages stay in one durable thread.</p>
    </div>
    <div class="tdiff-card add">
      <span class="mark">+ approve</span>
      <strong>Approval-aware</strong>
      <p>Agents can wait for approval before continuing work.</p>
    </div>
    <div class="tdiff-card add">
      <span class="mark">+ sync</span>
      <strong>GitHub sync</strong>
      <p>Pull PR review threads into the same local review.</p>
    </div>
    <div class="tdiff-card add">
      <span class="mark">+ events</span>
      <strong>Event stream</strong>
      <p>Agents watch review changes and react when state changes.</p>
    </div>
  </div>
  <div class="tdiff-perspective">
    <h3>Agent workflow</h3>
    <p>Agents watch the review stream, inspect JSON context when needed, reply in-thread, and continue after approval.</p>
    <div class="tdiff-harness">
      <pre class="tdiff-event-log"><span class="event-line tool-call" style="--delay: 0.05s"><span class="tool-label">tool</span>tdiff agent inbox --json</span>
<span class="event-line tool-output" style="--delay: 0.48s">[{"thread_id":"T42","actor":"owenps","path":"internal/review/gate.go","line_start":27,"line_end":29,"body":"approval should block on open threads"}]</span>
<span class="event-line agent-msg" style="--delay: 0.98s">new review thread T42 from owenps; inspecting context</span>
<span class="event-line tool-call" style="--delay: 1.42s"><span class="tool-label">tool</span>tdiff thread show T42 --json</span>
<span class="event-line tool-output" style="--delay: 1.88s">status=open target=internal/review/gate.go:27-29 body="approval should block on open threads"</span>
<span class="event-line tool-call" style="--delay: 2.38s"><span class="tool-label">tool</span>go test ./...</span>
<span class="event-line tool-output" style="--delay: 2.92s">ok ./...</span>
<span class="event-line tool-call" style="--delay: 3.36s"><span class="tool-label">tool</span>tdiff thread reply T42 --actor agent --body "Fixed; added regression test"</span>
<span class="event-line tool-output thread-replied" style="--delay: 3.96s">E179 <span class="event-type">thread.replied</span> thread_id=T42 actor=agent body_preview="Fixed; added regression test"</span>
<span class="event-line tool-call" style="--delay: 4.42s"><span class="tool-label">tool</span>tdiff thread resolve T42 --actor agent</span>
<span class="event-line tool-output status-changed" style="--delay: 4.98s">E180 <span class="event-type">thread.status_changed</span> thread_id=T42 actor=agent status=resolved</span>
<span class="event-line tool-call" style="--delay: 5.45s"><span class="tool-label">tool</span>tdiff review watch</span>
<span class="event-line tool-output review-approved" style="--delay: 6.12s">E181 <span class="event-type">review.approved</span> actor=owenps diff_hash=9f2c...</span>
<span class="event-line agent-msg" style="--delay: 6.68s">approval received; continuing task</span></pre>
      <div class="tdiff-input-bar" aria-label="agent input bar">
        <span class="tdiff-spinner" aria-hidden="true"></span>
        <span class="tdiff-running-text">tool running: tdiff agent inbox --json</span>
        <span class="tdiff-check" aria-hidden="true">✓</span>
        <span class="tdiff-done-text">review approved</span>
      </div>
    </div>
    <script>
      (function() {
        var logs = document.querySelectorAll('.tdiff-harness');
        if (!('IntersectionObserver' in window)) {
          logs.forEach(function(log) { log.classList.add('is-visible'); });
          return;
        }
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.35 });
        logs.forEach(function(log) { observer.observe(log); });
      })();
    </script>
  </div>
</section>

## Install {#install}

```
go install github.com/owenps/tdiff@latest && tdiff
```

Agent instructions live at:

```
tdiff agent help
```

[Read the README](https://github.com/owenps/tdiff) for keybinds and development notes.
