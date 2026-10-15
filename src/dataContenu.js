// Contenu du volet 2, "Le Fond de l'Évidence : Volet Contenu" (matière pour
// les templates). Même moteur de champs que data.js (text / textarea / scale
// / choice / multichoice, ce dernier pour les QCM à sélection multiple).
//
// Principe directeur (quelle que soit la route) : ce formulaire ne sert qu'à
// mettre au propre la stratégie de contenu du client pour que Thomas puisse
// en déduire les besoins visuels (carrousels à faire, infographies si besoin,
// etc.). Ce n'est pas un audit ou un process de consulting. On ne creuse
// donc jamais plus que nécessaire pour ça.
//
// Seulement 2 routes : "etablie" (stratégie déjà posée, on récupère
// l'existant) et "floue" (une approche mais rien de formalisé, on capture ce
// qui se fait déjà). La route "aucune" (publication sans structure, avec un
// niveau de questions proche d'un audit de consulting) a été retirée : elle
// allait trop loin pour l'usage réel de ce formulaire.

export const CONTENU_TITLE = 'Le Fond de l\'Évidence : Volet Contenu'

// Options de formats partagées entre la route "floue" (ce qu'ils font déjà
// aujourd'hui) et la section "Visuels, besoins et envies" (ce qu'ils veulent
// utiliser, commune aux 2 routes), pour rester cohérent entre les deux.
const FORMAT_OPTIONS = [
  { value: 'carrousel', label: 'Carrousel multi-slides' },
  { value: 'avant_apres', label: 'Visuel avant / après' },
  { value: 'infographie', label: 'Infographie' },
  { value: 'photo_texte', label: 'Photo de toi avec texte en overlay' },
  { value: 'photo_seule', label: 'Photo de toi seule, sans texte' },
  { value: 'video', label: 'Vidéo / Reel' },
  { value: 'texte_seul', label: 'Texte seul, sans visuel' },
]

// La toute première question du volet : son choix détermine la route suivie
// juste après.
export const routeQuestion = {
  key: 'route',
  label: 'Comment décrirais-tu ta stratégie de contenu actuelle ?',
  type: 'choice',
  options: [
    {
      value: 'etablie',
      label: "J'ai déjà une stratégie bien établie",
      description:
        "Tu publies depuis des mois voire des années, tu as déjà analysé tes posts, tu sais ce qui fonctionne ou pas, et tu as un document stratégique et/ou un planning de contenu.",
    },
    {
      value: 'floue',
      label: "J'ai une approche, mais rien de formalisé",
      description:
        "Tu publies avec une certaine logique en tête (des thèmes récurrents, une fréquence), mais ça n'a jamais été écrit ou structuré nulle part, ou tu as un document, une note, un résumé, mais pas complètement clair ou abouti.",
    },
  ],
}

// Route A (stratégie déjà établie) : le strict minimum, on récupère la
// matière déjà existante pour la mettre au format des templates. Pas
// d'upload de fichier ici (volontaire, demandé explicitement) : un lien ou
// un texte collé dans un grand textarea suffit.
const sectionsEtablie = [
  {
    id: 'contenu_etablie',
    num: '1',
    kind: 'single',
    title: 'Ta stratégie actuelle',
    subtitle: 'Le but ici est juste de récupérer ce qui existe déjà, pas de le refaire.',
    fields: [
      {
        key: 'document_ou_lien',
        label: "Colle ici un lien (Notion, Drive, Doc...) vers ta stratégie, ou colle directement le texte complet.",
        type: 'textarea',
        rows: 10,
        placeholder: 'https://... ou colle le texte complet ici',
      },
      {
        key: 'precision',
        label: "Autre chose d'important pour qu'on puisse la réutiliser telle quelle ?",
        type: 'textarea',
        placeholder: 'Optionnel',
      },
    ],
  },
]

// Route B (stratégie existante mais pas formalisée) : ne creuse quasiment
// pas, le but est juste de capturer ce qui se fait déjà aujourd'hui pour
// que Thomas puisse le mettre au propre derrière.
const sectionsFloue = [
  {
    id: 'contenu_floue',
    num: '1',
    kind: 'single',
    title: "Ce que tu fais déjà aujourd'hui",
    subtitle: 'Pas besoin que ça soit structuré ou propre, on veut juste ce qui existe réellement.',
    fields: [
      {
        key: 'themes_actuels',
        label: 'Quels thèmes ou sujets abordes-tu le plus souvent, même sans les avoir vraiment formalisés ?',
        type: 'textarea',
      },
      {
        key: 'rythme',
        label: 'À quelle fréquence publies-tu aujourd\'hui ?',
        type: 'choice',
        options: [
          { value: '1_ou_moins', label: '1 fois par semaine ou moins' },
          { value: '2-3', label: '2 à 3 fois par semaine' },
          { value: '4-5', label: '4 à 5 fois par semaine' },
          { value: 'plus_5', label: 'Plus de 5 fois par semaine' },
        ],
      },
      {
        key: 'formats_actuels',
        label: 'Quels formats utilises-tu déjà le plus souvent ?',
        type: 'multichoice',
        options: FORMAT_OPTIONS,
      },
      // La cible est déjà connue via le Fond de l'Évidence (volet 1), pas la
      // peine de la redemander ici.
      {
        key: 'top_posts',
        label: 'Quels sont tes 5 meilleurs posts à ce jour ? Partage les liens.',
        type: 'textarea',
        placeholder: 'Colle les liens (LinkedIn, Insta...), un par ligne si possible',
      },
      {
        key: 'flop_posts',
        label: 'Et à l\'inverse, 2 à 3 posts qui ont complètement flop ? Partage les liens.',
        type: 'textarea',
        placeholder: 'Colle les liens, un par ligne si possible',
      },
      {
        key: 'document_existant',
        label: "As-tu un document, une note, ou même un résumé fait par une IA qui reprend un peu tout ça, même si ce n'est pas clair ou pas complet ? Si oui, colle le lien ou le texte ici.",
        type: 'textarea',
        rows: 6,
        placeholder: 'Optionnel : https://... ou colle le texte complet ici',
      },
    ],
  },
]

export function contenuSectionsFor(route) {
  if (route === 'etablie') return sectionsEtablie
  if (route === 'floue') return sectionsFloue
  return []
}

// Section commune aux 2 routes, à ne pas confondre avec un étalage de
// preuves façon volet 1 : ici le seul but est de comprendre le FORMAT d'un
// cas concret pour voir s'il est templatisable en carrousel (ou autre
// visuel). On démarre donc avec un seul cas détaillé ; on n'en ajoute un
// second que si son format est vraiment différent du premier, pas pour
// lister davantage de preuves. Le lien vers un visuel existant de ce
// résultat (anciennement une question à part dans "Visuels, besoins et
// envies") est directement rattaché à chaque cas.
const preuvesSection = {
  id: 'contenu_preuves',
  num: 'p',
  kind: 'repeat',
  title: 'Une preuve à mettre en visuel',
  subtitle:
    "Pas besoin de tout lister : juste un cas détaillé, pour qu'on comprenne comment le mettre en forme (carrousel, infographie, avant/après...). N'en ajoute un second que si son format est vraiment différent du premier.",
  fields: [],
  repeatCount: 1,
  expandable: true,
  repeatMax: 3,
  repeatLabel: 'Cas',
  repeatFields: [
    { key: 'resultat', label: 'Résultat concret obtenu, chiffré si possible', type: 'text', placeholder: 'Ex. 12 850€ en 1 mois' },
    {
      key: 'avant_apres',
      label: 'En quelques mots, la situation avant, puis après',
      type: 'textarea',
      placeholder: 'Ex. profil générique et invisible avant, univers visuel sur-mesure et +12 850€ en 1 mois après.',
    },
    {
      key: 'lien',
      label: "Lien vers un visuel existant de ce résultat si tu en as (dashboard anonymisé, graphe, capture, post...)",
      type: 'text',
      placeholder: 'https://... (optionnel)',
    },
  ],
}

// Section commune aux 2 routes (ajoutée juste avant "Dernier mot", quel que
// soit le parcours) : les envies/besoins visuels. Le lien d'inspiration
// visuelle qui vivait ici auparavant a été déplacé dans `preuvesSection`
// ci-dessus (rattaché au cas concret plutôt qu'isolé), donc cette section
// n'est plus un bloc répétable. "Quels formats veux-tu utiliser
// régulièrement" a été retiré : c'est redondant avec `formats_actuels`
// (route floue), la question ici porte plutôt sur l'envie/l'inexploré.
// "Contexte photo" a été retiré (jugé inutile).
const visuelsSection = {
  id: 'contenu_visuels',
  num: 'v',
  kind: 'single',
  title: 'Visuels, besoins et envies',
  subtitle: 'Ce qui t\'aide à visualiser le rendu final de tes templates.',
  fields: [
    {
      key: 'formats_envie',
      label: "Y a-t-il des formats que tu rêves de faire mais que tu n'as pas encore faits ?",
      type: 'multichoice',
      options: [...FORMAT_OPTIONS, { value: 'non', label: 'Non, aucun format en particulier qui me manque' }],
    },
    {
      key: 'type_carrousel',
      label: 'Si carrousel, quel genre de structure t\'intéresse le plus ?',
      type: 'choice',
      options: [
        { value: 'etapes', label: 'Étapes / process' },
        { value: 'avant_apres', label: 'Avant / après' },
        { value: 'comparatif', label: 'Comparatif' },
        { value: 'storytelling', label: 'Storytelling slide par slide' },
        { value: 'ne_sais_pas', label: 'Je ne sais pas encore' },
      ],
      showIf: { field: 'formats_envie', includes: 'carrousel' },
    },
    {
      key: 'type_infographie',
      label: 'Si infographie, quel type ?',
      type: 'choice',
      options: [
        { value: 'process', label: 'Schéma de process' },
        { value: 'chiffres', label: 'Chiffres clés / stats' },
        { value: 'comparatif', label: 'Comparatif' },
        { value: 'definition', label: 'Définition / vulgarisation d\'un terme' },
      ],
      showIf: { field: 'formats_envie', includes: 'infographie' },
    },
  ],
}

// Nouveau (inspirations visuelles concrètes) : des profils ou posts (LinkedIn
// ou Insta, peu importe le sujet) dont le client aime le style, le ton ou la
// mise en forme.
const referencesSection = {
  id: 'contenu_references',
  num: 'r',
  kind: 'repeat',
  title: 'Tes inspirations visuelles',
  subtitle: "Des profils ou des posts (LinkedIn ou Insta, le sujet n'a pas d'importance) dont tu aimes le style, le ton ou la mise en forme.",
  fields: [],
  repeatCount: 2,
  expandable: true,
  repeatMax: 4,
  repeatLabel: 'Référence',
  repeatArticle: 'une',
  repeatFields: [
    { key: 'lien', label: 'Lien (profil ou post)', type: 'text', placeholder: 'https://...' },
    {
      key: 'pourquoi',
      label: 'Ce que tu aimes dans cet exemple',
      type: 'textarea',
      placeholder: 'Ex. la mise en page du carrousel, le ton direct, les couleurs...',
    },
  ],
}

// Le pendant négatif des inspirations, en section à part entière (pas un
// simple champ dans "Tes inspirations visuelles") pour qu'elle ait le même
// poids visuel. Existait avant dans l'ancienne route "aucune" (supprimée) ;
// utile quel que soit le niveau de maturité du client, donc partagée ici.
const antiReferenceSection = {
  id: 'contenu_anti_references',
  num: 'ar',
  kind: 'single',
  title: 'Tes anti-références',
  subtitle: "À l'inverse de tes inspirations : ce que tu ne veux surtout pas qu'on te propose.",
  fields: [
    {
      key: 'anti_reference',
      label: "Un type de post ou de visuel que tu détestes voir chez d'autres créateurs, et que tu ne veux jamais qu'on te propose.",
      type: 'textarea',
    },
  ],
}

// Section la plus importante du volet pour Thomas : il ne fabrique pas des
// visuels à l'unité mais des TEMPLATES réutilisables (banque de slides à
// customiser, templates de post statique, templates d'infographie), donc
// plus il a d'idées variées ici, plus il peut couvrir de cas. Ce n'est donc
// plus une section "optionnelle" façon brainstorm : on démarre avec 3 idées
// demandées (pas 1), jusqu'à 8, et le champ "banque d'idées" permet de
// récupérer d'un coup tout ce que le client a déjà listé ailleurs.
const ideesSection = {
  id: 'contenu_idees',
  num: 'i',
  kind: 'repeat',
  title: 'Tes idées de posts à templatiser',
  subtitle:
    "C'est la section la plus importante : plus tu donnes d'idées variées (même en vrac, même pas rédigées), plus on pourra te construire de templates réutilisables (carrousel, infographie, ou post statique) que tu n'auras plus qu'à remplir toi-même derrière. Donne-en plusieurs, pas juste une.",
  fields: [
    {
      key: 'banque_idees',
      label: "As-tu déjà une banque d'idées de posts (Notion, Trello, Excel, notes...) ? Partage un lien, ou exporte-la et colle-la ici.",
      type: 'textarea',
      rows: 6,
      placeholder: 'Optionnel si tu n\'as rien de fait, mais précieux si tu as déjà quelque chose',
    },
  ],
  repeatCount: 3,
  expandable: true,
  repeatMax: 8,
  repeatLabel: 'Idée',
  repeatArticle: 'une',
  repeatFields: [
    {
      key: 'format_vise',
      label: 'Plutôt pour quel format ?',
      type: 'choice',
      options: [
        { value: 'carrousel', label: 'Carrousel' },
        { value: 'infographie', label: 'Infographie' },
        { value: 'post_statique', label: 'Visuel de post simple / statique' },
        { value: 'ne_sais_pas', label: 'Je ne sais pas encore' },
      ],
    },
    {
      key: 'description',
      label: "Décris l'idée telle qu'elle te vient, même en vrac",
      type: 'textarea',
      placeholder: "Ex. un truc sur les 3 erreurs que je vois tout le temps chez mes clients avant qu'on travaille ensemble...",
    },
  ],
}

// Section finale générique (identique dans les 2 routes), ajoutée après les
// sections spécifiques à la route.
export const contenuFinalSection = {
  id: 'final',
  num: 'fin',
  kind: 'final',
  title: 'Dernier mot',
  fields: [
    {
      key: 'mot_de_la_fin',
      label: "Autre chose à préciser avant d'envoyer ?",
      type: 'textarea',
    },
  ],
}

// La question de branchement, présentée comme une section à part entière
// (un seul champ `route`), exportée pour que Contenu.jsx ET Espace.jsx (vue
// "Revoir mes réponses") partagent exactement la même définition.
export const routeSection = {
  id: 'route',
  num: '0',
  kind: 'single',
  title: 'Pour commencer',
  subtitle: 'Ta réponse ici détermine les questions qui suivent.',
  fields: [routeQuestion],
}

// Liste complète des sections d'un parcours donné (branchement + sections de
// la route + les sections communes aux 2 routes (preuve, visuels,
// inspirations, idées en vrac) + section finale), utilisée pour le récap
// (titres/labels corrects) comme pour le moteur de saisie. La numérotation
// (num) des sections du milieu est recalculée ici plutôt que figée sur
// chaque section, pour rester correcte même si une route gagne ou perd une
// section plus tard.
export function buildContenuSections(route) {
  if (!route) return [routeSection]
  const middle = [
    ...contenuSectionsFor(route),
    preuvesSection,
    visuelsSection,
    referencesSection,
    antiReferenceSection,
    ideesSection,
  ].map((s, i) => ({ ...s, num: String(i + 1) }))
  return [routeSection, ...middle, contenuFinalSection]
}
