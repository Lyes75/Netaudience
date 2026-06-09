/* ============================================================
   NETAUDIENCE — MAIN.JS
   Navigation, animations, counters, smooth scroll, FAQ
   ============================================================ */

'use strict';

// ============================================================
// 1. HEADER SCROLL EFFECT
// ============================================================
(function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
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
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
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
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Exact match or partial match for sub-pages
    const normalized = href.replace(/^\.\.\//, '/').replace(/^\.\//, '/');
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
  const selectors = [
    '.reveal',
    '.reveal-left',
    '.reveal-right',
    '.reveal-scale',
    '.reveal-stagger',
    '.timeline-item',
    '.kpi-item'
  ];

  const elements = document.querySelectorAll(selectors.join(', '));
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -48px 0px'
  });

  elements.forEach(el => observer.observe(el));
})();

// ============================================================
// 5. ANIMATED KPI COUNTERS
// ============================================================
(function initCounters() {
  const counters = document.querySelectorAll('.kpi-number[data-target]');
  if (!counters.length) return;

  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  const animateCounter = (el) => {
    const target = el.dataset.target;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const isFloat = target.includes('.');
    const targetNum = parseFloat(target);
    const duration = 2000;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = eased * targetNum;

      el.textContent = prefix + (isFloat
        ? current.toFixed(1)
        : Math.round(current).toLocaleString('fr-FR')
      ) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + (isFloat
          ? targetNum.toFixed(1)
          : targetNum.toLocaleString('fr-FR')
        ) + suffix;
      }
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
})();

// ============================================================
// 6. FAQ ACCORDION
// ============================================================
(function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = null;
      });

      // Open clicked if was closed
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    // Keyboard accessibility
    question.addEventListener('keydown', (e) => {
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
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 88;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

// ============================================================
// 8. CONTACT FORM HANDLING
// ============================================================
(function initContactForm() {

  /* ----------------------------------------------------------
   * CONFIGURATION — remplacer par l'URL réelle du webhook n8n
   * ---------------------------------------------------------- */
  var WEBHOOK_URL = 'https://netaudience.app.n8n.cloud/webhook-test/netaudience-lead';

  var form = document.querySelector('.contact-form form');
  if (!form) return;

  /* ----------------------------------------------------------
   * Helpers cookies GA4 — sans dépendance à gtag()
   *
   * _ga            → GA1.X.<client_id>   (ex: GA1.2.123456.7890)
   * _ga_STREAM_ID  → GS1.1.<session_id>… (ex: GS1.1.1700000000.1…)
   * ---------------------------------------------------------- */
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
    // Cible le premier cookie _ga_<STREAM_ID> trouvé dans document.cookie
    var m = document.cookie.match(/_ga_[A-Z0-9]+=GS\d+\.\d+\.(\d+)/);
    return m ? m[1] : null;
  }

  /* ----------------------------------------------------------
   * Élément de feedback créé à la volée sous le bouton submit
   * ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
   * Soumission
   * ---------------------------------------------------------- */
  form.addEventListener('submit', function onSubmit(e) {
    e.preventDefault();

    // Validation HTML5 native (form a l'attribut novalidate → on déclenche manuellement)
    if (!form.reportValidity()) return;

    var originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours…';
    setFeedback('', '');

    // Collecte tous les champs via FormData
    var fields = {};
    new FormData(form).forEach(function(val, key) { fields[key] = val; });

    var payload = Object.assign(fields, {
      ga_client_id:  getGaClientId(),   // null si consentement refusé → envoyé quand même
      ga_session_id: getGaSessionId()   // null si cookie absent
    });

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);

      // Succès : remplace le formulaire par le message de confirmation
      form.reset();
      var success = document.createElement('div');
      success.className = 'form-success';
      success.innerHTML = [
        '<div style="',
          'text-align:center;padding:48px 32px;',
          'background:var(--color-blue-light);',
          'border-radius:var(--radius-lg);',
          'border:1px solid rgba(46,134,222,.2);',
        '">',
          '<div style="',
            'width:64px;height:64px;background:var(--color-blue);border-radius:50%;',
            'display:flex;align-items:center;justify-content:center;margin:0 auto 20px;',
          '">',
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">',
              '<path d="M20 6L9 17l-5-5"/>',
            '</svg>',
          '</div>',
          '<h3 style="margin-bottom:12px;color:var(--color-brand);">Message envoyé !</h3>',
          '<p style="color:var(--color-grey);">',
            'Merci pour votre demande. Notre équipe vous répondra dans les 24 heures.',
          '</p>',
        '</div>'
      ].join('');
      form.replaceWith(success);
    })
    .catch(function() {
      setFeedback(
        'Une erreur est survenue. Veuillez réessayer ou écrire à contact@netaudience.fr',
        '#e74c3c'
      );
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    });
  });

  /* ----------------------------------------------------------
   * Feedback temps-réel sur les champs requis
   * ---------------------------------------------------------- */
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
// 9. HERO SVG BACKGROUND GENERATION
// ============================================================
(function initHeroBg() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1200 700');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

  // Chart-like paths
  const paths = [
    { d: 'M-100,400 L200,250 L400,320 L600,180 L800,220 L1000,120 L1300,180', color: 'rgba(46,134,222,.15)', width: 2 },
    { d: 'M-100,500 L100,420 L300,460 L500,320 L700,360 L900,260 L1300,300', color: 'rgba(201,169,110,.08)', width: 1.5 },
    { d: 'M-100,600 L200,540 L450,570 L650,450 L850,480 L1100,380 L1300,420', color: 'rgba(46,134,222,.06)', width: 1 },
  ];

  paths.forEach(p => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', p.d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', p.color);
    path.setAttribute('stroke-width', p.width);
    svg.appendChild(path);

    // Filled area
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fill.setAttribute('d', p.d + ' L1300,700 L-100,700 Z');
    fill.setAttribute('fill', p.color.replace(/[\d.]+\)$/, '0.04)'));
    svg.appendChild(fill);
  });

  // Grid lines
  for (let i = 0; i <= 10; i++) {
    const y = i * 70;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0'); line.setAttribute('y1', y);
    line.setAttribute('x2', '1200'); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,.03)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  for (let i = 0; i <= 12; i++) {
    const x = i * 100;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', '0');
    line.setAttribute('x2', x); line.setAttribute('y2', '700');
    line.setAttribute('stroke', 'rgba(255,255,255,.025)');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  // Dots on chart
  const dotPositions = [
    [200,250], [400,320], [600,180], [800,220], [1000,120]
  ];

  dotPositions.forEach(([cx, cy]) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', 'rgba(201,169,110,.5)');
    svg.appendChild(circle);

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glow.setAttribute('cx', cx);
    glow.setAttribute('cy', cy);
    glow.setAttribute('r', '10');
    glow.setAttribute('fill', 'rgba(201,169,110,.08)');
    svg.appendChild(glow);
  });

  heroBg.appendChild(svg);
})();

// ============================================================
// 10. MARQUEE DUPLICATION (ensure seamless loop)
// ============================================================
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;

  // Clone for seamless loop
  const original = track.innerHTML;
  track.innerHTML = original + original;
})();

// ============================================================
// 11. PAGE LOAD ANIMATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');

  // Animate hero content
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(24px)';

    setTimeout(() => {
      heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'translateY(0)';
    }, 100);
  }

  // Animate page hero
  const pageHero = document.querySelector('.page-hero .container');
  if (pageHero) {
    pageHero.style.opacity = '0';
    pageHero.style.transform = 'translateY(20px)';

    setTimeout(() => {
      pageHero.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      pageHero.style.opacity = '1';
      pageHero.style.transform = 'translateY(0)';
    }, 150);
  }
});

// ============================================================
// 12. EXPERTISE CARDS — subtle parallax on mouse
// ============================================================
(function initCardTilt() {
  const cards = document.querySelectorAll('.expertise-card, .card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
    });
  });
})();

// ============================================================
// 13. CURRENT YEAR IN FOOTER
// ============================================================
(function setYear() {
  const yearEls = document.querySelectorAll('.current-year');
  yearEls.forEach(el => { el.textContent = new Date().getFullYear(); });
})();
