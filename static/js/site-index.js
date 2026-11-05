const dialogs = new Map();

for (const opener of document.querySelectorAll("[data-dialog-open]")) {
  const dialog = document.getElementById(opener.dataset.dialogOpen);
  if (!dialog || typeof dialog.showModal !== "function") continue;

  if (!dialogs.has(dialog)) dialogs.set(dialog, []);
  const openers = dialogs.get(dialog);
  openers.push(opener);

  opener.hidden = false;
  opener.setAttribute("aria-haspopup", "dialog");
  opener.setAttribute("aria-controls", dialog.id);
  opener.setAttribute("aria-expanded", "false");

  if (dialog.id === "site-index") {
    const fallback = document.querySelector("[data-index-fallback]");
    if (fallback) fallback.hidden = true;
  }

  opener.addEventListener("click", (event) => {
    if (opener.tagName === "A" && (event.button !== 0 || event.metaKey
      || event.ctrlKey || event.shiftKey || event.altKey)) return;

    event.preventDefault();
    if (!dialog.open) dialog.showModal();
    for (const control of openers) control.setAttribute("aria-expanded", "true");
  });
}

for (const [dialog, openers] of dialogs) {
  for (const button of dialog.querySelectorAll("[data-dialog-close]")) {
    button.addEventListener("click", () => dialog.close());
  }

  dialog.addEventListener("close", () => {
    for (const opener of openers) opener.setAttribute("aria-expanded", "false");
  });

  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom) {
      dialog.close();
    }
  });
}

if (dialogs.size) {
  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (!event.matches) return;
    for (const dialog of dialogs.keys()) {
      if (dialog.open) dialog.close();
    }
  });
}
