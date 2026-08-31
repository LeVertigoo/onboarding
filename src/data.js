// Content model for the "Refonte 1500€" onboarding workbook — Kalanis.
// Forked from Workbook 1 (Business, Positionnement & Voix), same engine
// (see App.jsx), shorter content (~20-30 min vs 45-60 min) matching the
// new one-shot 1500€ offer (cadrage + refonte de profil, pas de stratégie
// de contenu complète). See cahier des charges v2 (2026-08-31) for the
// full rationale — this file mirrors it 1:1, section by section.
//
// Field types supported by the engine: 'text' (single line), 'textarea',
// 'scale' (1-10 buttons), 'choice' (single-select buttons, needs `options`).
// `groupLabel` on a field in a 'single' section renders a small heading
// above it whenever it differs from the previous field's groupLabel — used
// in chapitre 1 to reproduce its 4 sous-groupes without splitting it into
// 4 separate chapters.
// `showIf: { field: 'siblingKey', in: ['val1', 'val2'] }` on a field in a
// 'single' section hides it unless the sibling field's current value is in
// that list — used for the conditional fields (Q28, Q31).
// `examples` = collapsible "exemple inspirant" boxes with Thomas's own real
// material, so the client never starts from a blank page. Left out of a
// section when no authentic material exists yet (never a fabricated
// example attributed to Thomas) — see the cahier des charges v2 for which
// chapitre-1 questions still need Thomas's own answers.

export const WORKBOOK_TITLE = 'Workbook · Cadrage & Refonte de profil'

export const sections = [
  {
    id: 'intro',
    num: '0',
    kind: 'intro',
    title: 'Bienvenue dans ton workbook',
    subtitle:
      "Ce document sert à préparer ta refonte de profil : la matière brute (faits, mots employés spontanément, anecdotes) que Thomas utilise pour cadrer ton positionnement avant le call de validation. Compte 20-30 minutes — pas besoin de réponses parfaites, juste spontanées et honnêtes.",
    fields: [
      { key: 'client_name', label: 'Ton prénom et nom', type: 'text', placeholder: 'ex : Thomas Fournier' },
      { key: 'client_email', label: 'Ton email', type: 'text', placeholder: 'ex : thomas@kalanis.co' },
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
      "Le cœur du workbook. Réponses courtes et spontanées — pas de réflexion structurée attendue. C'est ce qui permet à Thomas de retranscrire visuellement qui tu es, pas juste ce que tu fais.",
    fields: [
      {
        key: 'presentation',
        label: "Quand tu te présentes à quelqu'un que tu ne connais pas, qu'est-ce que tu dis en premier ?",
        type: 'textarea',
        groupLabel: 'Le socle',
      },
      { key: 'trois_mots_1', label: 'Si tes proches devaient te décrire en 3 mots — mot 1', type: 'text', groupLabel: 'Le socle' },
      { key: 'trois_mots_2', label: 'Mot 2', type: 'text', groupLabel: 'Le socle' },
      { key: 'trois_mots_3', label: 'Mot 3', type: 'text', groupLabel: 'Le socle' },
      {
        key: 'qui_es_tu',
        label: 'Sans utiliser aucun mot "professionnel" (pas de "expert", "consultant", etc.), qui es-tu ?',
        type: 'textarea',
        groupLabel: 'Le socle',
      },
      {
        key: 'anime',
        label: "Qu'est-ce qui t'anime au quotidien, dans ta vie, pas juste dans ton travail ?",
        type: 'textarea',
        groupLabel: 'Le moteur',
      },
      {
        key: 'agace',
        label: "Qu'est-ce qui t'agace ou te met en colère profondément ?",
        type: 'textarea',
        placeholder: "Pas besoin que ce soit lié au travail — ce qui t'énerve en dit souvent plus long sur tes valeurs que ce que tu affirmes aimer.",
        groupLabel: 'Le moteur',
      },
      {
        key: 'passion',
        label: 'Une passion ou un truc que tu fais en dehors du travail qui te représente bien ? (optionnel)',
        type: 'textarea',
        groupLabel: 'Le moteur',
      },
      {
        key: 'virage',
        label: "Un virage ou une galère dans ta vie qui t'a façonné(e) — perso ou pro. (optionnel — peut être creusé en call si tu préfères ne pas l'écrire)",
        type: 'textarea',
        groupLabel: 'Le vécu',
      },
      {
        key: 'declic',
        label: "Pourquoi fais-tu ce métier aujourd'hui, et pas autre chose ? Y a-t-il eu un déclic ?",
        type: 'textarea',
        groupLabel: 'Le vécu',
      },
      {
        key: 'clients_disent',
        label: "Qu'est-ce que tes clients disent de toi une fois qu'ils ont bossé avec toi — au-delà du résultat chiffré, le ressenti humain ?",
        type: 'textarea',
        groupLabel: 'Le regard extérieur',
      },
      {
        key: 'phrase_marquante',
        label: "Une phrase ou un retour qu'on t'a fait qui t'a marqué, positif ou négatif ? (optionnel)",
        type: 'textarea',
        groupLabel: 'Le regard extérieur',
      },
    ],
    examples: [
      {
        tag: 'Exemple partiel — à compléter',
        title: 'Exemple — le vécu de Thomas (matériel déjà écrit, repris de Workbook 1)',
        body: [
          {
            label: 'Un virage / une galère',
            text: "Y'a 3-4 ans je postais absolument tous les jours sur LinkedIn pour vendre mes services, je faisais tout comme il fallait — pourtant, +6 mois, aucun client, des posts à 3-4 likes. Un post d'un créateur que je suivais m'a fait réaliser que la solution n'était pas de faire plus ou 'comme eux'.",
          },
          {
            label: 'Le déclic',
            text: "J'ai arrêté de faire ce qu'on me disait de faire. J'ai construit une approche à moi — un univers visuel unique, un contenu simplifié, des messages de prospection qui ressemblent à une vraie conversation.",
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 2 — Ta cible
  // ---------------------------------------------------------------------
  {
    id: 'cible',
    num: '2',
    kind: 'single',
    title: 'Ta cible',
    subtitle: '',
    fields: [
      {
        key: 'qui_sers_tu',
        label: 'Qui sers-tu exactement ? (secteur, taille d\'entreprise, poste de la personne qui décide/paie)',
        type: 'textarea',
      },
      { key: 'qui_plus_servir', label: 'Qui ne veux-tu plus servir ?', type: 'textarea' },
      {
        key: 'douleur_principale',
        label: 'Quelle est la douleur principale que ta cible vit avant de te contacter ? (dans tes mots à toi, tels qu\'ils te le disent réellement — le verbatim exact vaut mieux qu\'une reformulation propre)',
        type: 'textarea',
      },
      { key: 'resultat_recherche', label: 'Qu\'est-ce que ta cible recherche concrètement comme résultat ?', type: 'textarea' },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 3 — Tes preuves
  // ---------------------------------------------------------------------
  {
    id: 'preuves',
    num: '3',
    kind: 'repeat',
    title: 'Tes preuves',
    subtitle: 'Tes 2-3 meilleurs clients.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Client',
    repeatFields: [
      { key: 'nom', label: 'Nom / prénom', type: 'text' },
      { key: 'resultat', label: 'Résultat concret obtenu, chiffré si possible', type: 'text' },
      { key: 'pourquoi', label: 'Pourquoi il/elle t\'a choisi toi plutôt qu\'un concurrent', type: 'textarea' },
    ],
    placeholders: [
      { nom: 'Nathan', resultat: '+12 850€ en 1 mois', pourquoi: 'Profil générique, contenu qui ne se démarquait pas — a voulu un univers visuel sur-mesure.' },
      { nom: 'Noëlie', resultat: '10 calls + 1 conférence animée en 1 mois', pourquoi: 'Domaine ultra technique, prospection inconsistante — cherchait une refonte + un message simple.' },
    ],
    examples: [
      {
        tag: 'Exemple inspirant',
        title: 'Exemple complet — mes cas clients (Thomas)',
        body: [
          { label: 'Nathan', text: 'Profil générique, contenu qui ne se démarquait pas → univers visuel sur-mesure + carrousels et cas clients uniques → +12 850€ en 1 mois.' },
          { label: 'Louis', text: 'Jargon technique, personne ne comprenait comment l\'acheter → simplification du profil et du message → 1er client 100% inbound.' },
          { label: 'Noëlie', text: 'Domaine ultra technique, prospection inconsistante → refonte de profil + stratégie de contenu simple → 10 calls + 1 conférence animée en 1 mois.' },
        ],
      },
    ],
  },
  {
    id: 'preuves_chiffres',
    num: '3',
    kind: 'single',
    title: 'Tes preuves (suite)',
    subtitle: '',
    fields: [
      {
        key: 'chiffres_forts',
        label: 'Un ou deux chiffres forts que tu veux mettre en avant. (optionnel)',
        type: 'text',
        placeholder: '"12 850€ en 1 mois" plutôt que "beaucoup de résultats"',
      },
      {
        key: 'temoignages',
        label: 'As-tu des témoignages ou verbatims déjà reçus de clients ? Colle-les ici s\'ils existent. (optionnel)',
        type: 'textarea',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 4 — Ta concurrence
  // ---------------------------------------------------------------------
  {
    id: 'concurrence',
    num: '4',
    kind: 'repeat',
    title: 'Ta concurrence',
    subtitle: '2-3 profils LinkedIn de concurrents ou pairs auxquels on te compare.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Profil',
    repeatFields: [
      { key: 'lien', label: 'Lien du profil', type: 'text' },
      { key: 'avis', label: 'Ce que tu en penses', type: 'textarea' },
    ],
  },
  {
    id: 'differenciation_visuelle',
    num: '4',
    kind: 'single',
    title: 'Ta concurrence (suite)',
    subtitle: '',
    fields: [
      { key: 'ce_qui_differencie', label: 'Qu\'est-ce qui te différencie d\'eux, selon toi — même si c\'est encore flou ?', type: 'textarea' },
      { key: 'aime_naime_pas_visuel', label: 'Qu\'est-ce que tu aimes / n\'aimes pas visuellement chez eux ? (optionnel)', type: 'textarea' },
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
      { key: 'offre_une_phrase', label: 'Ton offre, en une phrase, telle que tu la vends aujourd\'hui.', type: 'textarea' },
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
      { key: 'justifie_prix', label: 'Qu\'est-ce qui, selon toi, justifie ce prix face à la concurrence ?', type: 'textarea' },
      {
        key: 'diff_generique',
        label: 'Ce que tout le monde dans ton secteur affirme (la version polie, celle que tu donnerais si on te demandait à froid)',
        type: 'textarea',
      },
      {
        key: 'diff_vraie',
        label: 'Ce que TOI tu penses vraiment, même si ça bouscule ou va à contre-courant du marché',
        type: 'textarea',
      },
      {
        key: 'ancrage',
        label: 'Si tu devais résumer ta conviction ou ta façon de faire en une seule phrase mémorable — le genre de phrase qu\'on répète après toi — ce serait quoi ? (optionnel)',
        type: 'text',
      },
    ],
    examples: [
      {
        tag: 'Exemple inspirant',
        title: 'Exemple complet — ma différenciation et mon point d\'ancrage (Thomas)',
        body: [
          { label: 'Version polie (ce que tout le monde dit)', text: 'Il faut poster régulièrement, donner de la valeur, être actif sur LinkedIn.' },
          { label: 'Ce que je pense vraiment', text: 'Il ne faut pas faire plus, il faut faire simple — le jargon parle aux pairs, pas aux clients. Preuve : le test du Post Miroir — demande à l\'IA un post sur ton expertise, elle sort les 5 mêmes conseils que 1000 concurrents.' },
          { label: 'Mon point d\'ancrage', text: '"Unique par le visuel. Visible par le contenu. Trouvé par tes clients." — le genre de phrase compacte, mémorable, qu\'on peut répéter après moi.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 6 — Diagnostic de ton profil actuel
  // ---------------------------------------------------------------------
  {
    id: 'diagnostic',
    num: '6',
    kind: 'single',
    title: 'Diagnostic de ton profil actuel',
    subtitle: '',
    fields: [
      { key: 'naime_pas', label: 'Qu\'est-ce que tu n\'aimes pas dans ton profil LinkedIn actuel ?', type: 'textarea' },
      {
        key: 'deja_reproche',
        label: 'Qu\'est-ce qu\'on t\'a déjà reproché ou fait remarquer (en call, en DM, par des proches) sur ton image LinkedIn ? (optionnel)',
        type: 'textarea',
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
        label: 'Précise le contexte',
        type: 'textarea',
        showIf: { field: 'retour_incomprehension', in: ['Oui'] },
      },
      {
        key: 'plafond',
        label: 'As-tu l\'impression d\'avoir atteint un plafond ces derniers temps — comme si tu faisais tout ce qu\'il fallait (contenu, missions, réseau) sans réussir à passer un cap ?',
        type: 'choice',
        options: [
          { value: 'Oui, clairement', label: 'Oui, clairement' },
          { value: 'Un peu', label: 'Un peu' },
          { value: 'Non, pas vraiment', label: 'Non, pas vraiment' },
        ],
      },
      {
        key: 'plafond_description',
        label: 'Décris ce plafond avec tes mots (optionnel)',
        type: 'textarea',
      },
    ],
  },

  // ---------------------------------------------------------------------
  // CHAPITRE 7 — Références visuelles
  // ---------------------------------------------------------------------
  {
    id: 'references_visuelles',
    num: '7',
    kind: 'repeat',
    title: 'Références visuelles',
    subtitle: '2-3 bannières ou profils LinkedIn que tu trouves réussis (peu importe le secteur). Lien pour l\'instant — l\'upload d\'image pourra être ajouté plus tard si besoin.',
    repeatCount: 2,
    expandable: true,
    repeatMax: 3,
    repeatLabel: 'Référence',
    repeatFields: [
      { key: 'lien', label: 'Lien (ou description si tu préfères)', type: 'text' },
      { key: 'pourquoi', label: 'Pourquoi tu le trouves réussi', type: 'textarea' },
    ],
  },
  {
    id: 'charte_da',
    num: '7',
    kind: 'single',
    title: 'Références visuelles (suite)',
    subtitle: '',
    fields: [
      {
        key: 'couleurs_styles',
        label: 'Couleurs et styles que tu aimes ou rejettes d\'emblée. (optionnel)',
        type: 'textarea',
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
        label: 'Lien vers cette charte/ce site',
        type: 'text',
        showIf: { field: 'charte_existante', in: ['Oui, à respecter', 'Oui, mais je veux la casser'] },
      },
    ],
  },

  {
    id: 'final',
    num: '8',
    kind: 'final',
    title: 'Le mot de la fin',
    subtitle: '',
    fields: [
      { key: 'mot_de_la_fin', label: 'Qu\'est-ce que ce workbook ne t\'a pas demandé et que tu meurs d\'envie de dire ?', type: 'textarea' },
    ],
    checklist: [
      'Chapitre 1 rempli — qui tu es, ce qui t\'anime',
      'Chapitre 2 rempli — ta cible',
      'Chapitre 3 rempli — tes preuves',
      'Chapitre 4 rempli — ta concurrence',
      'Chapitre 5 rempli — ton offre & positionnement',
      'Chapitre 6 rempli — diagnostic de ton profil',
      'Chapitre 7 rempli — références visuelles',
    ],
  },
]
