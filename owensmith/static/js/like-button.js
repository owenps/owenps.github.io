(() => {
  const button = document.querySelector('.like-button');
  if (!button) return;

  const heart = button.querySelector('.like-heart path');
  const effects = button.querySelector('.like-effects');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  let scaleAnimation;
  let pressed = false;

  function currentScale() {
    return new DOMMatrixReadOnly(getComputedStyle(heart).transform).a;
  }

  function scale(frames, duration, easing = easeOut) {
    if (reduceMotion.matches) return;
    scaleAnimation?.cancel();
    const animation = heart.animate(
      frames.map(value => ({ transform: `scale(${value})` })),
      { duration, easing, fill: 'forwards' },
    );
    scaleAnimation = animation;
    if (frames[frames.length - 1] === 1) {
      animation.onfinish = () => animation.cancel();
    }
  }

  function settle() {
    scale([currentScale(), 1], 300);
  }

  // Keep the pop and first dip, but stop at rest before the tiny late rebounds.
  function spring(from, velocity, damping) {
    const decay = damping / 2;
    const frequency = Math.sqrt(500 - decay * decay);
    const displacement = from - 1;
    const kick = (velocity + decay * displacement) / frequency;
    const frames = [];
    let peaked = velocity < 0;
    let dipped = false;
    for (let i = 0; i <= 36; i++) {
      const t = i / 60;
      const value = 1 + Math.exp(-decay * t) * (
        displacement * Math.cos(frequency * t) + kick * Math.sin(frequency * t)
      );
      if (value > 1) peaked = true;
      if (peaked && value < 1) dipped = true;
      frames.push(value);
      if (dipped && value >= 1) break;
    }
    frames[frames.length - 1] = 1;
    scale(frames, (frames.length - 1) * 1000 / 60, 'linear');
  }

  function burst() {
    const group = document.createElement('span');
    group.className = 'like-burst';
    effects.append(group);
    const ring = document.createElement('span');
    ring.className = 'like-ring';
    group.append(ring);
    ring.animate([
      { transform: 'scale(0.6)', opacity: 0.6 },
      { transform: 'scale(1.8)', opacity: 0 },
    ], { duration: 350, easing: easeOut, fill: 'forwards' });

    const offset = Math.random() * 360;
    for (let i = 0; i < 7; i++) {
      const angle = (offset + i * 360 / 7 + (Math.random() - 0.5) * 20) * Math.PI / 180;
      const distance = 18 + Math.random() * 6;
      const size = Math.random() < 0.5 ? 4 : 3;
      const particle = document.createElement('span');
      particle.className = 'like-particle';
      particle.style.width = particle.style.height = `${size}px`;
      particle.style.margin = `${-size / 2}px`;
      group.append(particle);
      const transform = (radius, size) =>
        `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(${size})`;
      const flight = particle.animate([
        { transform: transform(6, 1) },
        { transform: transform(distance, 0.4) },
      ], { duration: 450, delay: 40, easing: easeOut, fill: 'both' });
      particle.animate([{ opacity: 1 }, { opacity: 1 }, { opacity: 0 }], {
        duration: 450, delay: 40, fill: 'both',
      });
      if (i === 0) flight.onfinish = () => group.remove();
    }
  }

  function release() {
    if (!pressed) return;
    pressed = false;
    settle();
  }

  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    pressed = true;
    const liked = button.getAttribute('aria-pressed') === 'true';
    scale([currentScale(), liked ? 0.9 : 0.8], 100);
  });
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('blur', release);
  window.addEventListener('pointerup', event => {
    if (!button.contains(event.target)) release();
  });

  button.addEventListener('click', () => {
    const liked = button.getAttribute('aria-pressed') !== 'true';
    const fromPointer = pressed;
    pressed = false;
    button.setAttribute('aria-pressed', String(liked));
    if (reduceMotion.matches) return;
    if (liked) {
      spring(fromPointer ? currentScale() : 0.8, 11, 20);
      burst();
    } else if (fromPointer) {
      settle();
    } else {
      spring(currentScale(), -3, 30);
    }
  });

  reduceMotion.addEventListener('change', () => {
    if (!reduceMotion.matches) return;
    pressed = false;
    button.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    effects.replaceChildren();
  });
})();
