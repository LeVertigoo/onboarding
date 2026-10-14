// Contenu du volet 2 — "Création de contenu" (matière pour les templates).
// PLACEHOLDER : structure et routing posés maintenant ("architecture d'abord"),
// le wording exact de chaque question sera affiné avec Thomas ensuite.
// Même moteur de champs que data.js (text / textarea / scale / choice).

export const CONTENU_TITLE = 'Workbook · Création de contenu'

// La toute première question du volet : son choix détermine la route suivie
// juste après. Rendue par Contenu.jsx comme une section à part (pas via
// `sections`), parce qu'elle décide dynamiquement QUELLES sections suivent.
export const routeQuestion = {
  key: 'route',
  label: 'Comment décrirais-tu ta stratégie de contenu actuelle ?',
  type: 'choice',
  options: [
    { value: 'etablie', label: "J'ai déjà une stratégie bien établie" },
    { value: 'floue', label: "J'ai une approche, mais rien de formalisé" },
    { value: 'aucune', label: "Je publie sans vraiment suivre de structure" },
  ],
}

// Route A — stratégie déjà établie : peu de questions, on récupère surtout
// la matière déjà existante pour la mettre au format des templates.
const sectionsEtablie = [
  {
    id: 'contenu_etablie',
    num: '1',
    kind: 'single',
    title: 'Ta stratégie actuelle',
    subtitle: 'Le but ici est juste de récupérer ce qui existe déjà, pas de le refaire.',
    fields: [
      {
        key: 'resume',
        label: 'En 2-3 phrases, résume ta stratégie de contenu actuelle (piliers, cible, objectif).',
        type: 'textarea',
        placeholder: 'Ex. je publie sur 3 piliers : expertise, coulisses, retours clients...',
      },
      {
        key: 'document_ou_lien',
        label: "Colle ici un lien (Notion, Drive, Doc...) vers ta stratégie, ou colle directement le texte complet.",
        type: 'textarea',
        rows: 8,
        placeholder: 'https://... ou colle le texte complet ici',
      },
      {
        key: 'ce_qui_marche',
        label: 'Qu\'est-ce qui marche le mieux dans ce que tu fais déjà ?',
        type: 'textarea',
      },
    ],
  },
]

// Route B — stratégie existante mais pas formalisée : plus de questions,
// pour que Thomas puisse la remettre au propre derrière.
const sectionsFloue = [
  {
    id: 'contenu_floue',
    num: '1',
    kind: 'single',
    title: 'Ta façon de faire aujourd\'hui',
    fields: [
      { key: 'rythme', label: 'À quelle fréquence publies-tu ?', type: 'text' },
      { key: 'themes', label: 'De quoi parles-tu le plus souvent ? (thèmes récurrents)', type: 'textarea' },
      { key: 'cible', label: 'À qui s\'adressent tes posts, selon toi ?', type: 'textarea' },
      { key: 'objectif', label: 'Pourquoi publies-tu ? (notoriété, prospection, les deux...)', type: 'textarea' },
      { key: 'format_prefere', label: 'Quel format te réussit le mieux ? (texte seul, carrousel, vidéo...)', type: 'text' },
      { key: 'ce_qui_marche', label: 'As-tu une idée de ce qui marche / ne marche pas chez toi ?', type: 'textarea' },
    ],
  },
]

// Route C — aucune structure suivie : on creuse davantage pour construire
// la stratégie depuis zéro.
const sectionsAucune = [
  {
    id: 'contenu_aucune',
    num: '1',
    kind: 'single',
    title: 'Point de départ',
    fields: [
      { key: 'frequence_actuelle', label: 'Publies-tu régulièrement, occasionnellement, ou presque jamais ?', type: 'text' },
      { key: 'sujets_naturels', label: 'De quoi parles-tu naturellement, même en dehors de LinkedIn ?', type: 'textarea' },
      { key: 'expertise', label: 'Sur quoi te sens-tu le plus légitime pour parler ?', type: 'textarea' },
      { key: 'cible_ideale', label: 'Qui aimerais-tu toucher en priorité avec ton contenu ?', type: 'textarea' },
      { key: 'freins', label: 'Qu\'est-ce qui t\'a empêché de publier de façon régulière jusqu\'ici ?', type: 'textarea' },
      { key: 'exemples_inspirants', label: 'Y a-t-il des comptes / créateurs dont le style t\'inspire ?', type: 'textarea' },
    ],
  },
  {
    id: 'contenu_aucune_suite',
    num: '2',
    kind: 'single',
    title: 'Matière brute',
    fields: [
      { key: 'anecdotes', label: 'As-tu des anecdotes, expériences ou opinions fortes sur ton métier ?', type: 'textarea' },
      { key: 'questions_frequentes', label: 'Quelles questions tes clients/prospects te posent le plus souvent ?', type: 'textarea' },
    ],
  },
]

export function contenuSectionsFor(route) {
  if (route === 'etablie') return sectionsEtablie
  if (route === 'floue') return sectionsFloue
  if (route === 'aucune') return sectionsAucune
  return []
}

// Section finale générique (identique dans les 3 routes), ajoutée après les
// sections spécifiques à la route — pas de checklist ici, c'est volontaire :
// le volet est court quelle que soit la route.
export const contenuFinalSection = {
  id: 'final',
  num: 'fin',
  kind: 'final',
  title: 'Dernier mot',
  fields: [
    {
      key: 'mot_de_la_fin',
      label: 'Autre chose à préciser avant d\'envoyer ?',
      type: 'textarea',
    },
  ],
}

// La question de branchement, présentée comme une section à part entière
// (un seul champ `route`) — exportée pour que Contenu.jsx ET Espace.jsx (vue
// "Revoir mes réponses") partagent exactement la même définition.
export const routeSection = {
  id: 'route',
  num: '0',
  kind: 'single',
  title: 'Pour commencer',
  subtitle: 'Ta réponse ici détermine les questions qui suivent.',
  fields: [routeQuestion],
}

// Liste complète des sections d'un parcours donné (branchement + route +
// section finale), utilisée pour le récap (titres/labels corrects) comme
// pour le moteur de saisie.
export function buildContenuSections(route) {
  if (!route) return [routeSection]
  return [routeSection, ...contenuSectionsFor(route), contenuFinalSection]
}
