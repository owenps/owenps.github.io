const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-atomic", "true");
const icon = document.createElement("span");
icon.className = "toast-icon";
icon.setAttribute("aria-hidden", "true");
icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="lucide lucide-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
const text = document.createElement("span");
text.className = "toast-message";
toast.append(icon, text);
document.body.append(toast);
let timer;

export function hideToast() {
  clearTimeout(timer);
  delete toast.dataset.visible;
}

export function showToast(message, duration = 5000) {
  clearTimeout(timer);
  text.textContent = message;
  toast.dataset.visible = "true";
  timer = setTimeout(hideToast, duration);
}
