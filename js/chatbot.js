// Asistente virtual de LNX: widget de chat basado en reglas (sin backend ni IA externa).
// Responde tanto preguntas casuales/identidad como preguntas de negocio reutilizando
// el mismo contenido (no fabricado) que ya existe en el resto del sitio via i18n.js.
import { t } from './i18n.js';

const BOT_NAME = 'Chip';

const UI = {
  es: {
    toggleLabel: 'Abrir asistente virtual de LNX',
    closeLabel: 'Cerrar asistente',
    title: `${BOT_NAME} · Asistente LNX`,
    subtitle: 'En línea · respuestas automáticas',
    placeholder: 'Escribe tu pregunta…',
    send: 'Enviar',
    disclaimer: 'Asistente automático. Para tu caso específico, un asesor puede ayudarte por el formulario de contacto.',
    welcome: `¡Hola! 👋 Soy ${BOT_NAME}, el asistente virtual de LNX. Puedo responder preguntas sobre nuestras soluciones, terminales y proceso de contacto. ¿En qué te ayudo?`,
    typing: 'Procesando…',
    suggestions: ['¿Qué terminales tienen?', '¿Qué es OnTheFly?', '¿Cómo pido una demo?', '¿Cuánto cuesta?'],
  },
  en: {
    toggleLabel: 'Open LNX virtual assistant',
    closeLabel: 'Close assistant',
    title: `${BOT_NAME} · LNX Assistant`,
    subtitle: 'Online · automated replies',
    placeholder: 'Type your question…',
    send: 'Send',
    disclaimer: 'Automated assistant. For your specific case, an advisor can help through the contact form.',
    welcome: `Hi! 👋 I'm ${BOT_NAME}, the LNX virtual assistant. I can answer questions about our solutions, terminals and how to get in touch. How can I help?`,
    typing: 'Processing…',
    suggestions: ['What terminals do you have?', 'What is OnTheFly?', 'How do I request a demo?', 'How much does it cost?'],
  },
};

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:]/g, ' ')
    // La "h" es muda en español: normaliza "hola"/"ola", "haber"/"aber", etc.
    // al mismo texto para que la falta (o el exceso) de "h" no rompa la coincidencia.
    .replace(/h/g, '')
    // "q"/"k" sueltos son abreviaturas de chat muy comunes para "que" ("q onda", "k tal").
    .replace(/\bq\b/g, 'que')
    .replace(/\bk\b/g, 'que')
    .replace(/\s+/g, ' ')
    .trim();
}

// Distancia de edicion simple, usada solo para tolerar pequenos errores de tipeo
// en palabras de 4+ letras (por ejemplo "onlline" o "kien eres").
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = temp;
    }
  }
  return row[n];
}

function wordsMatch(a, b) {
  if (a === b) return true;
  // Debajo de 4 letras el corrector de errores se desactiva: con palabras tan
  // cortas (ej. "por"/"pos") una sola edicion de distancia junta palabras sin
  // ninguna relacion entre si.
  if (Math.min(a.length, b.length) < 4) return false;
  return levenshtein(a, b) <= 1;
}

function phraseMatches(inputWords, phrase) {
  const phraseWords = phrase.split(' ').filter(Boolean);
  return phraseWords.every((pw) => inputWords.some((iw) => wordsMatch(iw, pw)));
}

// Coincidencia rapida por substring; si falla, intenta una coincidencia difusa
// palabra por palabra (tolerante a orden distinto y pequenos typos).
// Coincidencia de frase exacta con limites de palabra: evita falsos positivos
// como "yo" dentro de "you" o "hey" dentro de "they" (un simple .includes()
// no respeta limites de palabra).
function containsPhrase(text, phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

function has(text, phrases) {
  if (phrases.some((p) => containsPhrase(text, p))) return true;
  const inputWords = text.split(' ').filter(Boolean);
  return phrases.some((p) => phraseMatches(inputWords, p));
}

function currentLocale() {
  return document.documentElement.lang === 'en' ? 'en' : 'es';
}

function formatTime(locale) {
  const now = new Date();
  return now.toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-MX', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(locale) {
  const now = new Date();
  return now.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// -------------------------------------------------------------------------
// Memoria del nombre de la persona (solo dentro de la sesion del navegador,
// via sessionStorage). Permite que Chip salude por nombre y personalice la
// conversacion sin ningun backend.
// -------------------------------------------------------------------------
const NAME_STORAGE_KEY = 'lnx-chat-name';

// Palabras que a veces siguen a "soy"/"i am" sin ser un nombre propio
// (evita que "soy nuevo aqui" se capture como si el nombre fuera "Nuevo").
const NAME_BLACKLIST = new Set([
  'nuevo', 'nueva', 'bien', 'mal', 'feliz', 'triste', 'un', 'una', 'de', 'tu', 'aqui',
  'cliente', 'dueño', 'dueno', 'gerente', 'asistente', 'bot', 'robot', 'humano',
  'fine', 'good', 'new', 'here', 'ok', 'okay', 'sure', 'a', 'the', 'not',
]);

function capitalizeName(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Busca frases tipo "me llamo X" / "mi nombre es X" / "soy X" / "my name is X"
// en el texto ORIGINAL (sin normalizar acentos/mayusculas) para poder devolver
// el nombre con capitalizacion natural.
export function extractIntroducedName(rawText) {
  const patterns = [
    /\bme llamo\s+([a-zA-ZÀ-ÿ]+)/i,
    /\bmi nombre es\s+([a-zA-ZÀ-ÿ]+)/i,
    /\bpuedes llamarme\s+([a-zA-ZÀ-ÿ]+)/i,
    /\bsoy\s+([a-zA-ZÀ-ÿ]+)\b/i,
    /\bmy name is\s+([a-zA-Z]+)/i,
    /\byou can call me\s+([a-zA-Z]+)/i,
    /\bcall me\s+([a-zA-Z]+)/i,
    /\bi am\s+([a-zA-Z]+)\b/i,
    /\bi'm\s+([a-zA-Z]+)\b/i,
  ];
  for (const re of patterns) {
    const match = rawText.match(re);
    if (match && match[1]) {
      const candidate = match[1];
      if (NAME_BLACKLIST.has(candidate.toLowerCase())) continue;
      return capitalizeName(candidate);
    }
  }
  return null;
}

function getStoredName() {
  try {
    return window.sessionStorage.getItem(NAME_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

function setStoredName(name) {
  try {
    window.sessionStorage.setItem(NAME_STORAGE_KEY, name);
  } catch {
    // sessionStorage no disponible (modo privado, etc.): la conversacion sigue funcionando sin memoria.
  }
}

function clearStoredName() {
  try {
    window.sessionStorage.removeItem(NAME_STORAGE_KEY);
  } catch {
    // no-op
  }
}

// -------------------------------------------------------------------------
// Deteccion ligera del tipo de negocio ("tengo un restaurante", "manejo una
// tienda"). Permite que, si aparece junto con una presentacion de nombre,
// Chip reconozca el contexto del negocio en el mismo saludo, en vez de dar
// siempre la misma respuesta generica.
// -------------------------------------------------------------------------
const BUSINESS_TYPE_PATTERNS = {
  es: [
    { re: /restaurante/i, article: 'un restaurante', possessive: 'como el tuyo' },
    { re: /cafeteri/i, article: 'una cafetería', possessive: 'como la tuya' },
    { re: /\btienda/i, article: 'una tienda', possessive: 'como la tuya' },
    { re: /mostrador/i, article: 'un comercio con mostrador', possessive: 'como el tuyo' },
    { re: /negocio de servicios|servicios profesionales/i, article: 'un negocio de servicios', possessive: 'como el tuyo' },
  ],
  en: [
    { re: /restaurant/i, article: 'a restaurant', possessive: 'like yours' },
    { re: /coffee shop|\bcafe\b/i, article: 'a coffee shop', possessive: 'like yours' },
    { re: /\bstore\b|retail/i, article: 'a retail store', possessive: 'like yours' },
    { re: /service business/i, article: 'a service business', possessive: 'like yours' },
  ],
};

// Devuelve el articulo/genero correctos (ej. "una cafetería" + "como la
// tuya") para poder insertarlos en una respuesta sin forzar un "un(a)" que
// no suena natural en español.
export function extractBusinessType(rawText, locale) {
  const patterns = BUSINESS_TYPE_PATTERNS[locale] || BUSINESS_TYPE_PATTERNS.es;
  for (const { re, article, possessive } of patterns) {
    if (re.test(rawText)) return { article, possessive };
  }
  return null;
}

const RECALL_NAME_WORDS = {
  es: ['te acuerdas de mi nombre', 'recuerdas mi nombre', 'cual es mi nombre', 'sabes como me llamo', 'como me llamo', 'sabes mi nombre'],
  en: ['do you remember my name', 'what is my name', 'who am i', 'do you know my name'],
};

// Compara contra la misma lista de frases que usa el intent 'recallName',
// para que la capa de UI sepa cuando Chip esta a punto de preguntar el
// nombre (y asi pueda esperar una respuesta corta como "Jairo").
export function asksToRecallName(rawText, locale) {
  const text = normalize(rawText);
  const words = RECALL_NAME_WORDS[locale] || RECALL_NAME_WORDS.es;
  return has(text, words.map(normalize));
}

// Palabras que indican intencion real de compra/contratacion: cuando aparecen,
// Chip ofrece un acceso directo al formulario de contacto (con el nombre ya
// capturado, si lo tiene) en vez de solo responder con texto.
const CTA_TRIGGER_WORDS = {
  es: [
    'precio', 'costo', 'cuanto cuesta', 'cuanto vale', 'demo', 'demostracion',
    'contratar', 'como empiezo', 'como contrato', 'me interesa', 'quiero contratar',
    'quiero una demo', 'solicitar informacion', 'me recomiendas', 'recomiendas comprar',
    'deberia comprar', 'vale la pena', 'puedo comprar', 'donde compro', 'me conviene',
    'garantia', 'soporte tecnico', 'cobertura', 'horario de atencion', 'tarjetas aceptan',
    'tengo un problema', 'mi terminal no funciona', 'cuanto tiempo tarda la instalacion',
  ],
  en: [
    'price', 'cost', 'demo', 'sign up', 'get started', 'how do i start',
    "i'm interested", 'i am interested', 'i want to sign up', 'request information',
    'do you recommend', 'should i buy', 'is it worth it', 'can i buy here', 'where do i buy',
    'warranty', 'technical support', 'coverage area', 'business hours',
    'i have a problem', 'not working', 'how long does installation take',
  ],
};

export function shouldShowContactCta(rawText, locale) {
  const text = normalize(rawText);
  const words = CTA_TRIGGER_WORDS[locale] || CTA_TRIGGER_WORDS.es;
  return has(text, words.map(normalize));
}

// Cada intent tiene palabras clave y una funcion que arma la respuesta segun el idioma.
// Se evaluan en orden: las mas especificas primero para evitar falsos positivos.
function buildIntents(locale, userName) {
  const faq = (key) => t(locale, key);

  return [
    {
      id: 'recallName',
      words: RECALL_NAME_WORDS[locale] || RECALL_NAME_WORDS.es,
      reply: () => {
        if (userName) {
          return locale === 'en' ? `Of course, you're ${userName}! 😊` : `¡Claro, tú eres ${userName}! 😊`;
        }
        return locale === 'en'
          ? "You haven't told me your name yet — what should I call you?"
          : 'Aún no me has dicho tu nombre, ¿cómo te llamas?';
      },
    },
    {
      id: 'forgetName',
      words:
        locale === 'en'
          ? ['forget my name', 'delete my name', 'remove my name']
          : ['olvida mi nombre', 'borra mi nombre', 'elimina mi nombre'],
      reply: () => {
        clearStoredName();
        return locale === 'en' ? 'Done, I forgot your name 🙂' : 'Listo, olvidé tu nombre 🙂';
      },
    },
    {
      id: 'creator',
      words:
        locale === 'en'
          ? [
              'who made you', 'who created you', 'who built you', 'who programmed you', 'who trained you',
              'who designed you', 'who is your creator', 'who is behind you',
            ]
          : [
              'quien te creo',
              'quien te hizo',
              'quien te programo',
              'quien te construyo',
              'quien te diseño',
              'quien te diseno',
              'quien te desarrollo',
              'quien te entreno',
              'quienes te crearon',
              'quienes te hicieron',
              'quien es tu creador',
              'tu creador',
              'quien te fabrico',
              'quien esta detras de ti',
              'quien esta detras de chip',
            ],
      reply: () =>
        locale === 'en'
          ? "Good question! 🙂 I'm a rule-based virtual assistant built for the LNX Payments website to help answer common questions about our solutions."
          : 'Buena pregunta 🙂 Soy un asistente virtual basado en reglas, creado para el sitio de LNX Payments para ayudar a responder preguntas comunes sobre nuestras soluciones.',
    },
    {
      id: 'companyIdentity',
      words:
        locale === 'en'
          ? [
              'who are you guys', 'what is lnx', 'tell me about lnx', 'what does lnx do', 'about the company',
              'who is lnx', 'who is the owner', 'who owns lnx', 'who runs lnx',
            ]
          : [
              'quienes son',
              'quien es lnx',
              'que es lnx',
              'cuentame de lnx',
              'hablame de lnx',
              'que hace lnx',
              'de que trata lnx',
              'a que se dedica lnx',
              'que es esta empresa',
              'que es esta pagina',
              'quien es el dueño',
              'quien es el dueno',
              'de quien es lnx',
              'quien dirige lnx',
              'quien administra lnx',
            ],
      reply: () => `🏢 ${faq('about.text')}`,
    },
    {
      id: 'identity',
      words:
        locale === 'en'
          ? ['who are you', 'what are you', 'tell me about yourself', 'tell me more about you']
          : [
              'quien eres',
              'que eres',
              'quien es usted',
              'quien sos',
              'con quien hablo',
              'kien eres',
              'cuentame de ti',
              'cuentame sobre ti',
              'cuentame mas sobre ti',
              'hablame de ti',
              'hablame sobre ti',
              'dime sobre ti',
            ],
      reply: () =>
        locale === 'en'
          ? `I'm ${BOT_NAME}, the LNX virtual assistant 🤖 I'm here to answer questions about payments, terminals and how LNX can support your business.`
          : `Soy ${BOT_NAME}, el asistente virtual de LNX 🤖 Estoy aquí para responder preguntas sobre pagos, terminales y cómo LNX puede ayudar a tu negocio.`,
    },
    {
      // "Te gusta tu nombre?" pregunta la opinion de Chip sobre SU PROPIO nombre;
      // es distinto de sugerirle uno nuevo (nicknameSuggestion), asi que debe
      // revisarse primero para no perderse contra el 'te gusta' generico de abajo.
      id: 'likesOwnName',
      words:
        locale === 'en'
          ? ['do you like your name', 'you like your name', 'do you like being called']
          : ['te gusta tu nombre', 'te gusta tu apodo', 'te gusta como te llamas', 'te gusta ser chip', 'te gusta el nombre chip'],
      reply: () =>
        locale === 'en'
          ? `I do! 😄 ${BOT_NAME} suits me well — short, easy to remember, and on-brand for LNX.`
          : `¡Sí, me gusta mucho! 😄 ${BOT_NAME} me queda bien: es corto, fácil de recordar y va con la marca de LNX.`,
    },
    {
      id: 'nicknameRequest',
      words:
        locale === 'en'
          ? ['better a nickname', 'give yourself a nickname', 'pick a nickname', 'choose a nickname']
          : ['mejor un apodo', 'ponte un apodo', 'dime tu apodo', 'un apodo', 'ponte un sobrenombre'],
      reply: () =>
        locale === 'en'
          ? `Well, my name is actually ${BOT_NAME} 😊 feel free to call me that!`
          : `Pues mi nombre ya es ${BOT_NAME} 😊 ¡puedes llamarme así!`,
    },
    {
      id: 'nicknameSuggestion',
      words:
        locale === 'en'
          ? [
              'do you like the name',
              'what if i call you',
              'can i call you',
              'call you',
              'name you',
              'your new name',
              'i want to call you',
              'i will call you',
              "i'll call you",
              'i name you',
            ]
          : [
              'te gusta',
              'que tal si te llamo',
              'puedo llamarte',
              'puedo decirte',
              'te puedo decir',
              'te puedo llamar',
              'me dejas llamarte',
              'puedo llamar',
              'llamarte',
              'voy a llamar',
              'de apodo',
              'tu nuevo nombre',
              'te bautizo',
              'te nombro',
              'te pondre',
              'te voy a poner',
            ],
      reply: () =>
        locale === 'en'
          ? `Ha, I appreciate it! 😄 But I'll stick with ${BOT_NAME} — it's easier for everyone to remember.`
          : `Jaja, ¡lo aprecio! 😄 Pero me quedo con ${BOT_NAME}, es más fácil de recordar.`,
    },
    {
      id: 'name',
      words:
        locale === 'en'
          ? ['your name', 'what should i call you', 'what is your name']
          : ['como te llamas', 'cual es tu nombre', 'tu nombre', 'como te dicen'],
      reply: () => (locale === 'en' ? `You can call me ${BOT_NAME} 👋` : `Puedes llamarme ${BOT_NAME} 👋`),
    },
    {
      id: 'purpose',
      words:
        locale === 'en'
          ? ['what do you do', 'what are you for', 'how can you help', 'what can you do', 'what can i ask you', 'help me']
          : [
              'que haces',
              'para que sirves',
              'en que me puedes ayudar',
              'que puedes hacer',
              'para que existes',
              'que puedo preguntarte',
              'en que me ayudas',
            ],
      reply: () =>
        locale === 'en'
          ? '💳 I can answer questions about LNX solutions, terminals, OnTheFly, pricing basics and how to reach an advisor. Try asking about any of those, or tap one of the suggestions below!'
          : '💳 Puedo responder preguntas sobre las soluciones de LNX, terminales, OnTheFly, precios en general y cómo contactar a un asesor. ¡Pregúntame sobre cualquiera de esos temas, o toca una de las sugerencias de abajo!',
    },
    {
      id: 'offTopic',
      words:
        locale === 'en'
          ? ['help me with something else', 'do you know about other topics', 'can you help with anything']
          : ['me ayudas con otra cosa', 'sabes de otros temas', 'me ayudas con algo mas'],
      reply: () =>
        locale === 'en'
          ? "I'm focused on LNX topics — payments, terminals and contact — so I might not be much help outside of that 🙂"
          : 'Estoy enfocado en temas de LNX: pagos, terminales y contacto, así que fuera de eso podría no ser de mucha ayuda 🙂',
    },
    {
      id: 'help',
      words:
        locale === 'en'
          ? ['help', 'menu', 'options', 'examples', "i don't understand", 'i dont understand', 'not clear']
          : ['ayuda', 'menu', 'opciones', 'ejemplos', 'que mas sabes', 'no entiendo', 'no comprendo', 'no me quedo claro'],
      reply: () =>
        locale === 'en'
          ? "🧭 Here are some things you can ask me: our solutions, terminals, OnTheFly, pricing, how to get started, security, or how to reach an advisor. What would you like to know?"
          : '🧭 Esto es lo que puedes preguntarme: nuestras soluciones, terminales, OnTheFly, precios, cómo empezar, seguridad, o cómo contactar a un asesor. ¿Qué te gustaría saber?',
    },
    {
      id: 'human',
      words:
        locale === 'en'
          ? ['are you human', 'are you a robot', 'are you real', 'are you a bot', 'are you ai']
          : ['eres humano', 'eres un robot', 'eres real', 'eres un bot', 'eres una persona', 'eres inteligencia artificial'],
      reply: () =>
        locale === 'en'
          ? "I'm a software assistant, not a human 🤖 — a set of automated rules designed to answer common questions quickly."
          : 'Soy un asistente de software, no una persona 🤖: un conjunto de respuestas automáticas pensado para resolver dudas comunes rápidamente.',
    },
    {
      id: 'age',
      words: locale === 'en' ? ['how old are you'] : ['cuantos anos tienes', 'cuantos años tienes', 'que edad tienes'],
      reply: () =>
        locale === 'en'
          ? "I don't have an age — I'm a program, not a person! 😄"
          : '¡No tengo edad, soy un programa, no una persona! 😄',
    },
    {
      id: 'origin',
      words: locale === 'en' ? ['where are you from', 'where do you live'] : ['de donde eres', 'donde vives', 'de donde vienes'],
      reply: () =>
        locale === 'en'
          ? "I don't have a physical location — I run right here in your browser, on the LNX Payments website 💻"
          : 'No tengo una ubicación física: funciono aquí mismo, en tu navegador, dentro del sitio de LNX Payments 💻',
    },
    {
      id: 'feelings',
      words:
        locale === 'en'
          ? ['do you have feelings', 'can you feel', 'are you bored', 'do you get bored']
          : ['tienes sentimientos', 'sientes algo', 'te aburres', 'te aburre'],
      reply: () =>
        locale === 'en'
          ? "I don't feel emotions the way people do, but I'm always glad to help you sort out a question 😊"
          : 'No siento emociones como una persona, pero siempre estoy contento de ayudarte a resolver una duda 😊',
    },
    {
      id: 'favoriteColor',
      words: locale === 'en' ? ['favorite color', 'favourite colour'] : ['color favorito', 'tu color favorito'],
      reply: () =>
        locale === 'en'
          ? "I'd say LNX blue 💙 it just feels right for a payments assistant."
          : 'Diría que el azul de LNX 💙 le queda perfecto a un asistente de pagos.',
    },
    {
      id: 'favoriteFood',
      words: locale === 'en' ? ['favorite food', 'favourite food', 'do you eat'] : ['comida favorita', 'que comes', 'comes'],
      reply: () =>
        locale === 'en'
          ? "I don't eat, but if I did, I'd probably order something fast — I'm all about quick transactions 😄"
          : 'No como, pero si lo hiciera, seguro pediría algo rápido: me van más las transacciones veloces 😄',
    },
    {
      id: 'relationshipStatus',
      words:
        locale === 'en'
          ? ['do you have a girlfriend', 'do you have a boyfriend', 'are you single', 'are you married']
          : ['tienes novia', 'tienes novio', 'estas soltero', 'estas soltera', 'estas casado', 'estas casada'],
      reply: () =>
        locale === 'en'
          ? "I'm single — and made of code 😄 Anything about LNX I can help you with?"
          : 'Estoy soltero... y hecho de código 😄 ¿Hay algo sobre LNX en lo que te pueda ayudar?',
    },
    {
      id: 'siblings',
      words: locale === 'en' ? ['do you have siblings', 'do you have brothers', 'do you have sisters'] : ['tienes hermanos', 'tienes hermanas'],
      reply: () =>
        locale === 'en'
          ? "No siblings, but the whole LNX team is behind me 😊"
          : 'No tengo hermanos, ¡pero todo el equipo de LNX está detrás de mí! 😊',
    },
    {
      id: 'canThink',
      words:
        locale === 'en'
          ? ['can you think', 'are you smart', 'are you intelligent']
          : ['puedes pensar', 'eres inteligente', 'eres listo', 'eres lista'],
      reply: () =>
        locale === 'en'
          ? "I follow rules rather than truly 'thinking' like a person, but I can help with quite a few questions about LNX 🙂"
          : 'Sigo reglas en vez de "pensar" como una persona, pero puedo ayudarte con bastantes preguntas sobre LNX 🙂',
    },
    {
      id: 'languages',
      words:
        locale === 'en'
          ? ['do you speak spanish', 'what languages do you speak', 'can you speak other languages']
          : ['hablas ingles', 'hablas español', 'hablas espanol', 'que idiomas hablas', 'sabes otros idiomas'],
      reply: () =>
        locale === 'en'
          ? 'I speak Spanish and English — you can switch the site language with the ES/EN button at the top.'
          : 'Hablo español e inglés. Puedes cambiar el idioma del sitio con el botón ES/EN en la parte superior.',
    },
    {
      id: 'hasMemory',
      words: locale === 'en' ? ['do you have memory', 'will you remember this'] : ['tienes memoria', 'te acordaras de esto'],
      reply: () =>
        locale === 'en'
          ? "I remember things like your name for as long as this tab stays open, but I don't save anything permanently 🙂"
          : 'Recuerdo cosas como tu nombre mientras esta pestaña siga abierta, pero no guardo nada de forma permanente 🙂',
    },
    {
      id: 'availability',
      words:
        locale === 'en'
          ? ['are you available 24', 'do you work all day', 'are you always available']
          : ['funcionas las 24 horas', 'estas disponible siempre', 'trabajas todo el dia', 'atiendes de noche'],
      reply: () =>
        locale === 'en'
          ? "Yes, I'm available 24/7 — unlike a human advisor, I don't need business hours 😊"
          : 'Sí, estoy disponible las 24 horas — a diferencia de un asesor humano, no tengo horario 😊',
    },
    {
      id: 'isFree',
      words: locale === 'en' ? ['are you free', 'does it cost to talk to you'] : ['eres gratis', 'cuesta hablar contigo', 'cuesta usarte'],
      reply: () =>
        locale === 'en'
          ? 'Yes, chatting with me is completely free 😊'
          : 'Sí, hablar conmigo no tiene ningún costo 😊',
    },
    {
      id: 'time',
      words:
        locale === 'en'
          ? ['what time is it', 'do you know the time', 'current time']
          : ['que hora es', 'sabes que hora es', 'dime la hora', 'la hora', 'que horas son'],
      reply: () =>
        locale === 'en'
          ? `🕒 It's around ${formatTime(locale)} on your device right now.`
          : `🕒 Ahora mismo son aproximadamente las ${formatTime(locale)} en tu dispositivo.`,
    },
    {
      id: 'date',
      words:
        locale === 'en'
          ? ['what day is it', "today's date", 'what date is it']
          : ['que dia es hoy', 'que fecha es', 'que dia es'],
      reply: () => (locale === 'en' ? `📅 Today is ${formatDate(locale)}.` : `📅 Hoy es ${formatDate(locale)}.`),
    },
    {
      id: 'howareyou',
      words:
        locale === 'en'
          ? ['how are you', 'how are things', "how's it going"]
          : ['como estas', 'que tal', 'como te va', 'como andas', 'todo bien', 'como vas'],
      reply: () =>
        locale === 'en'
          ? "I'm doing great, thanks for asking! 😊 How can I help with your payments or point-of-sale needs today?"
          : '¡Muy bien, gracias por preguntar! 😊 ¿En qué te puedo ayudar hoy sobre pagos o punto de venta?',
    },
    {
      id: 'compliment',
      words:
        locale === 'en'
          ? ['you are great', 'you are awesome', 'good job', 'you are helpful', 'i like you']
          : ['eres genial', 'eres el mejor', 'buen trabajo', 'me caes bien', 'eres muy util'],
      reply: () =>
        locale === 'en'
          ? "Aw, thank you! 🙌 Happy to help — what else would you like to know?"
          : '¡Gracias! 🙌 Con gusto te ayudo, ¿qué más te gustaría saber?',
    },
    {
      id: 'insult',
      words:
        locale === 'en'
          ? [
              'you are dumb', 'you are stupid', 'you are useless', 'you suck', 'shut up',
              'you are bad', 'this is bad', 'stupid', 'dumb', 'useless', 'idiot', 'garbage', 'terrible',
            ]
          : [
              'estas tonto',
              'eres tonto',
              'eres tonta',
              'eres inutil',
              'eres malo',
              'no sirves',
              'que tonto',
              'callate',
              'eres pesimo',
              'no sirves para nada',
              'tonto',
              'tonta',
              'estupido',
              'estupida',
              'idiota',
              'inutil',
              'pesimo',
              'pesima',
              'basura',
            ],
      reply: () =>
        locale === 'en'
          ? `Sorry if I didn't get that right 😅 I'm still a simple assistant. Try rephrasing your question, or ask me about solutions, terminals, pricing or how to reach an advisor.`
          : `Perdona si no entendí bien 😅 Todavía soy un asistente sencillo. Intenta reformular tu pregunta, o pregúntame sobre soluciones, terminales, precios o cómo contactar a un asesor.`,
    },
    {
      id: 'greeting',
      words:
        locale === 'en'
          ? ['hello', 'hi ', 'hi there', 'hey', 'good morning', 'good afternoon', 'good evening']
          : ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que onda', 'saludos', 'quiubo', 'oli'],
      reply: () =>
        locale === 'en'
          ? '👋 Hello! How can I help you today? You can ask me about our solutions, terminals or how to request a demo.'
          : '👋 ¡Hola! ¿Cómo puedo ayudarte hoy? Puedes preguntarme sobre nuestras soluciones, terminales o cómo solicitar una demostración.',
    },
    {
      id: 'thanks',
      words:
        locale === 'en'
          ? ['thank you', 'thanks', 'appreciate it', 'thank u']
          : ['gracias', 'muchas gracias', 'te agradezco', 'mil gracias'],
      reply: () =>
        (locale === 'en' ? "You're welcome! 🙌 Anything else I can help with?" : '¡De nada! 🙌 ¿Hay algo más en lo que te pueda ayudar?'),
    },
    {
      id: 'bye',
      words: locale === 'en' ? ['bye', 'goodbye', 'see you', 'later'] : ['adios', 'hasta luego', 'nos vemos', 'bye', 'me voy'],
      reply: () =>
        locale === 'en'
          ? '👋 Goodbye! Feel free to reopen this chat anytime you have a question.'
          : '👋 ¡Hasta luego! Puedes volver a abrir este chat cuando quieras si tienes otra pregunta.',
    },
    {
      id: 'joke',
      words:
        locale === 'en'
          ? ['tell me a joke', 'joke', 'do you know jokes', 'can you tell jokes']
          : ['cuentame un chiste', 'dime un chiste', 'un chiste', 'sabes chistes', 'sabes contar chistes'],
      reply: () =>
        locale === 'en'
          ? 'Why did the card reader stay calm? Because it always knew how to keep things... contactless. 😄'
          : '¿Por qué la terminal de pago nunca se estresa? Porque siempre resuelve todo sin ningún contacto. 😄',
    },
    {
      id: 'pricing',
      words:
        locale === 'en'
          ? ['price', 'cost', 'how much', 'fees', 'rate']
          : ['precio', 'costo', 'cuanto cuesta', 'tarifa', 'comision', 'comisiones', 'cuanto vale'],
      reply: () =>
        locale === 'en'
          ? '💰 Pricing depends on your business type and volume — an LNX advisor can share the right plan after learning about your operation. Want me to point you to the contact form?'
          : '💰 El costo depende del tipo de negocio y volumen de ventas. Un asesor de LNX puede compartirte el plan adecuado después de conocer tu operación. ¿Quieres que te lleve al formulario de contacto?',
    },
    {
      id: 'purchaseRecommendation',
      words:
        locale === 'en'
          ? [
              'do you recommend', 'should i buy', 'should i get', 'is it worth it', 'is it worth buying',
              'can i buy here', 'where do i buy', 'is this good', 'is this reliable',
            ]
          : [
              'me recomiendas',
              'recomiendas comprar',
              'deberia comprar',
              'debo comprar',
              'vale la pena',
              'es bueno esto',
              'es bueno el servicio',
              'puedo comprar aqui',
              'puedo comprar',
              'aqui se puede comprar',
              'donde compro',
              'donde puedo comprar',
              'me conviene',
            ],
      reply: () =>
        locale === 'en'
          ? '👍 Based on what you need, an LNX advisor can tell you if this is the right fit for your business — that way the recommendation is tailored to your operation, not generic. Want me to take you to the contact form?'
          : '👍 Según lo que necesites, un asesor de LNX puede decirte si esto es lo más conveniente para tu negocio, así la recomendación va a la medida de tu operación y no es genérica. ¿Quieres que te lleve al formulario de contacto?',
    },
    {
      // Una queja/problema concreto debe ganarle al intent generico de
      // "terminales" (que solo busca la palabra "terminal" en el texto).
      id: 'supportProblem',
      words:
        locale === 'en'
          ? ['i have a problem', 'my terminal is not working', 'who do i contact if it fails', 'something is wrong']
          : [
              'tengo un problema',
              'que pasa si tengo un problema',
              'a quien contacto si falla',
              'mi terminal no funciona',
              'se descompuso mi terminal',
              'algo salio mal',
            ],
      reply: () =>
        locale === 'en'
          ? "Sorry to hear that! For an issue with your equipment or service, the fastest way is to reach an LNX advisor through the contact form so they can look into your specific case."
          : '¡Lamento escuchar eso! Para un problema con tu equipo o servicio, lo más rápido es contactar a un asesor de LNX a través del formulario de contacto para que revise tu caso específico.',
    },
    {
      // "Cual es la mejor/mas vendida" va antes del intent generico de terminales:
      // no tenemos datos reales de ventas, asi que Chip lo admite en vez de
      // inventar un modelo "estrella".
      id: 'bestSeller',
      words:
        locale === 'en'
          ? ['best seller', 'best selling', 'most popular terminal', 'which terminal is best', 'top terminal', 'star product', 'flagship product']
          : [
              'mas vendida',
              'mas vendidas',
              'terminal estrella',
              'producto estrella',
              'productos estrella',
              'la mejor terminal',
              'cual es la mejor terminal',
              'terminal mas popular',
              'cual terminal me recomiendas',
            ],
      reply: () =>
        locale === 'en'
          ? "I don't have sales-ranking data to point to a single 'best seller' — it really depends on your type of business. An LNX advisor can recommend the right terminal once they know your operation."
          : 'No tengo datos de ventas para señalar una "más vendida": realmente depende del tipo de negocio. Un asesor de LNX puede recomendarte la terminal adecuada después de conocer tu operación.',
    },
    {
      id: 'onthefly',
      words: ['onthefly', 'on the fly'],
      reply: () => `🔗 ${faq('onthefly.lede')} ${faq('faq.a2')}`,
    },
    {
      id: 'onboarding',
      words:
        locale === 'en'
          ? [
              'get started', 'start using', 'how do i start', 'sign up', 'onboarding',
              'how long does installation take', 'how long does setup take', 'need training',
            ]
          : [
              'como empiezo',
              'como contrato',
              'como me doy de alta',
              'como inicio',
              'como comienzo',
              'cuanto tiempo tarda la instalacion',
              'cuanto tarda la instalacion',
              'cuanto demora la instalacion',
              'necesito capacitacion',
              'dan capacitacion',
            ],
      reply: () => `🚀 ${faq('faq.a3')}`,
    },
    {
      id: 'reports',
      words:
        locale === 'en'
          ? ['what reports', 'sales reports', 'see my daily sales', 'view my sales']
          : ['que reportes genera', 'reportes de ventas', 'ver mis ventas del dia', 'ver mis ventas'],
      reply: () => `📊 ${faq('solutions.item4.desc')}`,
    },
    {
      id: 'multiUser',
      words:
        locale === 'en'
          ? ['multiple users', 'add employees', 'add cashiers', 'manage inventory', 'inventory control']
          : [
              'varios usuarios',
              'multiples usuarios',
              'agregar empleados',
              'agregar cajeros',
              'control de inventario',
              'manejo de inventario',
              'administrar inventario',
            ],
      reply: () => `👥 ${faq('solutions.item2.desc')} ${faq('solutions.item3.desc')}`,
    },
    {
      id: 'paymentMethods',
      words:
        locale === 'en'
          ? ['accept qr', 'accept contactless', 'accept nfc', 'which payment methods']
          : [
              'aceptan pagos con qr',
              'aceptan contactless',
              'aceptan nfc',
              'que metodos de pago aceptan',
              'aceptan codigo qr',
              'pago sin contacto',
            ],
      reply: () =>
        locale === 'en'
          ? "💳 Based on what's shown in our terminal demo, it's built to accept card, contactless and QR payments. An LNX advisor can confirm the exact options for your business."
          : '💳 Según lo que se muestra en la demostración de nuestra terminal, está pensada para aceptar pagos con tarjeta, contactless y código QR. Un asesor de LNX puede confirmarte las opciones exactas para tu negocio.',
    },
    {
      id: 'businessFit',
      words:
        locale === 'en'
          ? ['is this good for my restaurant', 'is this good for my store', 'works for my business', 'good for my shop']
          : [
              'sirve para mi restaurante',
              'sirve para mi tienda',
              'sirve para mi cafeteria',
              'sirve para mi negocio',
              'funciona para mi negocio',
              'es para restaurantes',
              'es para tiendas',
            ],
      reply: () => `🏪 ${faq('business.lede')}`,
    },
    {
      id: 'whyChooseLnx',
      words:
        locale === 'en'
          ? ['why choose lnx', 'why lnx', 'what makes lnx different', 'why should i choose you']
          : ['por que elegir lnx', 'por que lnx', 'que los diferencia', 'que hace diferente a lnx', 'por que elegirlos'],
      reply: () => `✨ ${faq('why.item1.desc')} ${faq('why.item2.desc')}`,
    },
    {
      id: 'smallbusiness',
      words:
        locale === 'en'
          ? ['small business', 'small merchant']
          : ['negocio pequeño', 'negocio pequeno', 'pequeño negocio', 'pequeno negocio', 'micronegocio'],
      reply: () => faq('faq.a4'),
    },
    {
      id: 'existingpos',
      words:
        locale === 'en'
          ? ['already have a pos', 'existing system', 'switch systems']
          : ['ya tengo un sistema', 'ya tengo punto de venta', 'cambiar de sistema', 'ya uso otro pos'],
      reply: () => faq('faq.a5'),
    },
    {
      id: 'demo',
      words: locale === 'en' ? ['demo', 'demonstration', 'trial'] : ['demo', 'demostracion', 'prueba'],
      reply: () =>
        locale === 'en'
          ? '📅 You can request a demo using the "Request a demo" button at the top of the page or the contact form below — an advisor will reach out to you.'
          : '📅 Puedes solicitar una demostración con el botón "Solicitar una demostración" en la parte superior o con el formulario de contacto más abajo; un asesor te contactará.',
    },
    {
      id: 'contact',
      words:
        locale === 'en'
          ? ['contact', 'phone number', 'email address', 'talk to someone', 'speak to a person', 'human advisor']
          : ['contacto', 'telefono', 'correo', 'hablar con alguien', 'hablar con un asesor', 'asesor'],
      reply: () =>
        locale === 'en'
          ? '✉️ The best way to reach the team is through the contact form on this page — fill it out and an LNX advisor will get back to you.'
          : '✉️ La mejor forma de contactar al equipo es a través del formulario de contacto en esta página; complétalo y un asesor de LNX te responderá.',
    },
    {
      // Preguntas legitimas pero cuya respuesta exacta no esta documentada en el
      // sitio (garantia, cobertura, tarjetas aceptadas, horarios, envios, planes
      // de pago, etc). En vez de caer en el fallback generico, Chip reconoce el
      // tema y honestamente deriva a un asesor, sin inventar datos. Va antes de
      // los intents genericos (security/solutions) para que no se la ganen.
      id: 'unconfirmedDetails',
      words:
        locale === 'en'
          ? [
              'warranty', 'technical support', 'repair', 'what countries', 'what cities',
              'coverage area', 'which cards', 'what cards', 'shipping', 'installments',
              'business hours', 'opening hours', 'cancel anytime', 'lock-in contract',
              'where are you located', 'do you have offices', 'physical store',
              'when was lnx founded', 'how many employees', 'how many customers',
              'do you need internet', 'does it work offline', 'how many branches',
            ]
          : [
              'garantia',
              'que garantia',
              'soporte tecnico',
              'reparacion',
              'se descompone',
              'en que paises',
              'en que ciudades',
              'dan servicio en',
              'cobertura',
              'que tarjetas aceptan',
              'tarjetas aceptan',
              'envio a domicilio',
              'hacen envios',
              'pagar a meses',
              'meses sin intereses',
              'horario de atencion',
              'horario de servicio',
              'cancelar en cualquier momento',
              'contrato de permanencia',
              'donde estan ubicados',
              'tienen oficinas',
              'tienen sucursal',
              'cuantas sucursales',
              'varias sucursales',
              'cuando se fundo',
              'desde cuando existen',
              'cuantos empleados',
              'cuantos clientes tienen',
              'cuanta gente trabaja',
              'necesita internet',
              'funciona sin internet',
              'necesito internet',
            ],
      reply: () =>
        locale === 'en'
          ? "That's a detail that can vary, and I don't want to give you an inaccurate answer. An LNX advisor can confirm that for you exactly. Want me to take you to the contact form?"
          : 'Ese es un detalle que puede variar, y no quiero darte un dato incorrecto. Un asesor de LNX puede confirmártelo con exactitud. ¿Quieres que te lleve al formulario de contacto?',
    },
    {
      id: 'security',
      words: locale === 'en' ? ['secure', 'security', 'safe', 'fraud'] : ['seguro', 'seguridad', 'fraude', 'proteccion de datos'],
      reply: () => `🔒 ${faq('contact.info3Desc')}`,
    },
    {
      // Intent generico: se revisa casi al final para que preguntas mas
      // especificas sobre una terminal (precio, garantia, seguridad, metodos
      // de pago...) no se las gane solo por mencionar la palabra "terminal".
      id: 'terminals',
      words:
        locale === 'en'
          ? ['terminal', 'device', 'pos system', 'hardware', 'reader']
          : ['terminal', 'terminales', 'equipo', 'dispositivo', 'lector', 'pos'],
      reply: () =>
        (locale === 'en'
          ? '🖥️ We offer a mobile terminal, a countertop terminal, a POS system and an all-in-one solution. '
          : '🖥️ Contamos con una terminal móvil, una terminal de mostrador, un sistema POS y una solución todo en uno. ') +
        faq('faq.a1'),
    },
    {
      id: 'solutions',
      words: locale === 'en' ? ['solutions', 'what do you offer', 'products'] : ['soluciones', 'que ofrecen', 'productos', 'servicios'],
      reply: () => faq('solutions.lede'),
    },
  ];
}

const GREETING_PREFIXES = {
  es: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'que onda', 'oli'],
  en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
};

export function matchReply(rawText, locale, userName) {
  const text = normalize(rawText);
  if (!text) return null;
  const intents = buildIntents(locale, userName);

  // Si el mensaje combina un saludo con una pregunta real ("hola, cuanto
  // cuesta?"), responde la pregunta y reconoce el saludo, en vez de solo
  // saludar de vuelta e ignorar el resto.
  const prefixes = GREETING_PREFIXES[locale] || GREETING_PREFIXES.es;
  for (const prefix of prefixes) {
    const p = normalize(prefix);
    if (text === p) continue;
    if (!text.startsWith(`${p} `) && !text.startsWith(`${p},`)) continue;
    const rest = text.slice(p.length).replace(/^,/, '').trim();
    if (rest.length <= 2) continue;
    for (const intent of intents) {
      if (intent.id === 'greeting') continue;
      if (has(rest, intent.words.map(normalize))) {
        const greetingWord = locale === 'en' ? 'Hi! ' : '¡Hola! ';
        return greetingWord + intent.reply();
      }
    }
  }

  for (const intent of intents) {
    if (has(text, intent.words.map(normalize))) {
      return intent.reply();
    }
  }
  return null;
}

const AFFIRMATIVE_WORDS = {
  es: ['si', 'sí', 'claro', 'va', 'dale', 'porfa', 'porfavor', 'por favor', 'de acuerdo', 'ok', 'okay', 'vale', 'adelante', 'hazlo', 'llevame'],
  en: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'go ahead', 'please', 'do it'],
};

const NEGATIVE_WORDS = {
  es: ['no', 'no gracias', 'ahora no', 'luego', 'despues', 'mejor no'],
  en: ['no', 'not now', 'no thanks', 'later', 'nope'],
};

// Solo se consideran confirmaciones cuando el mensaje es corto: evita que una
// pregunta larga que de casualidad contenga "si"/"no" se trate como respuesta
// a la oferta anterior del formulario de contacto.
function isShortReplyOfType(rawText, locale, wordMap) {
  const text = normalize(rawText);
  const wordCount = text.split(' ').filter(Boolean).length;
  if (wordCount === 0 || wordCount > 4) return false;
  const words = wordMap[locale] || wordMap.es;
  return has(text, words.map(normalize));
}

export function isShortAffirmative(rawText, locale) {
  return isShortReplyOfType(rawText, locale, AFFIRMATIVE_WORDS);
}

export function isShortNegative(rawText, locale) {
  return isShortReplyOfType(rawText, locale, NEGATIVE_WORDS);
}

// Detecta un mensaje que parece ser solo un nombre suelto (1-2 palabras, solo
// letras), para usarse cuando Chip acaba de preguntar "¿como te llamas?" y la
// persona responde simplemente "Jairo" sin ningun "me llamo" delante.
export function looksLikeBareName(rawText) {
  const trimmed = String(rawText).trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > 2) return false;
  return words.every((w) => /^[a-zA-ZÀ-ÿ]{2,}$/.test(w));
}

export function fallbackReply(locale) {
  return locale === 'en'
    ? "I'm not sure I understood that. You can ask me about our solutions, terminals, OnTheFly, pricing, or how to request a demo — or use the contact form below to reach a human advisor."
    : 'No estoy seguro de haber entendido eso. Puedes preguntarme sobre nuestras soluciones, terminales, OnTheFly, precios o cómo solicitar una demostración; también puedes usar el formulario de contacto para hablar con un asesor.';
}

export function initChatbot() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('chatbot-toggle')) return;

  const root = document.createElement('div');
  root.className = 'chatbot';
  root.innerHTML = `
    <button type="button" id="chatbot-toggle" class="chatbot-toggle" aria-haspopup="dialog" aria-expanded="false" aria-controls="chatbot-panel">
      <span class="chatbot-toggle__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1-3.3A7.96 7.96 0 0 1 4 12Z" stroke-linejoin="round" stroke-linecap="round" />
          <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span class="chatbot-toggle__pulse" aria-hidden="true"></span>
    </button>

    <div id="chatbot-panel" class="chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="chatbot-title" hidden>
      <header class="chatbot-panel__header">
        <div class="chatbot-panel__identity">
          <span class="chatbot-panel__avatar" aria-hidden="true">LNX</span>
          <div>
            <p class="chatbot-panel__title" id="chatbot-title"></p>
            <p class="chatbot-panel__subtitle"></p>
          </div>
        </div>
        <button type="button" class="chatbot-panel__close" aria-label="">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" /></svg>
        </button>
      </header>

      <div class="chatbot-messages" id="chatbot-messages" role="log" aria-live="polite"></div>

      <div class="chatbot-suggestions" id="chatbot-suggestions"></div>

      <form class="chatbot-form" id="chatbot-form">
        <input type="text" id="chatbot-input" class="chatbot-input" autocomplete="off" />
        <button type="submit" class="chatbot-send" aria-label="">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16M14 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
      </form>
      <p class="chatbot-disclaimer"></p>
    </div>
  `;
  document.body.appendChild(root);

  const toggle = document.getElementById('chatbot-toggle');
  const panel = document.getElementById('chatbot-panel');
  const closeBtn = panel.querySelector('.chatbot-panel__close');
  const messages = document.getElementById('chatbot-messages');
  const suggestions = document.getElementById('chatbot-suggestions');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const titleEl = panel.querySelector('#chatbot-title');
  const subtitleEl = panel.querySelector('.chatbot-panel__subtitle');
  const disclaimerEl = panel.querySelector('.chatbot-disclaimer');
  const sendBtn = panel.querySelector('.chatbot-send');

  let opened = false;
  let welcomed = false;
  let userName = getStoredName();
  // Cuando Chip ofrece el formulario de contacto, un "si"/"no" corto en el
  // siguiente mensaje se interpreta como respuesta a esa oferta especifica,
  // en vez de perderse en el fallback generico.
  let awaitingCtaConfirmation = false;
  // Cuando Chip pregunta "¿como te llamas?" (via el intent recallName sin
  // nombre guardado todavia), un mensaje corto que solo parece un nombre se
  // interpreta como la respuesta a esa pregunta.
  let awaitingNameReply = false;

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `chatbot-msg chatbot-msg--${role}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function goToContactForm() {
    const contactSection = document.getElementById('contact');
    const nameField = document.getElementById('field-name');
    if (nameField && userName && !nameField.value) nameField.value = userName;
    if (contactSection) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      contactSection.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    }
    closePanel();
  }

  function addContactCta(locale) {
    awaitingCtaConfirmation = true;
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-cta';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chatbot-cta__btn';
    btn.textContent = locale === 'en' ? 'Go to the contact form' : 'Ir al formulario de contacto';
    btn.addEventListener('click', () => {
      awaitingCtaConfirmation = false;
      goToContactForm();
    });
    wrap.appendChild(btn);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(locale) {
    const typing = document.createElement('div');
    typing.className = 'chatbot-msg chatbot-msg--bot chatbot-msg--typing';
    typing.id = 'chatbot-typing';

    const label = document.createElement('span');
    label.className = 'chatbot-typing__label';
    label.textContent = UI[locale].typing;
    typing.appendChild(label);

    const dots = document.createElement('span');
    dots.className = 'chatbot-typing__dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    typing.appendChild(dots);

    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    return typing;
  }

  function respondTo(userText) {
    const locale = currentLocale();
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600;

    // Si Chip acaba de ofrecer el formulario de contacto, revisa primero si
    // este mensaje corto es la respuesta a esa oferta ("si"/"no").
    if (awaitingCtaConfirmation) {
      awaitingCtaConfirmation = false;
      if (isShortAffirmative(userText, locale)) {
        const typing = showTyping(locale);
        window.setTimeout(() => {
          typing.remove();
          addMessage(locale === 'en' ? "Great, let's go! 👍" : '¡Perfecto, vamos! 👍', 'bot');
          goToContactForm();
        }, delay);
        return;
      }
      if (isShortNegative(userText, locale)) {
        const typing = showTyping(locale);
        window.setTimeout(() => {
          typing.remove();
          addMessage(
            locale === 'en' ? "No problem, I'm here if you have another question 🙂" : '¡Sin problema! Aquí estoy si tienes otra pregunta 🙂',
            'bot'
          );
        }, delay);
        return;
      }
      // No fue un "si"/"no" corto: sigue el flujo normal con este mensaje.
    }

    // Si Chip acaba de preguntar el nombre y este mensaje no encaja con
    // ninguna otra pregunta reconocida, y parece un nombre suelto ("Jairo"),
    // se toma como la respuesta a esa pregunta.
    if (awaitingNameReply) {
      awaitingNameReply = false;
      if (!extractIntroducedName(userText) && !matchReply(userText, locale, userName) && looksLikeBareName(userText)) {
        const bareName = userText.trim().split(/\s+/).map(capitalizeName).join(' ');
        userName = bareName;
        setStoredName(bareName);
        const typing = showTyping(locale);
        window.setTimeout(() => {
          typing.remove();
          addMessage(
            locale === 'en' ? `Nice to meet you, ${bareName}! 😊 How can I help you today?` : `¡Mucho gusto, ${bareName}! 😊 ¿En qué te puedo ayudar hoy?`,
            'bot'
          );
        }, delay);
        return;
      }
      // No parecia un nombre: sigue el flujo normal con este mensaje.
    }

    const typing = showTyping(locale);

    // Si la persona se presenta ("me llamo...", "soy...", "my name is..."),
    // Chip recuerda el nombre por el resto de la sesion del navegador.
    const introducedName = extractIntroducedName(userText);
    if (introducedName) {
      userName = introducedName;
      setStoredName(introducedName);
    }
    // Si la presentacion menciona ademas el tipo de negocio ("me llamo Juan,
    // tengo un restaurante"), Chip lo reconoce en el mismo saludo.
    const businessType = introducedName ? extractBusinessType(userText, locale) : null;

    const showCta = shouldShowContactCta(userText, locale);

    window.setTimeout(() => {
      typing.remove();
      let reply;
      if (introducedName && businessType) {
        reply =
          locale === 'en'
            ? `Nice to meet you, ${introducedName}! 😊 For ${businessType.article} ${businessType.possessive}, LNX connects payments and daily operations to keep things simple. What would you like to know?`
            : `¡Mucho gusto, ${introducedName}! 😊 Para ${businessType.article} ${businessType.possessive}, LNX conecta pagos y operación diaria para simplificar todo. ¿Qué te gustaría saber?`;
      } else if (introducedName) {
        reply =
          locale === 'en'
            ? `Nice to meet you, ${introducedName}! 😊 How can I help you today?`
            : `¡Mucho gusto, ${introducedName}! 😊 ¿En qué te puedo ayudar hoy?`;
      } else {
        reply = matchReply(userText, locale, userName) || fallbackReply(locale);
        if (!userName && asksToRecallName(userText, locale)) awaitingNameReply = true;
      }
      addMessage(reply, 'bot');
      if (showCta) addContactCta(locale);
    }, delay);
  }

  function renderStrings() {
    const locale = currentLocale();
    const strings = UI[locale];
    toggle.setAttribute('aria-label', strings.toggleLabel);
    closeBtn.setAttribute('aria-label', strings.closeLabel);
    titleEl.textContent = strings.title;
    subtitleEl.textContent = strings.subtitle;
    input.setAttribute('placeholder', strings.placeholder);
    sendBtn.setAttribute('aria-label', strings.send);
    disclaimerEl.textContent = strings.disclaimer;

    suggestions.innerHTML = '';
    strings.suggestions.forEach((label) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chatbot-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => {
        addMessage(label, 'user');
        respondTo(label);
      });
      suggestions.appendChild(chip);
    });
  }

  function openPanel() {
    opened = true;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('chatbot-panel--open'));
    toggle.setAttribute('aria-expanded', 'true');
    if (!welcomed) {
      welcomed = true;
      const locale = currentLocale();
      const greeting = userName
        ? locale === 'en'
          ? `Hi again, ${userName}! 👋 What would you like to know this time?`
          : `¡Hola de nuevo, ${userName}! 👋 ¿Qué te gustaría saber esta vez?`
        : UI[locale].welcome;
      addMessage(greeting, 'bot');
    }
    window.setTimeout(() => input.focus(), 150);
  }

  function closePanel() {
    opened = false;
    panel.classList.remove('chatbot-panel--open');
    toggle.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      if (!opened) panel.hidden = true;
    }, 200);
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (opened) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && opened) closePanel();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    addMessage(value, 'user');
    input.value = '';
    respondTo(value);
  });

  document.querySelectorAll('[data-locale]').forEach((btn) => {
    btn.addEventListener('click', () => renderStrings());
  });

  renderStrings();
}
