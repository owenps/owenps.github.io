/*
 * Adapted from https://github.com/tijnjh/ios-haptics
 * MIT License — Copyright (c) 2025 tijn
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

export function addHaptics(button) {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios || button.querySelector("[data-haptic-trigger]")) return;

  // A real label tap activates Safari's native switch haptic; scripted toggles don't.
  const label = document.createElement("label");
  label.dataset.hapticTrigger = "";
  label.setAttribute("aria-hidden", "true");
  Object.assign(label.style, { position: "absolute", inset: "0", touchAction: "manipulation" });
  label.style.setProperty("-webkit-tap-highlight-color", "transparent");

  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.setAttribute("switch", "");
  toggle.tabIndex = -1;
  // Keep the switch out from under the finger so swipes can still scroll.
  Object.assign(toggle.style, {
    position: "absolute", width: "1px", height: "1px", margin: "0", visibility: "hidden",
  });
  toggle.addEventListener("click", (event) => event.stopPropagation());
  label.addEventListener("click", (event) => {
    if (button.matches(":disabled")) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Tapping the label doesn't activate its parent submit button. Submit after
  // the switch changes, before the form disables its fields for the request.
  if (button.type === "submit") {
    toggle.addEventListener("change", () => {
      if (!button.matches(":disabled")) button.form?.requestSubmit(button);
    });
  }

  label.append(toggle);
  if (getComputedStyle(button).position === "static") button.style.position = "relative";
  button.append(label);
}
