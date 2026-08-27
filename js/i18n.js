// Motor de internacionalizacion (ES/EN) de LNX. Sin dependencias externas.
const STORAGE_KEY = 'lnx-locale';

const dictionaries = {
  es: {
    'meta.title': 'LNX Technologies - Pagos, terminales y sistemas POS para comercios',
    'meta.description':
      'LNX ofrece procesamiento de pagos, terminales y sistemas de punto de venta para restaurantes, tiendas y comercios, con soluciones conectadas al ecosistema OnTheFly.',

    'a11y.skipLink': 'Saltar al contenido',
    'a11y.menuOpen': 'Abrir menú de navegación',
    'a11y.menuClose': 'Cerrar menú de navegación',
    'a11y.themeToLight': 'Cambiar a tema claro',
    'a11y.themeToDark': 'Cambiar a tema oscuro',
    'a11y.langEs': 'Cambiar el sitio a español',
    'a11y.langEn': 'Switch site to English',
    'a11y.backToTop': 'Volver al inicio de la página',

    'nav.home': 'Inicio',
    'nav.solutions': 'Soluciones',
    'nav.onthefly': 'OnTheFly',
    'nav.terminals': 'Terminales',
    'nav.about': 'Nosotros',
    'nav.contact': 'Contacto',
    'nav.cta': 'Solicitar una demostración',

    'hero.title1': 'PAGOS',
    'hero.title2': 'QUE MUEVEN',
    'hero.title3': 'TU NEGOCIO',
    'hero.subtitle':
      'Tecnología de pagos y punto de venta para operar con mayor rapidez, visibilidad y control.',
    'hero.ctaDemo': 'Solicitar una demostración',
    'hero.ctaSolutions': 'Conocer las soluciones',

    'solutions.eyebrow': 'Soluciones',
    'solutions.title': 'Tecnología para cada punto de tu operación',
    'solutions.lede':
      'Desde el cobro hasta el reporte, LNX conecta las herramientas que tu comercio necesita para operar con más claridad.',
    'solutions.item1.title': 'Procesamiento de pagos',
    'solutions.item1.desc':
      'Acepta pagos de tus clientes con soluciones pensadas para el ritmo de tu negocio.',
    'solutions.item2.title': 'Sistemas de punto de venta',
    'solutions.item2.desc':
      'Administra ventas, productos y usuarios desde una interfaz clara pensada para el mostrador.',
    'solutions.item3.title': 'Gestión de ventas',
    'solutions.item3.desc':
      'Organiza tu operación diaria con herramientas para dar seguimiento a las ventas de tu comercio.',
    'solutions.item4.title': 'Reportes operativos',
    'solutions.item4.desc':
      'Consulta información de tu negocio para apoyar decisiones basadas en datos reales.',
    'solutions.item5.title': 'Administración del negocio',
    'solutions.item5.desc':
      'Centraliza la operación de tu comercio con herramientas pensadas para el día a día.',
    'solutions.item6.title': 'Conectado con OnTheFly',
    'solutions.item6.desc':
      'Soluciones relacionadas con el ecosistema OnTheFly para una operación más integrada.',

    'onthefly.eyebrow': 'Alianza tecnológica',
    'onthefly.title1': 'CONECTA PAGOS',
    'onthefly.title2': 'Y OPERACIÓN',
    'onthefly.title3': 'CON ONTHEFLY',
    'onthefly.lede':
      'LNX trabaja con soluciones relacionadas con el ecosistema OnTheFly para ayudar a los comercios a conectar sus pagos con su operación diaria. Consulta las funciones y compatibilidad disponibles para tu negocio.',
    'onthefly.disclaimer':
      'Las funciones, integraciones y disponibilidad pueden variar según la solución, el equipo y la configuración del comercio.',

    'terminals.title': 'Equipos para distintos tipos de operación',
    'terminals.lede':
      'Estas son categorías generales de equipo. Un asesor de LNX puede ayudarte a identificar la opción adecuada para tu comercio.',
    'terminals.item1.category': 'Terminal móvil',
    'terminals.item1.desc': 'Pensada para cobrar en mesa, en mostrador o en movimiento dentro del comercio.',
    'terminals.item1.business': 'Recomendada para: restaurantes y servicio a domicilio',
    'terminals.item2.category': 'Terminal de mostrador',
    'terminals.item2.desc': 'Un equipo fijo para el punto de cobro principal de tiendas y comercios.',
    'terminals.item2.business': 'Recomendada para: tiendas y comercios con mostrador',
    'terminals.item3.category': 'Sistema POS',
    'terminals.item3.desc': 'Una solución de punto de venta para gestionar ventas, productos y usuarios.',
    'terminals.item3.business': 'Recomendada para: comercios con múltiples usuarios de venta',
    'terminals.item4.category': 'Solución todo en uno',
    'terminals.item4.desc': 'Cobro y sistema de venta integrados en un mismo equipo.',
    'terminals.item4.business': 'Recomendada para: negocios que buscan simplificar su operación',
    'terminals.cta': 'Solicitar información',
    'terminals.photoAlt': 'Persona entregando una terminal de pago genérica a otra persona en un mostrador.',
    'terminals.photoCaption': 'Imagen de referencia. El equipo específico puede variar según el modelo asignado a tu comercio.',

    'faq.title': 'Preguntas frecuentes',
    'faq.q1': '¿Cómo sé qué terminal necesita mi negocio?',
    'faq.a1':
      'Depende del tipo de comercio y del volumen de ventas. Un asesor de LNX puede recomendarte la opción adecuada después de conocer tu operación.',
    'faq.q2': '¿La integración con OnTheFly funciona con cualquier equipo?',
    'faq.a2':
      'La compatibilidad puede variar según la solución, el equipo y la configuración del comercio. Un asesor puede confirmar qué funciones aplican a tu caso.',
    'faq.q3': '¿Cuánto tiempo toma comenzar a operar con LNX?',
    'faq.a3':
      'El tiempo varía según el tipo de solución y la configuración necesaria para tu comercio. Solicita una demostración para conocer el proceso completo.',
    'faq.q4': '¿LNX funciona para negocios pequeños?',
    'faq.a4':
      'LNX está pensado para distintos tipos y tamaños de comercio, desde negocios con atención en mostrador hasta operaciones con múltiples usuarios de venta.',
    'faq.q5': '¿Qué pasa si ya tengo un sistema de punto de venta?',
    'faq.a5':
      'Cuéntanos sobre tu operación actual a través del formulario de contacto; un asesor de LNX puede orientarte sobre las opciones disponibles.',

    'why.title': 'Una operación más conectada',
    'why.item1.title': 'Operación conectada',
    'why.item1.desc': 'Pagos y operación trabajando de forma más integrada.',
    'why.item2.title': 'Mayor visibilidad',
    'why.item2.desc': 'Información de tu negocio disponible para apoyar tus decisiones.',
    'why.item3.title': 'Tecnología adaptable',
    'why.item3.desc': 'Soluciones que pueden ajustarse a distintos tipos de comercio.',
    'why.item4.title': 'Información para decisiones',
    'why.item4.desc': 'Reportes pensados para entender mejor tu operación diaria.',
    'why.item5.title': 'Soluciones para distintos comercios',
    'why.item5.desc': 'Herramientas pensadas para restaurantes, tiendas y negocios de servicio.',

    'business.title': 'Pensado para tu tipo de negocio',
    'business.lede': 'LNX acompaña a distintos tipos de comercio en su operación diaria.',
    'business.chip1': 'Restaurantes',
    'business.chip2': 'Cafeterías',
    'business.chip3': 'Tiendas',
    'business.chip4': 'Servicios',
    'business.chip5': 'Comercios con atención en mostrador',
    'business.photoAlt': 'Persona operando un sistema de punto de venta en un mostrador.',

    'about.feature1Title': 'Ventas más rápidas',
    'about.feature1Desc': 'Agiliza tu negocio y mejora la experiencia del cliente.',
    'about.feature2Title': 'Reportes en tiempo real',
    'about.feature2Desc': 'Toma mejores decisiones con información actualizada.',
    'about.feature3Title': 'Acceso desde cualquier lugar',
    'about.feature3Desc': 'Administra tu negocio desde la nube, seguro y conveniente.',
    'about.feature4Title': 'Seguro y confiable',
    'about.feature4Desc': 'Tus datos y tu negocio siempre protegidos.',
    'about.photoAlt': 'Pantalla de un sistema de punto de venta LNX mostrando una venta en un bar, junto a una terminal de pago y una impresora de recibos.',
    'about.title': 'Sobre LNX',
    'about.text':
      'LNX desarrolla y conecta soluciones tecnológicas para ayudar a los comercios a administrar pagos y operaciones de manera más clara y eficiente.',

    'contact.eyebrow': 'Contacto',
    'contact.title': 'Hablemos de tu negocio',
    'contact.lede': 'Cuéntanos sobre tu comercio y un asesor de LNX se pondrá en contacto contigo.',
    'contact.labelName': 'Nombre',
    'contact.labelCompany': 'Empresa o negocio',
    'contact.labelEmail': 'Correo electrónico',
    'contact.labelPhone': 'Teléfono',
    'contact.labelBusinessType': 'Tipo de negocio',
    'contact.labelSolution': 'Solución de interés',
    'contact.labelMessage': 'Mensaje',
    'contact.optionSelect': 'Selecciona una opción',
    'contact.business.restaurant': 'Restaurante',
    'contact.business.cafe': 'Cafetería',
    'contact.business.store': 'Tienda',
    'contact.business.service': 'Servicios',
    'contact.business.counter': 'Comercio con mostrador',
    'contact.business.other': 'Otro',
    'contact.solution.payments': 'Procesamiento de pagos',
    'contact.solution.pos': 'Sistema de punto de venta',
    'contact.solution.sales': 'Gestión de ventas',
    'contact.solution.reports': 'Reportes operativos',
    'contact.solution.onthefly': 'Solución conectada con OnTheFly',
    'contact.solution.other': 'Otra',
    'contact.labelPrivacy': 'He leído y acepto el aviso de privacidad.',
    'contact.submit': 'Enviar solicitud',
    'contact.submitLoading': 'Enviando…',
    'contact.errorRequired': 'Este campo es obligatorio.',
    'contact.errorEmail': 'Ingresa un correo electrónico válido.',
    'contact.errorPrivacy': 'Debes aceptar el aviso de privacidad para continuar.',
    'contact.statusSuccessDemo':
      'Modo de demostración: el formulario aún no está conectado a un sistema real. Este envío no se ha enviado a ningún servidor.',
    'contact.statusSuccess': '¡Listo! Tu solicitud fue enviada. Un asesor de LNX se pondrá en contacto contigo pronto.',
    'contact.notProvided': 'No proporcionado',
    'contact.statusError': 'Ocurrió un problema al enviar tu solicitud. Intenta de nuevo más tarde.',
    'contact.statusWait': 'Ya recibimos tu solicitud. Espera unos segundos antes de enviar otra.',
    'contact.statusInvalid': 'Revisa los campos marcados antes de continuar.',
    'contact.info1Title': 'Respuesta personalizada',
    'contact.info1Desc': 'Un asesor de LNX revisa tu mensaje y te contacta directamente.',
    'contact.info2Title': 'Sin compromiso',
    'contact.info2Desc': 'Solicitar información o una demostración no te obliga a nada.',
    'contact.info3Title': 'Datos protegidos',
    'contact.info3Desc': 'Tu información se usa solo para responder tu solicitud.',
    'contact.info4Title': 'Escríbenos directamente',

    'footer.privacy': 'Aviso de privacidad',
    'footer.terms': 'Términos y condiciones',
    'footer.rights': 'Todos los derechos reservados.',

    'notfound.title': 'Página no encontrada',
    'notfound.text': 'La página que buscas no existe o fue movida.',
    'notfound.cta': 'Volver al inicio',
  },
  en: {
    'meta.title': 'LNX Technologies - Payments, terminals and POS systems for merchants',
    'meta.description':
      'LNX provides payment processing, terminals and point-of-sale systems for restaurants, retail and merchants, with solutions connected to the OnTheFly ecosystem.',

    'a11y.skipLink': 'Skip to content',
    'a11y.menuOpen': 'Open navigation menu',
    'a11y.menuClose': 'Close navigation menu',
    'a11y.themeToLight': 'Switch to light theme',
    'a11y.themeToDark': 'Switch to dark theme',
    'a11y.langEs': 'Cambiar el sitio a español',
    'a11y.langEn': 'Switch site to English',
    'a11y.backToTop': 'Back to top of the page',

    'nav.home': 'Home',
    'nav.solutions': 'Solutions',
    'nav.onthefly': 'OnTheFly',
    'nav.terminals': 'Terminals',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.cta': 'Request a demo',

    'hero.title1': 'PAYMENTS',
    'hero.title2': 'THAT MOVE',
    'hero.title3': 'YOUR BUSINESS',
    'hero.subtitle':
      'Payment and point-of-sale technology built for faster operations, clearer insights and greater control.',
    'hero.ctaDemo': 'Request a demo',
    'hero.ctaSolutions': 'Explore solutions',

    'solutions.eyebrow': 'Solutions',
    'solutions.title': 'Technology for every part of your operation',
    'solutions.lede':
      'From checkout to reporting, LNX connects the tools your business needs to operate with more clarity.',
    'solutions.item1.title': 'Payment processing',
    'solutions.item1.desc': 'Accept payments from your customers with solutions built for your pace of business.',
    'solutions.item2.title': 'Point-of-sale systems',
    'solutions.item2.desc': 'Manage sales, products and users from a clear interface built for the counter.',
    'solutions.item3.title': 'Sales management',
    'solutions.item3.desc': 'Organize your daily operation with tools to keep track of your business sales.',
    'solutions.item4.title': 'Operational reports',
    'solutions.item4.desc': 'Access information about your business to support decisions based on real data.',
    'solutions.item5.title': 'Business administration',
    'solutions.item5.desc': 'Centralize your day-to-day operation with tools built for daily use.',
    'solutions.item6.title': 'Connected with OnTheFly',
    'solutions.item6.desc': 'Solutions related to the OnTheFly ecosystem for a more connected operation.',

    'onthefly.eyebrow': 'Technology partnership',
    'onthefly.title1': 'CONNECT PAYMENTS',
    'onthefly.title2': 'AND OPERATIONS',
    'onthefly.title3': 'WITH ONTHEFLY',
    'onthefly.lede':
      'LNX works with solutions related to the OnTheFly ecosystem to help merchants connect their payments with their daily operation. Check the features and compatibility available for your business.',
    'onthefly.disclaimer':
      'Features, integrations and availability may vary depending on the solution, equipment and merchant configuration.',

    'terminals.title': 'Equipment for different types of operation',
    'terminals.lede':
      'These are general equipment categories. An LNX advisor can help you identify the right option for your business.',
    'terminals.item1.category': 'Mobile terminal',
    'terminals.item1.desc': 'Built for taking payments at the table, at the counter, or on the move.',
    'terminals.item1.business': 'Recommended for: restaurants and delivery service',
    'terminals.item2.category': 'Countertop terminal',
    'terminals.item2.desc': 'A fixed device for the main checkout point of stores and merchants.',
    'terminals.item2.business': 'Recommended for: retail and counter-service businesses',
    'terminals.item3.category': 'POS system',
    'terminals.item3.desc': 'A point-of-sale solution to manage sales, products and users.',
    'terminals.item3.business': 'Recommended for: businesses with multiple sales users',
    'terminals.item4.category': 'All-in-one solution',
    'terminals.item4.desc': 'Payment acceptance and sales system integrated into a single device.',
    'terminals.item4.business': 'Recommended for: businesses looking to simplify their operation',
    'terminals.cta': 'Request information',
    'terminals.photoAlt': 'Person handing a generic payment terminal to another person at a counter.',
    'terminals.photoCaption': 'Reference image. The specific equipment may vary depending on the model assigned to your business.',

    'faq.title': 'Frequently asked questions',
    'faq.q1': 'How do I know which terminal my business needs?',
    'faq.a1':
      'It depends on your type of business and sales volume. An LNX advisor can recommend the right option once they understand your operation.',
    'faq.q2': 'Does the OnTheFly integration work with any equipment?',
    'faq.a2':
      'Compatibility may vary depending on the solution, the equipment and the merchant configuration. An advisor can confirm which features apply to your case.',
    'faq.q3': 'How long does it take to start operating with LNX?',
    'faq.a3':
      'Timing varies depending on the type of solution and the setup your business needs. Request a demo to learn about the full process.',
    'faq.q4': 'Does LNX work for small businesses?',
    'faq.a4':
      'LNX is built for different types and sizes of merchants, from counter-service businesses to operations with multiple sales users.',
    'faq.q5': 'What if I already have a point-of-sale system?',
    'faq.a5':
      'Tell us about your current setup through the contact form; an LNX advisor can guide you through the options available.',

    'why.title': 'A more connected operation',
    'why.item1.title': 'Connected operation',
    'why.item1.desc': 'Payments and operations working in a more integrated way.',
    'why.item2.title': 'Greater visibility',
    'why.item2.desc': 'Business information available to support your decisions.',
    'why.item3.title': 'Adaptable technology',
    'why.item3.desc': 'Solutions that can adjust to different types of merchants.',
    'why.item4.title': 'Information for decisions',
    'why.item4.desc': 'Reports built to help you understand your daily operation.',
    'why.item5.title': 'Solutions for different merchants',
    'why.item5.desc': 'Tools built for restaurants, retail and service businesses.',

    'business.title': 'Built for your type of business',
    'business.lede': 'LNX supports different types of merchants in their daily operation.',
    'business.chip1': 'Restaurants',
    'business.chip2': 'Coffee shops',
    'business.chip3': 'Retail stores',
    'business.chip4': 'Services',
    'business.chip5': 'Counter-service merchants',
    'business.photoAlt': 'Person operating a point-of-sale system at a checkout counter.',

    'about.feature1Title': 'Faster sales',
    'about.feature1Desc': 'Speed up your business and improve the customer experience.',
    'about.feature2Title': 'Real-time reports',
    'about.feature2Desc': 'Make better decisions with up-to-date information.',
    'about.feature3Title': 'Access from anywhere',
    'about.feature3Desc': 'Manage your business from the cloud, securely and conveniently.',
    'about.feature4Title': 'Secure and reliable',
    'about.feature4Desc': 'Your data and your business always protected.',
    'about.photoAlt': 'Screen of an LNX point-of-sale system showing a sale at a bar, next to a payment terminal and a receipt printer.',
    'about.title': 'About LNX',
    'about.text':
      'LNX develops and connects technology solutions that help merchants manage payments and operations with greater clarity and efficiency.',

    'contact.eyebrow': 'Contact',
    'contact.title': "Let's talk about your business",
    'contact.lede': 'Tell us about your business and an LNX advisor will get in touch with you.',
    'contact.labelName': 'Name',
    'contact.labelCompany': 'Company or business',
    'contact.labelEmail': 'Email address',
    'contact.labelPhone': 'Phone number',
    'contact.labelBusinessType': 'Business type',
    'contact.labelSolution': 'Solution of interest',
    'contact.labelMessage': 'Message',
    'contact.optionSelect': 'Select an option',
    'contact.business.restaurant': 'Restaurant',
    'contact.business.cafe': 'Coffee shop',
    'contact.business.store': 'Retail store',
    'contact.business.service': 'Services',
    'contact.business.counter': 'Counter-service merchant',
    'contact.business.other': 'Other',
    'contact.solution.payments': 'Payment processing',
    'contact.solution.pos': 'Point-of-sale system',
    'contact.solution.sales': 'Sales management',
    'contact.solution.reports': 'Operational reports',
    'contact.solution.onthefly': 'OnTheFly-connected solution',
    'contact.solution.other': 'Other',
    'contact.labelPrivacy': 'I have read and accept the privacy notice.',
    'contact.submit': 'Send request',
    'contact.submitLoading': 'Sending…',
    'contact.errorRequired': 'This field is required.',
    'contact.errorEmail': 'Enter a valid email address.',
    'contact.errorPrivacy': 'You must accept the privacy notice to continue.',
    'contact.statusSuccessDemo':
      "Demo mode: this form isn't connected to a live system yet. This submission was not sent to any server.",
    'contact.statusSuccess': "Done! Your request was sent. An LNX advisor will get in touch with you soon.",
    'contact.notProvided': 'Not provided',
    'contact.statusError': 'There was a problem sending your request. Please try again later.',
    'contact.statusWait': 'We already received your request. Please wait a few seconds before sending another.',
    'contact.statusInvalid': 'Please review the highlighted fields before continuing.',
    'contact.info1Title': 'Personalized response',
    'contact.info1Desc': 'An LNX advisor reviews your message and contacts you directly.',
    'contact.info2Title': 'No commitment',
    'contact.info2Desc': 'Requesting info or a demo does not commit you to anything.',
    'contact.info3Title': 'Protected data',
    'contact.info3Desc': 'Your information is only used to respond to your request.',
    'contact.info4Title': 'Write to us directly',

    'footer.privacy': 'Privacy notice',
    'footer.terms': 'Terms and conditions',
    'footer.rights': 'All rights reserved.',

    'notfound.title': 'Page not found',
    'notfound.text': 'The page you are looking for does not exist or was moved.',
    'notfound.cta': 'Back to home',
  },
};

export function t(locale, key) {
  const dict = dictionaries[locale] || dictionaries.es;
  return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
}

export function getInitialLocale() {
  if (typeof window === 'undefined') return 'es';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'es' || stored === 'en') return stored;
  const nav = (window.navigator.language || 'es').toLowerCase();
  return nav.startsWith('en') ? 'en' : 'es';
}

function updateMeta(locale) {
  if (typeof document === 'undefined') return;
  document.title = t(locale, 'meta.title');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t(locale, 'meta.description'));
}

export function applyTranslations(locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const value = t(locale, key);
    if (value !== key) el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    if (!spec) return;
    spec.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (!attr || !key) return;
      const value = t(locale, key);
      if (value !== key) el.setAttribute(attr, value);
    });
  });

  updateMeta(locale);
}

export function setLocale(locale) {
  const resolved = locale === 'en' ? 'en' : 'es';
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, resolved);
  }
  applyTranslations(resolved);
  if (typeof document !== 'undefined') {
    document.querySelectorAll('[data-locale]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-locale') === resolved));
    });
  }
  return resolved;
}

export { dictionaries };
