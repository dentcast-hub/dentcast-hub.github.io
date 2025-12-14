/* ==================================================
   DentCast Global Search — JS (Universal)
================================================== */
(function () {
  const globalBox = document.getElementById("dcGlobalBox");
  const searchCard = document.getElementById("card-search");
  const resultsBox = document.getElementById("dcResults");

  if (!globalBox || !searchCard) return;

  function openSearch() {
    globalBox.classList.add("open");
    searchCard.classList.add("active-toggle");

    const input = globalBox.querySelector(".dc-search-input");
    if (input) setTimeout(() => input.focus(), 200);
  }

  function closeSearch() {
    globalBox.classList.remove("open");
    searchCard.classList.remove("active-toggle");
    if (resultsBox) resultsBox.style.display = "none";
  }

  // بستن با دکمه ضربدر
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("dc-close-results")) {
      closeSearch();
    }
  }, true);

  // اکسپورت گلوبال
  window.dcSearch = {
    open: openSearch,
    close: closeSearch
  };
})();
