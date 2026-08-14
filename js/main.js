// Synergy Deals Limited — shared site behavior (mobile nav, reveal animation, contact form UI).

document.addEventListener('DOMContentLoaded', function () {
  // Mobile menu toggle
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      var isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll-reveal animation
  var revealEls = document.querySelectorAll('.fade-in-up');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // Footer year
  var yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Contact form: front-end only for now.
  // TODO: wire this up to a real backend / email service (e.g. Formspree, EmailJS, or a custom API endpoint).
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = contactForm.querySelector('#name');
      var message = contactForm.querySelector('#message');
      var email = contactForm.querySelector('#email');
      var isValid = true;

      [name, email, message].forEach(function (field) {
        if (field && !field.value.trim()) {
          field.classList.add('border-red-400');
          isValid = false;
        } else if (field) {
          field.classList.remove('border-red-400');
        }
      });

      var statusEl = document.getElementById('form-status');
      if (!isValid) {
        if (statusEl) {
          statusEl.textContent = 'Please fill in your name, email, and requirement before sending.';
          statusEl.className = 'mt-4 text-sm font-medium text-red-600';
        }
        return;
      }

      // No backend wired up yet — show a confirmation and reset the form.
      if (statusEl) {
        statusEl.textContent =
          "Thank you! Your message has been noted. Our team will get back to you shortly. (Note: this form is not yet connected to email delivery.)";
        statusEl.className = 'mt-4 text-sm font-medium text-emerald-600';
      }
      contactForm.reset();
    });
  }
});
