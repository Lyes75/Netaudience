/* ============================================================
   NETAUDIENCE — main.js
   Hamburger, reveal au scroll, compteurs KPI, accordéon FAQ, année.
   Les valeurs KPI finales sont dans le HTML : sans JS, rien ne casse.
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

/* ---------- Compteurs KPI ----------
   Le HTML contient déjà la valeur finale (fallback crawlers / no-JS).
   Au premier affichage, on anime de 0 vers data-target puis on
   restitue exactement le texte d'origine. */
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

/* ---------- Formulaire contact (n8n webhook) ---------- */
(function () {
  var form = document.querySelector('.contact-form form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    fetch('https://netaudience.app.n8n.cloud/webhook/netaudience-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.reset();
      showStatus(form, 'success', 'Message envoyé. Nous vous recontactons sous 24 h.');
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
