// Content model for the "Refonte 1500€" onboarding workbook, Kalanis.
// Forked from Workbook 1 (Business, Positionnement & Voix), same engine
// (see App.jsx), shorter content (~20-30 min vs 45-60 min).
//
// Field types supported by the engine: 'text' (single line), 'textarea',
// 'scale' (1-10 buttons), 'choice' (single-select buttons, needs `options`).
// `groupLabel` on a field in a 'single' section renders a small heading
// above it whenever it differs from the previous field's groupLabel.
// `showIf: { field: 'siblingKey', in: [...] }` hides a field unless the
// sibling field's value is in that list. `showIf: { field, notEmpty: true }`
// hides it until the sibling field has any value (used for "dis-m'en plus"
// follow-ups after a choice).
// No collapsible "exemple inspirant" boxes in this version, every field
// carries its own inline placeholder instead (including link fields).

export const WORKBOOK_TITLE = 'Workbook · Cadrage & Refonte de profil'

export const sections = [
  {
    id: 'intro',
    num: '0',
    kind: 'intro',
    title: 'Bienvenue dans ton workbook',
    subtitle:
      "Ce document sert à préparer ta refonte de profil : la matière brute (faits, mots employés spontanément, anecdotes) que Thomas utilise pour cadrer ton positionnement avant le call de validation. Compte 20 à 30 minutes, pas besoin de réponses parfaites, juste spontanées et honnêtes.",
    fields: [
      { key: 'client_name', label: 'Ton prénom et nom', type: 'text', placeholder: 'Ex. Thomas Fournier' },
      { key: 'client_email', label: 'Ton email', type: 'text', placeholder: 'Ex. thomas@kalanis.co' },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 1 — Toi (la personne)
  // ---------------------------------------------------------------------
  {
    id: 'toi',
    num: '1',
    kind: 'single',
    title: 'Toi (la personne)',
    subtitle:
      "Le cœur du workbook. Réponses courtes et spontanées, pas de réflexion structurée attendue. C'est ce qui permet à Thomas de retranscrire visuellement qui tu es, pas juste ce que tu fais.",
    fields: [
      {
        key: 'presentation',
        label: 'Présente-toi comme si on ne se connaissait pas et qu\'on se croisait dans la rue.',
        type: 'textarea',
        placeholder: 'Ex. je m\'appelle Julien, je vis à Lyon, je fais du développement web pour des artisans du bâtiment.',
        groupLabel: 'Le socle',
      },
      {
        key: 'phrase_obligee',
        label: 'Le truc que tu es obligé de dire quand tu te présentes, qu\'il y ait un rapport business ou non.',
        type: 'textarea',
        placeholder: 'Ex. je précise toujours que je viens de Marseille, ou que j\'ai bossé dans la restauration avant.',
        groupLabel: 'Le socle',
      },
      {
        key: 'trois_mots',
        label: 'Si tes proches devaient te décrire en 3 mots, ce serait lesquels ?',
        type: 'text',
        placeholder: 'Ex. direct, curieux, engagé',
        groupLabel: 'Le socle',
      },
      {
        key: 'qui_es_tu',
        label: 'Sans utiliser aucun mot "professionnel" (pas de "expert", "consultant", etc.), qui es-tu ?',
        type: 'textarea',
        placeholder: 'Ex. quelqu\'un qui aime comprendre comment les choses fonctionnent avant de les expliquer aux autres.',
        groupLabel: 'Le socle',
      },
      {
        key: 'anime',
        label: 'Qu\'est-ce qui t\'anime au quotidien, dans ta vie, pas juste dans ton travail ?',
        type: 'textarea',
        placeholder: 'Ex. apprendre des trucs inutiles, bricoler, débattre avec mes proches.',
        groupLabel: 'Le moteur',
      },
      {
        key: 'agace',
        label: 'Qu\'est-ce qui t\'agace ou te met en colère profondément ?',
        type: 'textarea',
        placeholder: 'Pas besoin que ce soit lié au travail. Ce qui t\'énerve en dit souvent plus long sur tes valeurs que ce que tu affirmes aimer.',
        groupLabel: 'Le moteur',
      },
      {
        key: 'passion',
        label: 'Une passion ou un truc que tu fais en dehors du travail qui te représente bien ?',
        type: 'textarea',
        placeholder: 'Ex. je fais de la boxe depuis 10 ans, ça façonne ma façon de bosser.',
        groupLabel: 'Le moteur',
      },
      {
        key: 'signe_recurrent',
        label: 'Dans la vie de tous les jours, ou même professionnel, il y a quelque chose, un élément, un signe qui revient souvent chez toi ?',
        type: 'textarea',
        placeholder: 'Comme un objet peu commun que tu utilises tous les jours, une habitude, un hobby, une couleur que tu portes tout le temps...',
        groupLabel: 'Le moteur',
      },
      {
        key: 'caractere',
        label: 'Comment tu qualifierais ton caractère ?',
        type: 'choice',
        options: [
          { value: 'Direct, sans détour', label: 'Direct, sans détour' },
          { value: 'Calme, posé', label: 'Calme, posé' },
          { value: 'Énergique, speed', label: 'Énergique, speed' },
          { value: 'Réfléchi, en retrait', label: 'Réfléchi, en retrait' },
          { value: 'Drôle, léger', label: 'Drôle, léger' },
          { value: 'Sérieux, carré', label: 'Sérieux, carré' },
        ],
        groupLabel: 'Le caractère',
      },
      {
        key: 'caractere_plus',
        label: 'Dis-m\'en plus.',
        type: 'textarea',
        placeholder: 'Pourquoi ce choix, un exemple concret qui l\'illustre.',
        showIf: { field: 'caractere', notEmpty: true },
        groupLabel: 'Le caractère',
      },
      {
        key: 'virage',
        label: 'Un virage ou une galère dans ta vie qui t\'a façonné(e), perso ou pro. (Optionnel, sujet sensible : ça peut être creusé en call si tu préfères ne pas l\'écrire.)',
        type: 'textarea',
        placeholder: 'Par exemple : plusieurs mois à tout faire comme il fallait sans un seul client, jusqu\'à un déclic qui a tout changé.',
        groupLabel: 'Le vécu',
      },
      {
        key: 'declic',
        label: 'Pourquoi fais-tu ce métier aujourd\'hui, et pas autre chose ?',
        type: 'textarea',
        placeholder: 'Par exemple : j\'ai arrêté de faire ce qu\'on me disait de faire, j\'ai construit ma propre approche.',
        groupLabel: 'Le vécu',
      },
      {
        key: 'clients_disent',
        label: 'Qu\'est-ce que tes clients disent de toi une fois qu\'ils ont bossé avec toi (au-delà du résultat chiffré, le ressenti humain) ?',
        type: 'textarea',
        placeholder: 'Ex. qu\'ils se sont sentis écoutés, ou qu\'ils ont autant ri qu\'ils ont progressé.',
        groupLabel: 'Le regard extérieur',
      },
      {
        key: 'phrase_marquante',
        label: 'Une phrase ou un retour qu\'on t\'a fait qui t\'a marqué. (Positif ou négatif, optionnel.)',
        type: 'textarea',
        placeholder: 'Ex. une remarque qu\'un client ou un proche t\'a faite et que tu n\'as jamais oubliée.',
        groupLabel: 'Le regard extérieur',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 2 — Ton parcours (pour la partie "Expériences" du profil)
  // ---------------------------------------------------------------------
  {
    id: 'parcours',
    num: '2',
    kind: 'repeat',
    title: 'Ton parcours professionnel',
    subtitle:
      'Les grandes étapes de ton parcours, celles que tu veux voir apparaître dans la partie Expériences de ton profil. Ton activité actuelle en premier.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 5,
    repeatLabel: 'Expérience',
    repeatFields: [
      { key: 'poste', label: 'Poste / rôle', type: 'text', placeholder: 'Ex. Fondateur, Consultant indépendant, Chef de projet...' },
      { key: 'structure', label: 'Entreprise / structure', type: 'text', placeholder: 'Ex. Kalanis, ou le nom de ton ancien employeur' },
      { key: 'periode', label: 'Période', type: 'text', placeholder: 'Ex. 2023, aujourd\'hui' },
      {
        key: 'description',
        label: 'Ce que tu y as fait, ta mission ou ta réalisation principale',
        type: 'textarea',
        placeholder: 'Ex. accompagnement de freelances sur leur refonte de profil, +30% de leads en moyenne pour mes clients.',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 3 — Ta cible
  // ---------------------------------------------------------------------
  {
    id: 'cible',
    num: '3',
    kind: 'single',
    title: 'Ta cible',
    subtitle: '',
    fields: [
      {
        key: 'qui_sers_tu',
        label: 'Quelle est ta cible exacte ? (secteur, taille d\'entreprise, CA, poste, âge...)',
        type: 'textarea',
        placeholder: 'Ex. freelances B2B, CA entre 3000 et 8000€ par mois, décideur unique, 30 à 45 ans.',
      },
      {
        key: 'qui_plus_servir',
        label: 'Avec qui tu ne veux pas travailler (ton filtre anti-cauchemar) ?',
        type: 'textarea',
        placeholder: 'Ex. les clients qui veulent tout, tout de suite, au prix le plus bas.',
      },
      {
        key: 'douleur_principale',
        label: 'Quelle est la douleur principale que ta cible vit avant de te contacter ? (Dans tes mots à toi, tels qu\'ils te le disent réellement : le verbatim exact vaut mieux qu\'une reformulation propre.)',
        type: 'textarea',
        placeholder: 'Ex. je poste régulièrement mais aucun DM ne rentre.',
      },
      {
        key: 'resultat_recherche',
        label: 'Quel est le résultat ou l\'état rêvé de ta cible ?',
        type: 'textarea',
        placeholder: 'Ex. sortir du plafond, devenir LA référence de sa niche.',
      },
    ],
  },
  {
    id: 'cible_exemples',
    num: '3',
    kind: 'repeat',
    title: 'Des profils qui correspondent à ta cible',
    subtitle: '2 à 3 profils LinkedIn de ta cible exacte. Des clients qui y ressemblent, ça marche aussi.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Profil',
    repeatFields: [
      { key: 'lien', label: 'Lien du profil', type: 'text', placeholder: 'https://linkedin.com/in/...' },
      { key: 'note', label: 'Qui c\'est, pourquoi cet exemple', type: 'text', placeholder: 'Ex. un client actuel qui correspond exactement à ma cible idéale.' },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 4 — Tes preuves
  // ---------------------------------------------------------------------
  {
    id: 'preuves_intro',
    num: '4',
    kind: 'single',
    title: 'Tes preuves',
    subtitle: '',
    fields: [
      {
        key: 'nombre_clients',
        label: 'Combien de clients ou d\'entreprises as-tu accompagnés ?',
        type: 'text',
        placeholder: 'Ex. une douzaine, ou "150 projets depuis 2022"',
      },
    ],
  },
  {
    id: 'preuves',
    num: '4',
    kind: 'repeat',
    title: 'Tes meilleurs clients',
    subtitle: 'Tes 2 à 3 meilleurs clients.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Client',
    repeatFields: [
      { key: 'nom', label: 'Nom / prénom', type: 'text', placeholder: 'Ex. Nathan' },
      { key: 'resultat', label: 'Résultat concret obtenu, chiffré si possible', type: 'text', placeholder: 'Ex. 12 850€ en 1 mois' },
      {
        key: 'avant_apres',
        label: 'En quelques mots, la transformation avant, après',
        type: 'textarea',
        placeholder: 'Ex. profil générique et invisible avant, univers visuel sur-mesure et +12 850€ en 1 mois après.',
      },
      {
        key: 'pourquoi',
        label: 'Pourquoi il/elle t\'a choisi toi plutôt qu\'un concurrent',
        type: 'textarea',
        placeholder: 'Ex. il cherchait un vrai univers visuel, pas juste une bannière propre.',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 5 — Ton offre & positionnement
  // ---------------------------------------------------------------------
  {
    id: 'offre_positionnement',
    num: '5',
    kind: 'single',
    title: 'Ton offre & positionnement',
    subtitle: '',
    fields: [
      {
        key: 'offre_une_phrase',
        label: 'Présente-moi ton offre telle que tu la vends.',
        type: 'textarea',
        placeholder: 'Ex. j\'aide les freelances B2B à structurer une offre claire et rentable.',
      },
      {
        key: 'promesse',
        label: 'Si tu devais résumer la promesse de ton entreprise en 1 ou 2 phrases, ce serait ?',
        type: 'textarea',
        placeholder: 'Ex. unique par le visuel. Visible par le contenu. Trouvé par tes clients.',
      },
      {
        key: 'fourchette_prix',
        label: 'Ta fourchette de prix actuelle.',
        type: 'choice',
        options: [
          { value: '< 500€', label: '< 500€' },
          { value: '500-1500€', label: '500-1500€' },
          { value: '1500-3000€', label: '1500-3000€' },
          { value: '3000€+', label: '3000€+' },
          { value: 'Sur devis', label: 'Sur devis' },
        ],
      },
      {
        key: 'justifie_prix',
        label: 'Qu\'est-ce qui, selon toi, justifie ce prix face à la concurrence ?',
        type: 'textarea',
        placeholder: 'Ex. la recherche et le sur-mesure derrière, pas juste le rendu final.',
      },
      {
        key: 'diff_generique',
        label: 'Ce que tout le monde dans ton secteur affirme (la version polie, celle que tu donnerais si on te demandait à froid).',
        type: 'textarea',
        placeholder: 'Ex. il faut poster régulièrement, donner de la valeur, être actif.',
      },
      {
        key: 'diff_vraie',
        label: 'Ce que TOI tu penses vraiment, même si ça bouscule ou va à contre-courant du marché.',
        type: 'textarea',
        placeholder: 'Ex. il ne faut pas faire plus, il faut faire simple. Le jargon parle aux pairs, pas aux clients.',
      },
      {
        key: 'ancrage',
        label: 'Si tu devais résumer ta conviction ou ta façon de faire en une seule phrase mémorable, le genre de phrase qu\'on répète après toi, ce serait quoi ? (Optionnel.)',
        type: 'text',
        placeholder: 'Ex. unique par le visuel. Visible par le contenu. Trouvé par tes clients.',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 6 — Les profils de tes concurrents
  // ---------------------------------------------------------------------
  {
    id: 'concurrents',
    num: '6',
    kind: 'repeat',
    title: 'Les profils de tes concurrents',
    subtitle: '2 à 3 profils LinkedIn de concurrents ou pairs auxquels on te compare.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Profil',
    repeatFields: [
      { key: 'lien', label: 'Lien du profil', type: 'text', placeholder: 'https://linkedin.com/in/...' },
      { key: 'avis', label: 'Ce que tu en penses', type: 'textarea', placeholder: 'Ex. univers visuel fort mais discours flou.' },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 7 — Diagnostic de ton profil actuel
  // ---------------------------------------------------------------------
  {
    id: 'diagnostic',
    num: '7',
    kind: 'single',
    title: 'Diagnostic de ton profil actuel',
    subtitle: '',
    fields: [
      {
        key: 'naime_pas',
        label: 'Qu\'est-ce que tu n\'aimes pas dans ton profil LinkedIn actuel ?',
        type: 'textarea',
        placeholder: 'Ex. je trouve ma bannière trop générique, mon titre ne dit rien de précis.',
      },
      {
        key: 'deja_reproche',
        label: 'Qu\'est-ce qu\'on t\'a déjà reproché ou fait remarquer (en call, en DM, par des proches) sur ton image LinkedIn ? (Optionnel.)',
        type: 'textarea',
        placeholder: 'Ex. on m\'a déjà dit qu\'on ne comprenait pas ce que je faisais en lisant mon profil.',
      },
      {
        key: 'retour_incomprehension',
        label: 'As-tu déjà eu des retours du type "je ne comprends pas ce que tu fais" ou "ton profil ne reflète pas ton niveau" ?',
        type: 'choice',
        options: [
          { value: 'Oui', label: 'Oui' },
          { value: 'Non', label: 'Non' },
          { value: 'Je ne sais pas', label: 'Je ne sais pas' },
        ],
      },
      {
        key: 'retour_incomprehension_contexte',
        label: 'Précise le contexte.',
        type: 'textarea',
        placeholder: 'Ex. un prospect m\'a dit ça en DM la semaine dernière.',
        showIf: { field: 'retour_incomprehension', in: ['Oui'] },
      },
      {
        key: 'plafond',
        label: 'As-tu l\'impression d\'avoir atteint un plafond ces derniers temps, comme si tu faisais tout ce qu\'il fallait (contenu, missions, réseau) sans réussir à passer un cap ?',
        type: 'choice',
        options: [
          { value: 'Oui, clairement', label: 'Oui, clairement' },
          { value: 'Un peu', label: 'Un peu' },
          { value: 'Non, pas vraiment', label: 'Non, pas vraiment' },
        ],
      },
      {
        key: 'plafond_description',
        label: 'Décris ce plafond avec tes mots.',
        type: 'textarea',
        placeholder: 'Ex. j\'ai l\'impression de tout faire (contenu, missions, réseau) sans réussir à passer un cap.',
        showIf: { field: 'plafond', in: ['Oui, clairement', 'Un peu'] },
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 8 — Tes préférences & envies
  // ---------------------------------------------------------------------
  {
    id: 'preferences_envies',
    num: '8',
    kind: 'single',
    title: 'Tes préférences & envies',
    subtitle: '',
    fields: [
      {
        key: 'banniere_message',
        label: 'Si tu devais mettre un message, une phrase ou une idée en avant sur ta bannière, ce serait quoi ?',
        type: 'textarea',
        placeholder: 'Ex. ma spécialité en une phrase, ou l\'idée qui résume ce que je fais.',
      },
      {
        key: 'banniere_visuel',
        label: 'Des éléments visuels que tu veux absolument voir apparaître sur ta bannière (objets, décor, symboles, photo de toi ou non...) ?',
        type: 'textarea',
        placeholder: 'Ex. ma ville, mon setup de travail, un objet qui me représente.',
      },
      {
        key: 'photos_lien',
        label: 'As-tu des photos de toi que tu aimes et que tu veux qu\'on utilise ? Mets-les dans un dossier partagé et colle le lien ici.',
        type: 'text',
        placeholder: 'Ex. lien Google Drive ou Dropbox. Sinon laisse vide, on en reparle en call.',
      },
      {
        key: 'couleurs_styles',
        label: 'Couleurs et styles que tu aimes ou rejettes d\'emblée.',
        type: 'textarea',
        placeholder: 'Ex. j\'aime le bleu foncé et le minimalisme, je déteste les dégradés flashy.',
      },
      {
        key: 'charte_existante',
        label: 'As-tu déjà une charte/DA existante ailleurs (site, logo) à respecter, ou au contraire à casser ?',
        type: 'choice',
        options: [
          { value: 'Oui, à respecter', label: 'Oui, à respecter' },
          { value: 'Oui, mais je veux la casser', label: 'Oui, mais je veux la casser' },
          { value: 'Non, page blanche', label: 'Non, page blanche' },
        ],
      },
      {
        key: 'charte_lien',
        label: 'Lien vers cette charte/ce site.',
        type: 'text',
        placeholder: 'https://...',
        showIf: { field: 'charte_existante', in: ['Oui, à respecter', 'Oui, mais je veux la casser'] },
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 9 — Références visuelles
  // ---------------------------------------------------------------------
  {
    id: 'references_visuelles',
    num: '9',
    kind: 'repeat',
    title: 'Références visuelles',
    subtitle: 'Profils, bannières, visuels que tu aimes, même s\'ils n\'ont rien à voir avec LinkedIn.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Référence',
    repeatFields: [
      { key: 'lien', label: 'Lien', type: 'text', placeholder: 'https://...' },
      { key: 'pourquoi', label: 'Pourquoi tu le trouves réussi', type: 'textarea', placeholder: 'Ex. la typographie et le contraste des couleurs.' },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 10 — Tes liens
  // ---------------------------------------------------------------------
  {
    id: 'tes_liens',
    num: '10',
    kind: 'repeat',
    title: 'Tes liens',
    subtitle: 'Les liens utiles à connaître (site perso, autres réseaux, Calendly, portfolio...).',
    repeatCount: 3,
    expandable: true,
    repeatMax: 6,
    repeatLabel: 'Lien',
    repeatFields: [
      { key: 'label', label: 'De quoi s\'agit-il ?', type: 'text', placeholder: 'Ex. mon site, mon Calendly, mon Instagram' },
      { key: 'url', label: 'Lien', type: 'text', placeholder: 'https://...' },
    ],
  },

  {
    id: 'final',
    num: '11',
    kind: 'final',
    title: 'Le mot de la fin',
    subtitle: '',
    fields: [
      {
        key: 'mot_de_la_fin',
        label: 'Qu\'est-ce que ce workbook ne t\'a pas demandé et que tu meurs d\'envie de dire ?',
        type: 'textarea',
        placeholder: 'Tout ce qui te semble important et qu\'on n\'a pas encore couvert.',
      },
    ],
  },
]
