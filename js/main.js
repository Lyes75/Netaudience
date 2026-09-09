/* ============================================================
   NETAUDIENCE — MAIN.JS
   Navigation, counters, FAQ, scroll reveal
   ============================================================ */

'use strict';

// ============================================================
// 1. HEADER SCROLL EFFECT
// ============================================================
(function initHeader() {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var onScroll = function() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ============================================================
// 2. HAMBURGER / MOBILE NAV
// ============================================================
(function initMobileNav() {
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', function() {
    var isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('click', function(e) {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

// ============================================================
// 3. ACTIVE NAV LINK
// ============================================================
(function initActiveNav() {
  var path = window.location.pathname;
  var navLinks = document.querySelectorAll('.nav-link, .mobile-nav a');

  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    if (
      (path === '/' && href === 'index.html') ||
      (path.endsWith(href)) ||
      (path.includes(href) && href !== 'index.html' && href.length > 3)
    ) {
      link.classList.add('active');
    }
  });
})();

// ============================================================
// 4. SCROLL REVEAL (IntersectionObserver)
// ============================================================
(function initScrollReveal() {
  var selectors = [
    '.reveal',
    '.reveal-left',
    '.reveal-right',
    '.reveal-scale',
    '.reveal-stagger',
    '.timeline-item',
    '.kpi-item'
  ];

  var elements = document.querySelectorAll(selectors.join(', '));
  if (!elements.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(function(el) { observer.observe(el); });
})();

// ============================================================
// 5. ANIMATED KPI COUNTERS (hardcoded HTML fallback)
// ============================================================
(function initCounters() {
  var counters = document.querySelectorAll('.kpi-number[data-target]');
  if (!counters.length) return;

  var easeOutQuart = function(t) { return 1 - Math.pow(1 - t, 4); };

  var animateCounter = function(el) {
    var target = parseFloat(el.dataset.target);
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    var isFloat = el.dataset.target.indexOf('.') !== -1;
    var duration = 1800;

    el.textContent = prefix + '0' + suffix;

    var startTime = performance.now();
    var update = function(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutQuart(progress);
      var current = eased * target;

      el.textContent = prefix + (isFloat
        ? current.toFixed(1)
        : Math.round(current).toLocaleString('fr-FR')
      ) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + (isFloat
          ? target.toFixed(1)
          : target.toLocaleString('fr-FR')
        ) + suffix;
      }
    };

    requestAnimationFrame(update);
  };

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function(counter) { observer.observe(counter); });
})();

// ============================================================
// 6. FAQ ACCORDION
// ============================================================
(function initFaq() {
  var faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(function(item) {
    var question = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    question.addEventListener('click', function() {
      var isOpen = item.classList.contains('open');

      faqItems.forEach(function(i) {
        i.classList.remove('open');
        var btn = i.querySelector('.faq-question');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        var a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    question.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });
})();

// ============================================================
// 7. SMOOTH SCROLL
// ============================================================
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var offset = 88;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();

// ============================================================
// 8. CONTACT FORM HANDLING
// ============================================================
(function initContactForm() {

  var WEBHOOK_URL = 'https://netaudience.app.n8n.cloud/webhook/netaudience-lead';

  var form = document.querySelector('.contact-form form');
  if (!form) return;

  function getCookieRaw(name) {
    var rx = new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)');
    var m = document.cookie.match(rx);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function getGaClientId() {
    var raw = getCookieRaw('_ga');
    if (!raw) return null;
    var m = raw.match(/^GA\d+\.\d+\.(.+)$/);
    return m ? m[1] : null;
  }

  function getGaSessionId() {
    var m = document.cookie.match(/_ga_[A-Z0-9]+=GS\d+\.\d+\.s?(\d+)/);
    return m ? m[1] : null;
  }

  var submitBtn = form.querySelector('button[type="submit"]');
  var feedback = document.createElement('p');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.style.cssText = 'margin-top:12px;font-size:.875rem;text-align:center;min-height:1.25em;';
  submitBtn.insertAdjacentElement('afterend', feedback);

  function setFeedback(msg, color) {
    feedback.textContent = msg;
    feedback.style.color = color || '';
  }

  form.addEventListener('submit', function onSubmit(e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';
    setFeedback('', '');

    var fields = {};
    new FormData(form).forEach(function(val, key) { fields[key] = val; });

    var payload = Object.assign(fields, {
      ga_client_id:  getGaClientId(),
      ga_session_id: getGaSessionId()
    });

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      var success = document.createElement('div');
      success.className = 'form-success';
      success.innerHTML = [
        '<div style="text-align:center;padding:48px 32px;background:var(--color-blue-light);border-radius:var(--radius-lg);border:1px solid rgba(0,82,204,.15);">',
          '<div style="width:56px;height:56px;background:var(--color-blue);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">',
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
          '</div>',
          '<h3 style="margin-bottom:12px;color:var(--color-brand);">Message envoyé</h3>',
          '<p style="color:var(--color-grey);">Merci pour votre demande. Notre équipe vous répondra dans les 24 heures.</p>',
        '</div>'
      ].join('');
      form.replaceWith(success);
    })
    .catch(function() {
      setFeedback('Une erreur est survenue. Veuillez réessayer ou écrire à contact@netaudience.fr', '#e74c3c');
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    });
  });

  form.querySelectorAll('[required]').forEach(function(field) {
    field.addEventListener('blur', function() {
      field.style.borderColor = field.value.trim() ? '' : '#e74c3c';
    });
    field.addEventListener('input', function() {
      if (field.value.trim()) field.style.borderColor = '';
    });
  });
})();

// ============================================================
// 9. MARQUEE DUPLICATION
// ============================================================
(function initMarquee() {
  var track = document.querySelector('.marquee-track');
  if (!track) return;
  var original = track.innerHTML;
  track.innerHTML = original + original;
})();

// ============================================================
// 10. PAGE LOAD ANIMATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('page-enter');

  var heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(16px)';
    setTimeout(function() {
      heroContent.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'translateY(0)';
    }, 80);
  }

  var pageHero = document.querySelector('.page-hero .container');
  if (pageHero) {
    pageHero.style.opacity = '0';
    pageHero.style.transform = 'translateY(16px)';
    setTimeout(function() {
      pageHero.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      pageHero.style.opacity = '1';
      pageHero.style.transform = 'translateY(0)';
    }, 120);
  }
});

// ============================================================
// 11. CURRENT YEAR IN FOOTER
// ============================================================
(function setYear() {
  document.querySelectorAll('.current-year').forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });
})();
