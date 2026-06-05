// Mobile hamburger menu toggle (shared across all pages)
(function () {
  function init() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('primary-nav');
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('open');
      menu.classList.toggle('open', willOpen);
      toggle.classList.toggle('open', willOpen);
      toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    // close when a link is tapped
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    // close when tapping outside the menu
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
        close();
      }
    });

    // close if the viewport grows back to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 600) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
