document.addEventListener("click", (event) => {
  const reveal = event.target.closest(".image-reveal");
  if (reveal) {
    reveal.focus({ preventScroll: true });
    return;
  }

  const focused = document.activeElement;
  if (focused?.matches(".image-reveal")) focused.blur();
});
