const $ = (selector) => {
  return document.querySelector(selector);
};

function next() {
  var inner;
  if ($(".hide")) {
    inner = $(".hide").innerHTML;
    $(".hide").remove();
  }

  /* Step */

  if ($(".prev")) {
    $(".prev").classList.add("hide");
    $(".prev").classList.remove("prev");
  }

  $(".curr").classList.add("prev");
  $(".curr").classList.remove("curr");

  $(".next").classList.add("curr");
  $(".next").classList.remove("next");

  /* New Next */

  $(".new-next").classList.remove("new-next");

  const addedEl = document.createElement("li");

  $(".caro").appendChild(addedEl);
  addedEl.classList.add("next", "new-next");
  addedEl.innerHTML = inner;
}

function prev() {
  var inner;
  inner = $(".new-next").innerHTML;
  $(".new-next").remove();

  /* Step */

  $(".next").classList.add("new-next");

  $(".curr").classList.add("next");
  $(".curr").classList.remove("curr");

  $(".prev").classList.add("curr");
  $(".prev").classList.remove("prev");

  /* New Prev */

  $(".hide").classList.add("prev");
  $(".hide").classList.remove("hide");

  const addedEl = document.createElement("li");

  $(".caro").insertBefore(addedEl, $(".caro").firstChild);
  addedEl.classList.add("hide");
  addedEl.innerHTML = inner;
}

slide = (element) => {
  /* Next slide */

  if (
    element.classList.contains("next") ||
    element.parentElement.classList.contains("next")
  ) {
    next();

    /* Previous slide */
  } else if (
    element.classList.contains("prev") ||
    element.parentElement.classList.contains("prev")
  ) {
    prev();
  }
};

const slider = $(".caro");
var projects = document.getElementsByClassName("caro");

slider.onclick = (event) => {
  slide(event.target);
};
