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

    // Services dropdown: on touch screens (no hover) the first tap opens the
    // menu instead of following the link; Escape closes it.
    var dropdown = menu.querySelector('.nav-dropdown');
    var trigger = dropdown && dropdown.querySelector('.nav-dropdown-trigger');
    if (dropdown && trigger) {
      var noHover = window.matchMedia('(hover: none)');
      trigger.addEventListener('click', function (e) {
        if (window.innerWidth <= 600 || !noHover.matches) return;
        if (!dropdown.classList.contains('open')) {
          e.preventDefault();
          e.stopPropagation();
          dropdown.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      document.addEventListener('click', function (e) {
        if (dropdown.classList.contains('open') && !dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && dropdown.contains(document.activeElement)) {
          dropdown.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
          trigger.blur();
        }
      });
    }

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
