import { addHaptics } from "./haptics.js";
import { hideToast, showToast } from "./toast.js";

(() => {
  if (!navigator.clipboard?.writeText) return;

  document.querySelectorAll("[data-copy]").forEach((control) => {
    const button = control.querySelector(".copy-button");
    const status = control.querySelector(".copy-status");
    let timer;
    let pending = false;

    button.disabled = false;
    addHaptics(button);
    const symbols = control.querySelector(".copy-symbols");
    if (symbols) symbols.hidden = false;
    button.addEventListener("click", async () => {
      if (pending) return;
      pending = true;
      clearTimeout(timer);
      delete control.dataset.copyState;
      status.textContent = "";
      hideToast();

      try {
        await navigator.clipboard.writeText(control.dataset.copy);
        control.dataset.copyState = "success";
        showToast("Copied to clipboard", 2000);
      } catch {
        control.dataset.copyState = "error";
        status.textContent = "Couldn't copy. Select the text to copy it manually.";
      } finally {
        pending = false;
        timer = setTimeout(() => {
          delete control.dataset.copyState;
          status.textContent = "";
        }, control.dataset.copyState === "success" ? 1500 : 4000);
      }
    });
  });
})();
