const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789#%&*+=/<>';
const LEAD = 180;
const STAGGER = 45;
const TICK = 40;
const LEAVE_DELAY = 100;
const RESET_DURATION = 200;

function noise(char) {
  if (/\s/u.test(char)) return char;
  const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  return char === char.toUpperCase() ? glyph.toUpperCase() : glyph;
}

// Add reveal="Other text" to reveal on hover/focus instead of on load.
// Call .scramble() to replay.
class ScrambleText extends HTMLElement {
  connectedCallback() {
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = () => {
      if (!this.motion.matches) return;
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
      this.finish();
      if (this.revealText !== null && !this.active) this.textContent = this.idleText;
    };
    this.motion.addEventListener('change', this.onMotionChange);
    this.idleText = this.textContent;
    this.revealText = this.getAttribute('reveal');
    if (this.revealText !== null) {
      // Reserve both labels' widths so the hover target never shrinks.
      this.style.width = `${Math.max([...this.idleText].length, [...this.revealText].length)}ch`;
      this.trigger = this.closest('a, button') || this;
      this.hovered = false;
      this.focused = this.trigger.contains(document.activeElement);
      this.active = false;
      this.update = () => {
        const active = this.hovered || this.focused;
        if (active === this.active) return;
        this.active = active;
        if (active) {
          const pendingReset = this.resetTimer != null;
          clearTimeout(this.resetTimer);
          this.resetTimer = null;
          // A brief pointer slip should not restart the reveal.
          if (!pendingReset) this.scramble();
        } else if (this.motion.matches) {
          this.finish();
          this.textContent = this.idleText;
        } else {
          this.resetTimer = setTimeout(() => {
            this.resetTimer = null;
            this.scramble(this.idleText, RESET_DURATION);
          }, LEAVE_DELAY);
        }
      };
      this.onEnter = () => { this.hovered = true; this.update(); };
      this.onLeave = () => { this.hovered = false; this.update(); };
      this.onFocus = () => { this.focused = true; this.update(); };
      this.onBlur = (event) => {
        this.focused = this.trigger.contains(event.relatedTarget);
        this.update();
      };
      this.trigger.addEventListener('pointerenter', this.onEnter);
      this.trigger.addEventListener('pointerleave', this.onLeave);
      this.trigger.addEventListener('focusin', this.onFocus);
      this.trigger.addEventListener('focusout', this.onBlur);
      this.update();
    } else {
      this.scramble();
    }
  }

  disconnectedCallback() {
    clearTimeout(this.resetTimer);
    this.resetTimer = null;
    this.finish();
    this.motion.removeEventListener('change', this.onMotionChange);
    if (this.trigger) {
      this.trigger.removeEventListener('pointerenter', this.onEnter);
      this.trigger.removeEventListener('pointerleave', this.onLeave);
      this.trigger.removeEventListener('focusin', this.onFocus);
      this.trigger.removeEventListener('focusout', this.onBlur);
      this.textContent = this.idleText;
      this.active = false;
    }
  }

  finish() {
    cancelAnimationFrame(this.frame);
    if (this.label) {
      this.replaceChildren(document.createTextNode(this.label.textContent));
      this.label = null;
    }
  }

  scramble(text, duration) {
    this.finish();
    if (!this.isConnected) return;
    text ??= this.revealText ?? this.textContent;
    this.textContent = text;
    if (this.motion.matches || !text.trim()) return;
    const chars = [...text];
    const idle = [...this.idleText];
    // Keep the shared prefix settled; only decode the changing suffix.
    let prefix = 0;
    if (this.revealText !== null) {
      const revealed = [...this.revealText];
      while (prefix < idle.length && idle[prefix] === revealed[prefix]) prefix++;
    }
    const current = chars.map(noise);
    // The real label stays accessible and reserves the final dimensions.
    this.label = document.createElement('span');
    this.label.className = 'scramble-text__label';
    this.label.textContent = text;
    const visual = document.createElement('span');
    visual.className = 'scramble-text__visual';
    visual.setAttribute('aria-hidden', 'true');
    const done = document.createTextNode('');
    const cursor = document.createElement('span');
    cursor.className = 'scramble-text__cursor';
    const ahead = document.createElement('span');
    ahead.className = 'scramble-text__ahead';
    visual.append(done, cursor, ahead);
    this.replaceChildren(this.label, visual);

    const start = performance.now();
    let lastTick = start;
    let lastHead = -1;
    const step = (now) => {
      const elapsed = now - start;
      const refresh = now - lastTick >= TICK;
      if (refresh) lastTick = now;
      const head = chars.findIndex((char, i) => {
        const settleAt = duration === undefined
          ? LEAD + (i - prefix) * STAGGER
          : duration * (i - prefix + 1) / (chars.length - prefix);
        return i >= prefix && !/\s/u.test(char) && elapsed < settleAt;
      });
      if (head === -1) {
        this.finish();
        return;
      }
      if (refresh) chars.forEach((char, i) => { current[i] = noise(char); });
      if (refresh || head !== lastHead) {
        lastHead = head;
        done.data = chars.slice(0, head).join('');
        ahead.textContent = current.slice(head + 1).join('');
      }
      this.frame = requestAnimationFrame(step);
    };
    step(start);
  }
}

if (!customElements.get('scramble-text')) {
  customElements.define('scramble-text', ScrambleText);
}
