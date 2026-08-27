// Comportamiento del sitio LNX: navegacion, tema, idioma, animaciones y formulario.
// Funciones puras exportadas para verificacion; el resto se activa solo si hay DOM.
import { getInitialLocale, setLocale, applyTranslations, t } from './i18n.js';
import { initChatbot } from './chatbot.js';

// -----------------------------------------------------------------------
// Configuracion de EmailJS para el formulario de contacto.
//
// El formulario NO envia correos todavia. Para activarlo (ver README.md,
// seccion "Como conectar el formulario de contacto a un correo real"):
// 1. Crea una cuenta gratuita en https://www.emailjs.com/
// 2. Conecta el correo de destino en "Email Services" y copia el Service ID.
// 3. Crea una plantilla en "Email Templates" pegando el HTML de
//    .tools/emailjs-template.html (Code Editor) y copia el Template ID.
// 4. Copia tu Public Key desde Account -> General -> API Keys.
// 5. Pega los tres valores abajo. Mientras alguno quede vacio, el formulario
//    opera en modo demostracion y jamas simula un envio real.
// -----------------------------------------------------------------------
export const EMAILJS_SERVICE_ID = 'service_c13zjqf';
export const EMAILJS_TEMPLATE_ID = 'template_una2wws';
export const EMAILJS_PUBLIC_KEY = 'FOWAQGePB6WLiTfIp';

const THEME_KEY = 'lnx-theme';
const SUBMIT_COOLDOWN_MS = 30000;

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function sanitizeInput(value) {
  return String(value).replace(/[<>]/g, '').trim();
}

export function canSubmit(storage, now) {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  const time = typeof now === 'number' ? now : Date.now();
  if (!store) return true;
  const raw = store.getItem('lnx-last-submit');
  const last = raw === null || raw === undefined ? -Infinity : Number(raw);
  if (time - last < SUBMIT_COOLDOWN_MS) return false;
  store.setItem('lnx-last-submit', String(time));
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLocale();
    initHeaderScroll();
    initMobileMenu();
    initLangSwitch();
    initThemeToggle();
    initReveals();
    initHeroTilt();
    initHeroScrollDepth();
    initBackToTop();
    initContactForm();
    initFooterYear();
    initAmbientVideos();
    initChatbot();
    registerServiceWorker();
  });
}

// -------------------------------------------------------------------------
// Tema claro / oscuro
// -------------------------------------------------------------------------
function getPreferredTheme() {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.js-brand-logo').forEach((img) => {
    const src = theme === 'dark' ? img.getAttribute('data-src-dark') : img.getAttribute('data-src-light');
    if (src) img.setAttribute('src', src);
  });
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    const locale = document.documentElement.lang === 'en' ? 'en' : 'es';
    toggle.setAttribute('aria-label', t(locale, theme === 'dark' ? 'a11y.themeToLight' : 'a11y.themeToDark'));
  }
}

function initTheme() {
  applyTheme(getPreferredTheme());
}

function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// -------------------------------------------------------------------------
// Idioma
// -------------------------------------------------------------------------
function initLocale() {
  const locale = getInitialLocale();
  setLocale(locale);
}

function initLangSwitch() {
  document.querySelectorAll('[data-locale]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const locale = btn.getAttribute('data-locale');
      setLocale(locale);
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    });
  });
}

// -------------------------------------------------------------------------
// Header con scroll
// -------------------------------------------------------------------------
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  const sentinel = document.getElementById('header-sentinel');
  if (!header || !sentinel || typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('site-header--scrolled', !entry.isIntersecting);
    },
    { threshold: 0 }
  );
  observer.observe(sentinel);
}

// -------------------------------------------------------------------------
// Menu movil
// -------------------------------------------------------------------------
function initMobileMenu() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('primary-menu');
  if (!toggle || !menu) return;

  function currentLocale() {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  }

  function openMenu() {
    menu.classList.add('nav__menu--open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', t(currentLocale(), 'a11y.menuClose'));
    document.body.style.overflow = 'hidden';
    const firstLink = menu.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }

  function closeMenu({ restoreFocus = true } = {}) {
    menu.classList.remove('nav__menu--open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', t(currentLocale(), 'a11y.menuOpen'));
    document.body.style.overflow = '';
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;
    if (menu.contains(event.target) || toggle.contains(event.target)) return;
    closeMenu({ restoreFocus: false });
  });

  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusables = menu.querySelectorAll('a, button');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

// -------------------------------------------------------------------------
// Animaciones de aparicion
// -------------------------------------------------------------------------
function initReveals() {
  const items = document.querySelectorAll('.reveal');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || typeof IntersectionObserver === 'undefined') {
    items.forEach((el) => el.classList.add('reveal--visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

// -------------------------------------------------------------------------
// Tilt 3D del hero
// -------------------------------------------------------------------------
function initHeroTilt() {
  const visual = document.querySelector('.hero__visual');
  if (!visual) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (prefersReduced || !hasFinePointer) return;

  let active = true;
  document.addEventListener('visibilitychange', () => {
    active = !document.hidden;
  });

  visual.addEventListener('pointermove', (event) => {
    if (!active) return;
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    visual.style.setProperty('--tiltX', `${(x * 10).toFixed(2)}deg`);
    visual.style.setProperty('--tiltY', `${(-y * 10).toFixed(2)}deg`);
  });

  visual.addEventListener('pointerleave', () => {
    visual.style.setProperty('--tiltX', '0deg');
    visual.style.setProperty('--tiltY', '0deg');
  });
}

// -------------------------------------------------------------------------
// Profundidad 3D del hero segun el avance del scroll
// -------------------------------------------------------------------------
function initHeroScrollDepth() {
  const visual = document.querySelector('.hero__visual');
  const heroSection = document.querySelector('.hero');
  if (!visual || !heroSection) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  function update() {
    ticking = false;
    const rect = heroSection.getBoundingClientRect();
    const span = rect.height || window.innerHeight;
    const progress = Math.min(Math.max(-rect.top / span, 0), 1);
    const shift = (progress * -48).toFixed(1);
    const rotate = (progress * 8).toFixed(2);
    const scale = (1 - progress * 0.1).toFixed(3);
    visual.style.setProperty('--scroll-shift', `${shift}px`);
    visual.style.setProperty('--scroll-rotate', `${rotate}deg`);
    visual.style.setProperty('--scroll-scale', scale);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

// -------------------------------------------------------------------------
// Boton de volver arriba
// -------------------------------------------------------------------------
function initBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button) return;

  const threshold = () => window.innerHeight * 0.6;
  let ticking = false;

  function update() {
    ticking = false;
    button.classList.toggle('back-to-top--visible', window.scrollY > threshold());
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  button.addEventListener('click', () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    const top = document.getElementById('top');
    if (top) {
      top.setAttribute('tabindex', '-1');
      top.focus({ preventScroll: true });
      top.addEventListener('blur', () => top.removeAttribute('tabindex'), { once: true });
    }
  });
}

// -------------------------------------------------------------------------
// Formulario de contacto
// -------------------------------------------------------------------------
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('form-status');
  const statusText = status ? status.querySelector('.form-status__text') : null;
  const submitBtn = form.querySelector('button[type="submit"]');
  const honeypot = form.querySelector('input[name="company-website"]');
  const messageField = form.querySelector('[name="message"]');
  const messageCounter = document.getElementById('message-counter');

  const requiredFields = ['name', 'company', 'email', 'businessType', 'solution', 'message'];

  function showStatus(kind, message) {
    if (!status) return;
    if (statusText) statusText.textContent = message;
    else status.textContent = message;
    status.className = `form-status is-visible form-status--${kind}`;
  }

  function validateField(name, locale) {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) return true;
    const value = sanitizeInput(field.value);
    if (!value) {
      setFieldError(name, t(locale, 'contact.errorRequired'));
      return false;
    }
    if (name === 'email' && !isValidEmail(value)) {
      setFieldError(name, t(locale, 'contact.errorEmail'));
      return false;
    }
    setFieldError(name, '');
    return true;
  }

  function setFieldError(fieldName, message) {
    const field = form.querySelector(`[name="${fieldName}"]`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    const wrapper = field ? field.closest('.form-field') : null;
    if (errorEl) errorEl.textContent = message || '';
    if (wrapper) {
      wrapper.classList.toggle('form-field--invalid', Boolean(message));
      wrapper.classList.toggle('form-field--valid', !message && Boolean(field && sanitizeInput(field.value)));
    }
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate(locale) {
    let valid = true;
    let firstInvalid = null;
    requiredFields.forEach((name) => {
      const field = form.querySelector(`[name="${name}"]`);
      if (!field) return;
      const ok = validateField(name, locale);
      if (!ok) {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    const privacy = form.querySelector('[name="privacy"]');
    if (privacy && !privacy.checked) {
      setFieldError('privacy', t(locale, 'contact.errorPrivacy'));
      valid = false;
      if (!firstInvalid) firstInvalid = privacy;
    } else if (privacy) {
      setFieldError('privacy', '');
    }

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return valid;
  }

  // Validacion en vivo: al salir de un campo se valida; mientras se escribe,
  // solo se limpia el error si el campo ya es valido (para no ser intrusivo).
  requiredFields.forEach((name) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) return;
    const locale = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
    field.addEventListener('blur', () => validateField(name, locale()));
    field.addEventListener('input', () => {
      const wrapper = field.closest('.form-field');
      if (wrapper && wrapper.classList.contains('form-field--invalid')) {
        validateField(name, locale());
      }
    });
  });

  const privacyField = form.querySelector('[name="privacy"]');
  if (privacyField) {
    privacyField.addEventListener('change', () => {
      const locale = document.documentElement.lang === 'en' ? 'en' : 'es';
      if (privacyField.checked) setFieldError('privacy', '');
      else setFieldError('privacy', t(locale, 'contact.errorPrivacy'));
    });
  }

  if (messageField && messageCounter) {
    const maxLength = Number(messageField.getAttribute('maxlength')) || 500;
    const updateCounter = () => {
      messageCounter.textContent = `${messageField.value.length}/${maxLength}`;
    };
    messageField.addEventListener('input', updateCounter);
    updateCounter();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const locale = document.documentElement.lang === 'en' ? 'en' : 'es';

    if (honeypot && honeypot.value) {
      // Probable bot: no revelar nada, simplemente no continuar.
      return;
    }

    if (!validate(locale)) {
      showStatus('error', t(locale, 'contact.statusInvalid'));
      return;
    }

    if (!canSubmit()) {
      showStatus('info', t(locale, 'contact.statusWait'));
      return;
    }

    const payload = {
      name: sanitizeInput(form.name.value),
      company: sanitizeInput(form.company.value),
      email: sanitizeInput(form.email.value),
      phone: sanitizeInput(form.phone.value),
      businessType: sanitizeInput(form.businessType.selectedOptions[0]?.text || form.businessType.value),
      solution: sanitizeInput(form.solution.selectedOptions[0]?.text || form.solution.value),
      message: sanitizeInput(form.message.value),
    };

    const submitLabel = submitBtn.querySelector('.btn__label');
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = t(locale, 'contact.submitLoading');

    try {
      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY && window.emailjs) {
        await window.emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            from_name: payload.name,
            company: payload.company,
            email: payload.email,
            phone: payload.phone || t(locale, 'contact.notProvided'),
            business_type: payload.businessType,
            solution: payload.solution,
            message: payload.message,
            submitted_at: new Date().toLocaleString(locale === 'en' ? 'en-US' : 'es-MX', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
        showStatus('success', t(locale, 'contact.statusSuccess'));
        form.reset();
      } else {
        // EmailJS sin configurar: modo demostracion, nunca se afirma un envio real.
        showStatus('info', t(locale, 'contact.statusSuccessDemo'));
      }
    } catch (err) {
      showStatus('error', t(locale, 'contact.statusError'));
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('aria-busy');
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = t(locale, 'contact.submit');
    }
  });
}

// -------------------------------------------------------------------------
// Anio dinamico del footer
// -------------------------------------------------------------------------
function initFooterYear() {
  document.querySelectorAll('.js-footer-year').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

// -------------------------------------------------------------------------
// Videos ambientales (tarjetas de terminales): pausar si el usuario prefiere
// menos movimiento o si la tarjeta no esta visible, para ahorrar recursos.
// -------------------------------------------------------------------------
function initAmbientVideos() {
  const videos = document.querySelectorAll('.terminal-illustration--video video');
  if (!videos.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    videos.forEach((video) => {
      video.removeAttribute('autoplay');
      video.pause();
    });
    return;
  }

  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    },
    { threshold: 0.25 }
  );
  videos.forEach((video) => observer.observe(video));
}

// -------------------------------------------------------------------------
// Service worker (PWA)
// -------------------------------------------------------------------------
function hasUnsavedFormInput() {
  const form = document.getElementById('contact-form');
  if (!form) return false;
  return Array.from(form.elements).some((el) => {
    if (el.name === 'company-website') return false; // honeypot, ignorar
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
    return typeof el.value === 'string' && el.value.trim().length > 0;
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });

  // Cuando una version nueva del service worker toma el control, refresca la
  // pagina automaticamente para que todo el mundo vea la ultima version, salvo
  // que haya texto sin enviar en el formulario de contacto (para no perderlo).
  let refreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshed) return;
    if (hasUnsavedFormInput()) return;
    refreshed = true;
    window.location.reload();
  });
}
