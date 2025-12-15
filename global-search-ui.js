/* ==================================================
   DentCast Global Search — JS (Universal / Safe)
================================================== */
(function () {
  const globalBox = document.getElementById("dcGlobalBox");
  const resultsBox = document.getElementById("dcResults");
  const searchCard = document.getElementById("card-search"); // ممکن است نباشد

  if (!globalBox) return; // فقط این حیاتی است

  function openSearch() {
    globalBox.classList.add("open");
    document.body.classList.add("search-open");
    if (searchCard) {
      searchCard.classList.add("active-toggle");
    }

    const input = globalBox.querySelector(".dc-search-input");
    if (input) {
      setTimeout(() => input.focus(), 200);
    }
  }

  function closeSearch() {
    globalBox.classList.remove("open");
document.body.classList.remove("search-open");
    if (searchCard) {
      searchCard.classList.remove("active-toggle");
    }

    if (resultsBox) {
      resultsBox.style.display = "none";
      resultsBox.innerHTML = "";
    }
  }

  // بستن با دکمه ضربدر
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("dc-close-results")) {
      closeSearch();
    }
  }, true);

  // API گلوبال
  window.dcSearch = {
    open: openSearch,
    close: closeSearch,
    toggle() {
      globalBox.classList.toggle("open");
    }
  };
})();
