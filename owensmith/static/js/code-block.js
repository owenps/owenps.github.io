for (const block of document.querySelectorAll('[data-code-block]')) {
  // Headerless groups keep every file readable, without inaccessible tabs.
  if (!block.querySelector('.code-block-header')) continue;
  const tabs = [...block.querySelectorAll('[role="tab"]')];
  const panels = [...block.querySelectorAll('.code-panel')];
  const copy = block.querySelector('.code-copy');
  const status = copy.querySelector('[role="status"]');
  let active = 0;
  let attempt = 0;
  let timer;

  function feedback(state, message = '') {
    clearTimeout(timer);
    copy.dataset.status = state;
    status.textContent = message;
    if (state !== 'idle') timer = setTimeout(() => feedback('idle'), 1600);
  }

  function select(index) {
    active = index;
    attempt++;
    feedback('idle');
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].dataset.selected = String(selected);
      panels[i].inert = !selected;
      panels[i].setAttribute('aria-hidden', String(!selected));
      panels[i].tabIndex = selected ? 0 : -1;
    });
  }

  tabs.forEach((tab, i) => {
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      const target = step !== undefined
        ? (i + step + tabs.length) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (target === null) return;
      event.preventDefault();
      select(target);
      tabs[target].focus();
    });
  });

  copy.addEventListener('click', async () => {
    const current = ++attempt;
    const source = panels[active].dataset.code;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(source);
      if (current === attempt) feedback('copied', 'Copied');
    } catch {
      if (current === attempt) feedback('failed', "Couldn't copy");
    }
  });

  select(0);
  block.dataset.enhanced = '';
  if (tabs.length) block.querySelector('[role="tablist"]').hidden = false;
  copy.hidden = false;
}
