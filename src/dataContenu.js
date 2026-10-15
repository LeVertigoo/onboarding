// Contenu du volet 2 — "Le Fond de l'Évidence — Volet Contenu" (matière pour
// les templates). Même moteur de champs que data.js (text / textarea / scale
// / choice / multichoice — ce dernier pour les QCM à sélection multiple).
//
// Route "aucune" reprend le document de travail fourni par Thomas (3 QCM
// multi-sélection, plusieurs QCM simples, du texte libre, et 3 champs
// "upload de fichier" encore en attente d'une décision technique — voir les
// commentaires FILE_UPLOAD_TODO ci-dessous : en attendant, ce sont des
// textarea "colle un lien" pour rester fonctionnels tout de suite.

export const CONTENU_TITLE = 'Le Fond de l\'Évidence — Volet Contenu'

// Options de formats partagées entre la route "floue" (ce qu'ils font déjà)
// et la route "aucune" (ce qu'ils veulent utiliser), pour rester cohérent.
const FORMAT_OPTIONS = [
  { value: 'carrousel', label: 'Carrousel multi-slides' },
  { value: 'visuel_unique', label: 'Visuel unique / infographie' },
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
    { value: 'etablie', label: "J'ai déjà une stratégie bien établie" },
    { value: 'floue', label: "J'ai une approche, mais rien de formalisé" },
    { value: 'aucune', label: "Je publie sans vraiment suivre de structure" },
  ],
}

// Route A — stratégie déjà établie : le strict minimum, on récupère la
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

// Route B — stratégie existante mais pas formalisée : ne creuse quasiment
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
      { key: 'rythme', label: 'À quelle fréquence publies-tu aujourd\'hui ?', type: 'text' },
      {
        key: 'formats_actuels',
        label: 'Quels formats utilises-tu déjà le plus souvent ?',
        type: 'multichoice',
        options: FORMAT_OPTIONS,
      },
      { key: 'cible', label: "À qui s'adressent tes posts selon toi (même approximatif) ?", type: 'textarea' },
      { key: 'ce_qui_marche', label: 'As-tu une idée de ce qui marche / ne marche pas chez toi jusqu\'ici ?', type: 'textarea' },
    ],
  },
]

// Route C — aucune structure suivie : la plus fournie, basée sur le
// document de travail de Thomas. 3 champs "upload de fichier" dans le
// document d'origine sont en attente d'une décision technique (stockage
// Supabase à mettre en place) ; en attendant ils sont remplacés par un
// textarea "colle un lien vers tes photos" pour rester utilisables tout de
// suite — marqués FILE_UPLOAD_TODO pour les retrouver facilement.
const sectionsAucune = [
  {
    id: 'contenu_piliers',
    num: '1',
    kind: 'single',
    title: 'Piliers de contenu',
    fields: [
      {
        key: 'types_naturels',
        label: 'Parmi ces types de posts, lesquels te semblent les plus naturels pour toi ?',
        type: 'multichoice',
        options: [
          { value: 'storytelling', label: 'Storytelling perso' },
          { value: 'prise_position', label: 'Prise de position / avis contrariant' },
          { value: 'preuve_client', label: 'Preuve client / étude de cas' },
          { value: 'insight', label: 'Insight / partage de méthode' },
          { value: 'post_vente', label: 'Post vente (annonce ton offre ouvertement)' },
        ],
      },
      {
        key: 'jamais_ose',
        label: "Y a-t-il un type de post que tu rêves de faire mais que tu n'as jamais osé ?",
        type: 'textarea',
      },
      {
        key: 'repartition_cibles',
        label: 'Comment tu verrais la répartition de tes posts entre tes cibles ?',
        type: 'choice',
        // Simplifié par rapport au document d'origine : plutôt que de détecter
        // automatiquement une "double cible" depuis le volet 1 (pas de donnée
        // structurée pour ça côté Fond de l'Évidence v1), l'option "une seule
        // cible" rend la question auto-suffisante pour tout le monde.
        options: [
          { value: 'une_seule_cible', label: 'Une seule cible, pas de répartition à faire' },
          { value: 'majorite_entreprise', label: 'Majorité entreprise' },
          { value: 'equilibre', label: 'Équilibré' },
          { value: 'majorite_freelance', label: 'Majorité freelance / accompagnement' },
          { value: 'ne_sais_pas', label: 'Je ne sais pas encore' },
        ],
      },
      {
        key: 'themes_en_boucle',
        label: 'Donne 3 à 5 thèmes ou sujets que tu pourrais traiter en boucle sans t\'épuiser (pas besoin de titres de posts, juste les thèmes).',
        type: 'textarea',
      },
    ],
  },
  {
    id: 'contenu_formats',
    num: '2',
    kind: 'single',
    title: 'Formats visuels',
    fields: [
      {
        key: 'formats_voulus',
        label: 'Quels formats veux-tu utiliser régulièrement ?',
        type: 'multichoice',
        options: FORMAT_OPTIONS,
      },
      {
        key: 'contexte_photo',
        label: 'Dans quel(s) contexte(s) veux-tu qu\'on te voie le plus souvent en photo ?',
        type: 'multichoice',
        options: [
          { value: 'call', label: 'En call / visio' },
          { value: 'scene', label: 'Sur scène / événement' },
          { value: 'bureau', label: 'À ton bureau / setup' },
          { value: 'lifestyle', label: 'Lifestyle / décontracté' },
          { value: 'autre', label: 'Autre' },
        ],
      },
      {
        key: 'contexte_photo_autre',
        label: 'Précise le contexte "Autre"',
        type: 'text',
        showIf: { field: 'contexte_photo', includes: 'autre' },
      },
      // FILE_UPLOAD_TODO — à remplacer par un vrai champ d'upload (Supabase
      // Storage) si on part sur cette option plutôt qu'un lien.
      {
        key: 'photos_existantes',
        label: 'Partage un lien (Drive, etc.) vers 5 à 10 photos de toi que tu aimes déjà (même non pro) — ça aide à calibrer le ton visuel des templates.',
        type: 'textarea',
      },
      // FILE_UPLOAD_TODO — idem.
      {
        key: 'exemples_mise_en_page',
        label: 'Partage un lien vers 1 à 3 captures d\'écran de posts LinkedIn (les tiens ou ceux d\'autres) dont tu aimes la mise en page ou le format.',
        type: 'textarea',
      },
    ],
  },
  {
    id: 'contenu_preuve',
    num: '3',
    kind: 'single',
    title: 'Preuve à mettre en carrousel',
    fields: [
      {
        key: 'resultats_non_utilises',
        label: "Y a-t-il des résultats ou chiffres que tu n'as PAS mis dans ton Fond de l'Évidence, mais que tu aimerais exploiter en carrousel (ex: étude de cas détaillée, avant/après) ?",
        type: 'textarea',
      },
      // FILE_UPLOAD_TODO — idem.
      {
        key: 'visuels_resultats',
        label: 'Si tu as des visuels de résultats (dashboard Ads anonymisé, graphe, capture), partage un lien vers eux (optionnel).',
        type: 'textarea',
      },
    ],
  },
  {
    id: 'contenu_rythme',
    num: '4',
    kind: 'single',
    title: 'Rythme de production réel',
    fields: [
      {
        key: 'rythme_tenable',
        label: 'Combien de posts par semaine te sens-tu capable de tenir dans la durée (pas dans l\'idéal, dans la réalité) ?',
        type: 'choice',
        options: [
          { value: '1', label: '1' },
          { value: '2-3', label: '2-3' },
          { value: '4-5', label: '4-5' },
          { value: 'plus_5', label: 'Plus de 5' },
        ],
      },
      {
        key: 'qui_publie',
        label: 'Qui écrit / publie au quotidien ?',
        type: 'choice',
        options: [
          { value: 'moi_seule', label: 'Moi seule' },
          { value: 'moi_relecture', label: 'Moi avec relecture Kalanis' },
          { value: 'ghostwriter', label: 'Kalanis ghostwriter complet' },
        ],
      },
      {
        key: 'outil_planification',
        label: 'As-tu déjà un outil de planification de contenu (Notion, Excel, autre) ? Si oui, lequel, et partage le lien si possible.',
        type: 'textarea',
        placeholder: 'Optionnel',
      },
    ],
  },
  {
    id: 'contenu_infographies',
    num: '5',
    kind: 'single',
    title: 'Infographies / vulgarisation',
    fields: [
      {
        key: 'concepts_a_vulgariser',
        label: 'Quels concepts techniques de ton métier aimerais-tu vulgariser en infographie pour ta cible (ex: un process, un mécanisme, un terme que tout le monde utilise mal) ?',
        type: 'textarea',
      },
      {
        key: 'niveau_detail',
        label: 'Niveau de détail souhaité pour ces infographies ?',
        type: 'choice',
        options: [
          { value: 'grand_public', label: 'Grand public, très simplifié' },
          { value: 'intermediaire', label: 'Niveau intermédiaire' },
          { value: 'technique', label: 'Technique assumé, ma cible s\'y connaît déjà' },
        ],
      },
    ],
  },
  {
    id: 'contenu_references',
    num: '6',
    kind: 'single',
    title: 'Références et anti-références',
    fields: [
      {
        key: 'comptes_inspirants',
        label: 'Donne 1 à 3 comptes LinkedIn dont tu aimes le contenu (pas le style visuel, plutôt la structure des posts/carrousels) — avec un lien si possible.',
        type: 'textarea',
      },
      {
        key: 'anti_reference',
        label: 'Un type de post que tu détestes voir chez les autres, et que tu ne veux jamais qu\'on te propose.',
        type: 'textarea',
      },
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
