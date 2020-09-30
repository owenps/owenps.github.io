// Get the modal
var c_modal = document.getElementById("contactModal");
var a_modal = document.getElementById("aboutModal");

// Get the button that opens the modal
var c_btn = document.getElementById("contact");
var a_btn = document.getElementById("about");
// Get the <span> element that closes the modal
var c_span = document.getElementsByClassName("close")[0];
var a_span = document.getElementsByClassName("close")[1];
// When the user clicks on the button, open the modal
c_btn.onclick = function () {
  c_modal.style.display = "block";
};
a_btn.onclick = function () {
  a_modal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
c_span.onclick = function () {
  c_modal.style.display = "none";
};
a_span.onclick = function () {
  a_modal.style.display = "none";
};
// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == c_modal) {
    c_modal.style.display = "none";
  }
  if (event.target == a_modal) {
    a_modal.style.display = "none";
  }
};
