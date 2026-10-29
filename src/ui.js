// Icone SVG locali: nessun font o servizio esterno. Tutte decorative;
// i controlli mantengono sempre un nome testuale accessibile.
const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h1M15 15h1M8 18h1"/>',
  dumbbell: '<path d="m6.5 6.5 11 11M4 9l5-5M15 20l5-5M2 7l5-5M17 22l5-5M4.5 4.5l-2 2M17.5 17.5l-2 2M19.5 19.5l-2 2M8.5 8.5l-2 2"/>',
  book: '<path d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15M6 9h3M6 12h3M15 9h3M15 12h3"/>',
  data: '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="19" r="2" fill="currentColor"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  arrowUp: '<path d="M6 18 18 6M6 6h12v12"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  spark: '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3ZM20 2v4M18 4h4"/>',
  leaf: '<path d="M20 4C8 2 1 9 6 16s17 1 14-12ZM5 20 17 8M8 13h4v4"/>',
  bowl: '<path d="M3 12h18c0 5-4 8-9 8s-9-3-9-8ZM9 21h6M6 8c-2-2 2-3 0-5M12 8c-2-2 2-3 0-5M18 8c-2-2 2-3 0-5"/>',
  sweet: '<path d="M5 11h14l-2 10H7ZM4 11a4 4 0 0 1 3-6 5 5 0 0 1 10 0 4 4 0 0 1 3 6M9 14l1 4M15 14l-1 4"/>',
  wrap: '<path d="m4 8 8 13 8-13-8 4ZM4 8c0-3 3-5 8-5s8 2 8 5M8 6l2 3M14 6l2 3M11 4v3"/>',
  plate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M2 3v5m2-5v5M2 6h2m-1 2v13M22 3v18M22 3c-3 1-3 8 0 8"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
export function icon(name, className = '') {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.spark}</svg>`;
}
export function recipeArt(category, detail = false) {
  const kind = ({ 'Primi':'bowl', 'Secondi':'plate', 'Colazioni e dolci':'sweet', 'Piadine':'wrap', 'Piatti unici':'leaf' })[category] || 'book';
  return `<div class="recipe-art art-${kind} ${detail ? 'art-detail' : ''}" aria-hidden="true"><span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span><span class="art-spark"></span>${icon(kind)}<span class="art-caption">${({bowl:'IN CUCINA',plate:'IL TUO PIATTO',sweet:'UN MOMENTO DOLCE',wrap:'IDEE DA FARCIRE',leaf:'TUTTO IN UN PIATTO',book:'ISPIRAZIONE'})[kind]}</span></div>`;
}
