/* ============================================================
   NETAUDIENCE — main.js
   Hamburger, reveal au scroll, compteurs KPI, accordéon FAQ, année,
   formulaires contact et analyse IA.
   ============================================================ */

document.documentElement.classList.add('js');

/* ---------- Menu mobile ---------- */
(function () {
  var burger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');
  if (!burger || !mobileNav) return;

  burger.addEventListener('click', function () {
    var open = mobileNav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });
})();

/* ---------- Reveal au scroll (une seule fois) ---------- */
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(function (el) { io.observe(el); });
})();

/* ---------- Compteurs KPI ---------- */
(function () {
  var numbers = document.querySelectorAll('.kpi-number[data-target]');
  if (!numbers.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  function animate(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var finalText = el.textContent;
    var duration = 900;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = finalText;
      }
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  numbers.forEach(function (el) { io.observe(el); });
})();

/* ---------- Accordéon FAQ ---------- */
(function () {
  var questions = document.querySelectorAll('.faq-question');
  if (!questions.length) return;

  questions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var answer = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (answer) answer.classList.toggle('open', !expanded);
    });
  });
})();

/* ---------- Année courante ---------- */
(function () {
  var el = document.querySelector('.current-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- Lightbox ---------- */
(function () {
  var triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Image agrandie');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Fermer');
  closeBtn.textContent = '×';

  var img = document.createElement('img');
  img.className = 'lightbox-img';

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  function close() { overlay.hidden = true; }
  overlay.addEventListener('click', function (e) {
    if (e.target !== img) close();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  triggers.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      img.src = a.href;
      img.alt = (a.querySelector('img') || {}).alt || '';
      overlay.hidden = false;
    });
  });
})();

/* ---------- Endpoint unique (Formspree) ---------- */
var FORM_ENDPOINT = 'https://formspree.io/f/mkoqlddd';

/* ---------- Formulaire contact ---------- */
(function () {
  var form = document.querySelector('.contact-form form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    var data = { form_name: 'contact' };
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.reset();
      showStatus(form, 'success', 'Message envoyé. Nous vous recontactons sous 24 h.');
    })
    .catch(function () {
      showStatus(form, 'error', 'Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.');
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = old;
    });
  });

  function showStatus(f, type, msg) {
    var el = f.parentElement.querySelector('.form-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-status';
      f.parentElement.appendChild(el);
    }
    el.className = 'form-status form-status--' + type;
    el.textContent = msg;
  }
})();

/* ---------- Formulaire analyse IA ---------- */
(function () {
  var form = document.querySelector('.geo-tool-form--analyse');
  if (!form) return;

  var siteInput = form.querySelector('input[name="site"]');
  var emailInput = form.querySelector('input[name="email"]');
  var confirmation = form.parentElement.querySelector('.geo-tool-confirmation');

  function clearError(input) {
    input.classList.remove('field-error');
    var msg = input.parentElement.querySelector('.field-error-msg');
    if (msg) msg.remove();
  }

  function setError(input, text) {
    input.classList.add('field-error');
    var existing = input.parentElement.querySelector('.field-error-msg');
    if (existing) { existing.textContent = text; return; }
    var span = document.createElement('span');
    span.className = 'field-error-msg';
    span.textContent = text;
    input.parentElement.appendChild(span);
  }

  siteInput.addEventListener('input', function () { clearError(siteInput); });
  emailInput.addEventListener('input', function () { clearError(emailInput); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (form.querySelector('input[name="_gotcha"]').value) return;

    var valid = true;
    clearError(siteInput);
    clearError(emailInput);

    var site = siteInput.value.trim();
    if (!site) {
      setError(siteInput, 'Veuillez indiquer votre site web.');
      valid = false;
    }

    var email = emailInput.value.trim();
    if (!email) {
      setError(emailInput, 'Veuillez indiquer votre email.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(emailInput, 'Veuillez saisir un email valide.');
      valid = false;
    }

    if (!valid) return;

    if (!/^https?:\/\//i.test(site)) site = 'https://' + site;

    var btn = form.querySelector('button[type="submit"]');
    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ form_name: 'analyse_ia', site: site, email: email })
    })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.hidden = true;
      confirmation.hidden = false;
    })
    .catch(function () {
      setError(emailInput, 'Une erreur est survenue. Veuillez réessayer.');
    })
    .finally(function () {
      btn.disabled = false;
      btn.textContent = old;
    });
  });
})();
