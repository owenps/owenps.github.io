const initialized = new WeakSet();
const records = new Set();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const GAP = 10;
const GUTTER = 8;
const controls = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';
let active = null;
let suppressFocus = false;

function tabbables(root) {
  return [...root.querySelectorAll(controls)].filter(element =>
    element.tabIndex >= 0 && !element.disabled && !element.closest('[inert]') &&
    element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
}

function containsFocus(record) {
  return record.trigger === document.activeElement || record.card.contains(document.activeElement);
}

function stop(record) {
  clearTimeout(record.timer);
  clearTimeout(record.focusTimer);
  cancelAnimationFrame(record.frame);
  record.frame = 0;
  record.lastTime = 0;
  record.animation?.cancel();
  record.animation = null;
}

function hide(record) {
  if (record.native && record.card.matches(':popover-open')) record.card.hidePopover();
  record.card.hidden = true;
}

function close(record = active, restore = false, immediate = false) {
  if (!record) return;
  stop(record);
  if (active === record) active = null;
  record.pinned = false;
  record.trigger.setAttribute('aria-expanded', 'false');
  record.observer?.disconnect();
  for (const video of record.card.querySelectorAll('video')) video.pause();
  if (restore && record.card.contains(document.activeElement)) {
    suppressFocus = true;
    record.trigger.focus({ preventScroll: true });
    suppressFocus = false;
  }
  if (immediate || reducedMotion.matches || !record.surface.animate) {
    hide(record);
    return;
  }
  const animation = record.surface.animate([
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    { opacity: 0, transform: 'scale(.96)', filter: 'blur(2px)' }
  ], { duration: 120, easing: 'ease-out', fill: 'forwards' });
  record.animation = animation;
  animation.finished.then(() => {
    if (record.animation !== animation) return;
    hide(record);
    animation.cancel();
    record.animation = null;
  }).catch(() => {});
}

function paint(record) {
  const width = record.card.offsetWidth;
  const height = record.card.offsetHeight;
  const radians = record.angle * Math.PI / 180;
  const halfWidth = (Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height) / 2;
  const halfHeight = (Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height) / 2;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  // A very tall preview may have no room to rotate safely.
  if (record.angle !== 0 && (halfWidth * 2 > viewportWidth - GUTTER * 2 || halfHeight * 2 > viewportHeight - GUTTER * 2)) {
    record.angle = 0;
    record.angularVelocity = 0;
    return paint(record);
  }
  const centerX = Math.max(GUTTER + halfWidth, Math.min(viewportWidth - GUTTER - halfWidth, record.x + width / 2));
  const centerY = Math.max(GUTTER + halfHeight, Math.min(viewportHeight - GUTTER - halfHeight, record.y + height / 2));
  const originY = record.above ? height : 0;
  const offsetY = height / 2 - originY;
  const rotatedCenterX = width / 2 - Math.sin(radians) * offsetY;
  const rotatedCenterY = originY + Math.cos(radians) * offsetY;
  record.card.style.transformOrigin = record.above ? '50% 100%' : '50% 0%';
  record.card.style.transform = `translate3d(${centerX - rotatedCenterX}px, ${centerY - rotatedCenterY}px, 0) rotate(${record.angle}deg)`;
}

function tick(record, time) {
  record.frame = 0;
  if (active !== record) return;
  const elapsed = record.lastTime ? Math.min((time - record.lastTime) / 1000, .032) : 1 / 60;
  record.lastTime = time;
  // Small integration steps keep the springs stable across slow frames.
  const steps = Math.ceil(elapsed / .008);
  const dt = elapsed / steps;
  for (let i = 0; i < steps; i++) {
    record.velocity += ((260 * (record.targetX - record.x) - 26 * record.velocity) / .6) * dt;
    record.x += record.velocity * dt;
    const tilt = Math.max(-7, Math.min(7, -record.velocity / 1400 * 7));
    record.angularVelocity += (400 * (tilt - record.angle) - 30 * record.angularVelocity) * dt;
    record.angle = Math.max(-7, Math.min(7, record.angle + record.angularVelocity * dt));
  }
  paint(record);
  if (Math.abs(record.targetX - record.x) > .05 || Math.abs(record.velocity) > .05 ||
      Math.abs(record.angle) > .01 || Math.abs(record.angularVelocity) > .05) {
    record.frame = requestAnimationFrame(time => tick(record, time));
  } else {
    record.x = record.targetX;
    record.angle = 0;
    record.lastTime = 0;
    paint(record);
  }
}

function place(record, jump = false) {
  if (active !== record) return;
  const rect = record.trigger.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  if (rect.bottom <= 0 || rect.top >= vh || rect.right <= 0 || rect.left >= vw) {
    close(record, false, true);
    return;
  }
  const above = Math.max(0, rect.top - GAP - GUTTER);
  const below = Math.max(0, vh - rect.bottom - GAP - GUTTER);
  const desiredHeight = record.surface.scrollHeight + record.surface.offsetHeight - record.surface.clientHeight;
  record.above = desiredHeight <= above || above >= below;
  const available = record.above ? above : below;
  record.surface.style.boxSizing = 'border-box';
  record.surface.style.maxHeight = `${Math.max(1, Math.min(vh - 2 * GUTTER, available))}px`;
  record.surface.style.overflowY = 'auto';
  const width = record.card.offsetWidth;
  const height = record.card.offsetHeight;
  const cursor = record.mode === 'cursor' && !reducedMotion.matches;
  const center = cursor ? record.pointerX : rect.left + rect.width / 2;
  record.targetX = Math.max(GUTTER, Math.min(vw - GUTTER - width, center - width / 2));
  record.y = record.above ? rect.top - GAP - height : rect.bottom + GAP;
  record.surface.style.transformOrigin = record.above ? '50% 100%' : '50% 0%';
  if (jump || !cursor) {
    cancelAnimationFrame(record.frame);
    record.frame = 0;
    record.lastTime = 0;
    record.x = record.targetX;
    record.velocity = record.angle = record.angularVelocity = 0;
    paint(record);
  } else if (!record.frame) {
    record.frame = requestAnimationFrame(time => tick(record, time));
  }
}

function open(record, mode, pointerX) {
  clearTimeout(record.timer);
  if (active === record) {
    if (mode === 'anchor') {
      record.mode = 'anchor';
      place(record, true);
    }
    return;
  }
  if (active) close(active, false, true);
  // Finish any other preview's pending exit before showing this one.
  for (const other of records) {
    if (other !== record && other.animation) {
      stop(other);
      hide(other);
    }
  }
  stop(record);
  active = record;
  record.overCard = false;
  record.mode = reducedMotion.matches ? 'anchor' : mode;
  record.pointerX = pointerX ?? record.trigger.getBoundingClientRect().left;
  record.card.hidden = false;
  if (record.native) record.card.showPopover();
  record.trigger.setAttribute('aria-expanded', 'true');
  place(record, true);
  if (active !== record) return;
  record.observer?.observe(record.surface);
  record.observer?.observe(record.body);
  for (const video of record.card.querySelectorAll('video')) {
    if (!reducedMotion.matches) video.play().catch(() => {});
  }
  if (!reducedMotion.matches && record.surface.animate) {
    const animation = record.surface.animate([
      { opacity: 0, transform: `translateY(${record.above ? 6 : -6}px) scale(.88)`, filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
    ], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' });
    record.animation = animation;
    animation.finished.then(() => {
      if (record.animation === animation) record.animation = null;
    }).catch(() => {});
  }
}

function delayClose(record) {
  clearTimeout(record.timer);
  if (record.pinned || (record.mode === 'anchor' && containsFocus(record))) return;
  record.timer = setTimeout(() => {
    if (active === record && !record.overTrigger && !record.overCard && !record.pinned) close(record);
  }, 150);
}

function onKeydown(event) {
  const record = active;
  if (!record) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close(record, true);
    return;
  }
  const focused = document.activeElement;
  if (event.key !== 'Tab' || (focused !== record.trigger && !record.card.contains(focused))) return;
  const inner = tabbables(record.card);
  let destination;
  if ((focused === record.trigger || focused === record.card) && !event.shiftKey && inner.length) destination = inner[0];
  else if (event.shiftKey && (focused === inner[0] || focused === record.card)) destination = record.trigger;
  else if (!event.shiftKey && (focused === inner.at(-1) || focused === record.card)) {
    const regular = tabbables(document).filter(element => !record.card.contains(element));
    destination = regular[regular.indexOf(record.trigger) + 1];
    if (!destination) {
      // Let the browser leave the document naturally from the trigger's position.
      suppressFocus = true;
      record.trigger.focus({ preventScroll: true });
      suppressFocus = false;
      close(record, false, true);
      return;
    }
  }
  if (destination) {
    event.preventDefault();
    destination.focus();
  } else if (focused === record.trigger) close(record);
}

export function initHoverCards(root = document) {
  const triggers = [...root.querySelectorAll('.hover-card-trigger')];
  if (root.matches?.('.hover-card-trigger')) triggers.unshift(root);
  for (const trigger of triggers) {
    if (initialized.has(trigger)) continue;
    const id = trigger.getAttribute('aria-controls');
    const template = id && document.getElementById(`${id}-template`);
    const original = template?.content?.firstElementChild;
    if (!original) continue;
    const card = original.cloneNode(true);
    const surface = card.querySelector('.hover-card-surface');
    const body = card.querySelector('.hover-card-body');
    if (!surface || !body) continue;
    initialized.add(trigger);
    const native = typeof card.showPopover === 'function';
    if (!native) {
      card.removeAttribute('popover');
      card.style.zIndex = '1000';
    }
    card.hidden = true;
    Object.assign(card.style, { position: 'fixed', inset: 'auto', top: '0', left: '0', margin: '0',
      maxWidth: 'calc(100vw - 16px)', transformOrigin: '50% 50%' });
    document.body.append(card);
    const record = { trigger, card, surface, body, native, pinned: false, frame: 0,
      velocity: 0, angle: 0, angularVelocity: 0, overTrigger: false, overCard: false };
    records.add(record);
    if (typeof ResizeObserver !== 'undefined') record.observer = new ResizeObserver(() => place(record));
    card.addEventListener('load', () => place(record), true);
    if (trigger.tagName === 'BUTTON') trigger.disabled = false;
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      record.overTrigger = true;
      open(record, 'cursor', event.clientX);
    });
    trigger.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || active !== record || record.mode !== 'cursor' || record.pinned) return;
      record.pointerX = event.clientX;
      place(record);
    });
    trigger.addEventListener('pointerleave', () => {
      record.overTrigger = false;
      delayClose(record);
    });
    trigger.addEventListener('pointerdown', event => { record.touch = event.pointerType === 'touch'; });
    trigger.addEventListener('pointercancel', () => {
      record.touch = false;
      record.overTrigger = false;
      if (active === record && !record.pinned) close(record);
    });
    trigger.addEventListener('click', event => {
      const touch = record.touch || event.pointerType === 'touch';
      record.touch = false;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (trigger.tagName === 'A') {
        if (!touch || (active === record && record.pinned)) return;
        event.preventDefault();
      } else if (active === record && record.pinned) {
        close(record);
        return;
      }
      open(record, 'anchor');
      record.pinned = true;
    });
    trigger.addEventListener('focus', () => {
      if (!suppressFocus && trigger.matches(':focus-visible')) open(record, 'anchor');
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open(record, 'anchor');
        card.focus({ preventScroll: true });
      }
    });
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      record.overCard = true;
      clearTimeout(record.timer);
      cancelAnimationFrame(record.frame);
      record.frame = 0;
      record.lastTime = 0;
      record.pointerX = record.x + card.offsetWidth / 2;
      record.targetX = record.x;
      record.velocity = record.angularVelocity = record.angle = 0;
      if (active === record) paint(record);
    });
    card.addEventListener('pointerleave', () => {
      record.overCard = false;
      delayClose(record);
    });
    card.addEventListener('focusin', () => {
      if (active === record) {
        record.mode = 'anchor';
        clearTimeout(record.timer);
        place(record, true);
      }
    });
    const focusOut = () => {
      clearTimeout(record.focusTimer);
      record.focusTimer = setTimeout(() => {
        if (active === record && !containsFocus(record)) close(record);
      }, 0);
    };
    trigger.addEventListener('focusout', focusOut);
    card.addEventListener('focusout', focusOut);
  }
}

document.addEventListener('keydown', onKeydown);
document.addEventListener('pointerdown', event => {
  if (active && !active.trigger.contains(event.target) && !active.card.contains(event.target)) close(active);
}, true);
window.addEventListener('resize', () => { if (active) place(active); }, { passive: true });
document.addEventListener('scroll', event => {
  if (active && !active.card.contains(event.target)) place(active);
}, { capture: true, passive: true });
reducedMotion.addEventListener('change', () => {
  if (active) {
    for (const video of active.card.querySelectorAll('video')) {
      if (reducedMotion.matches) video.pause();
      else video.play().catch(() => {});
    }
    active.animation?.cancel();
    active.animation = null;
    place(active, true);
  }
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initHoverCards(), { once: true });
else initHoverCards();
