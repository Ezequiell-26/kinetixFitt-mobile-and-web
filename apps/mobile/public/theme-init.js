(function () {
  try {
    var theme = localStorage.getItem("ec-theme") || "dark";
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
  } catch (_) {}
})();
