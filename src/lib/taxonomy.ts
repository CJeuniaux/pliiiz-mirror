// Taxonomy system for guided preferences
export interface TaxonomyAttribute {
  key: string;
  label: string;
  type: 'single' | 'multi' | 'range';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
}

export interface TaxonomyCategory {
  id: string;
  label: { fr: string; en: string };
  attributes: TaxonomyAttribute[];
  labelTemplate: string;
  i18n: Record<string, string>;
}

export interface TaxonomyRegistry {
  version: number;
  categories: TaxonomyCategory[];
}

export interface PreferenceItemCanonical {
  categoryId: string;
  path: string[];
  attrs: Record<string, any>;
}

export interface PreferenceItem {
  id: string;
  kind: 'like' | 'giftIdea' | 'avoid' | 'allergy';
  level?: number; // 1-3, only for likes and giftIdeas
  label: string; // human-readable
  canonical?: PreferenceItemCanonical; // optional for free-text
  freeText: boolean;
  category?: string; // high-level bucket
}

// Default taxonomy registry
export const DEFAULT_TAXONOMY: TaxonomyRegistry = {
  version: 1,
  categories: [
    // === BOISSONS & GOURMANDISES ===
    {
      id: 'wine',
      label: { fr: 'Vin', en: 'Wine' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['rouge', 'blanc', 'rose', 'champagne', 'nature'] 
        },
        { 
          key: 'region', 
          label: 'Région', 
          type: 'single', 
          options: ['bordeaux', 'bourgogne', 'champagne-region', 'loire', 'rhone', 'provence', 'languedoc', 'alsace'], 
          optional: true 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['sec', 'demi-sec', 'moelleux', 'petillant'], 
          optional: true 
        }
      ],
      labelTemplate: 'vin {type} {region?} {style?}',
      i18n: {
        rouge: 'rouge',
        blanc: 'blanc',
        rose: 'rosé',
        champagne: 'champagne',
        nature: 'nature',
        bordeaux: 'de Bordeaux',
        bourgogne: 'de Bourgogne',
        'champagne-region': 'de Champagne',
        loire: 'de Loire',
        rhone: 'du Rhône',
        provence: 'de Provence',
        languedoc: 'du Languedoc',
        alsace: 'dAlsace',
        sec: 'sec',
        'demi-sec': 'demi-sec',
        moelleux: 'moelleux',
        petillant: 'pétillant'
      }
    },
    {
      id: 'beer',
      label: { fr: 'Bière', en: 'Beer' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['ipa', 'stout', 'lager', 'wheat', 'sour', 'porter'] 
        },
        { 
          key: 'origin', 
          label: 'Origine', 
          type: 'single', 
          options: ['artisanale', 'locale', 'belge', 'allemande', 'americaine'], 
          optional: true 
        }
      ],
      labelTemplate: 'bière {type} {origin?}',
      i18n: {
        ipa: 'IPA',
        stout: 'stout',
        lager: 'lager',
        wheat: 'blanche',
        sour: 'sour',
        porter: 'porter',
        artisanale: 'artisanale',
        locale: 'locale',
        belge: 'belge',
        allemande: 'allemande',
        americaine: 'américaine'
      }
    },
    {
      id: 'spirits',
      label: { fr: 'Spiritueux', en: 'Spirits' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['whisky', 'gin', 'rhum', 'tequila', 'cognac', 'vodka', 'liqueur'] 
        },
        { 
          key: 'origin', 
          label: 'Origine', 
          type: 'single', 
          options: ['ecosse', 'irlande', 'japon', 'france', 'carribes', 'mexique'], 
          optional: true 
        }
      ],
      labelTemplate: '{type} {origin?}',
      i18n: {
        whisky: 'whisky',
        gin: 'gin',
        rhum: 'rhum',
        tequila: 'tequila',
        cognac: 'cognac',
        vodka: 'vodka',
        liqueur: 'liqueur',
        ecosse: 'écossais',
        irlande: 'irlandais',
        japon: 'japonais',
        france: 'français',
        carribes: 'des Caraïbes',
        mexique: 'mexicaine'
      }
    },
    {
      id: 'pastries',
      label: { fr: 'Pâtisseries & Confiseries', en: 'Pastries & Confectionery' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['macarons', 'chocolats', 'biscuits', 'miel', 'confitures', 'pates-tartiner', 'calissons'] 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['artisanal', 'traditionnel', 'bio', 'regional'], 
          optional: true 
        }
      ],
      labelTemplate: '{type} {style?}',
      i18n: {
        macarons: 'macarons',
        chocolats: 'chocolats',
        biscuits: 'biscuits',
        miel: 'miel',
        confitures: 'confitures',
        'pates-tartiner': 'pâtes à tartiner',
        calissons: 'calissons',
        artisanal: 'artisanaux',
        traditionnel: 'traditionnels',
        bio: 'bio',
        regional: 'régionaux'
      }
    },
    
    // === ÉPICERIE FINE & GASTRONOMIE ===
    {
      id: 'cheese',
      label: { fr: 'Fromages', en: 'Cheese' },
      attributes: [
        { 
          key: 'milk', 
          label: 'Lait', 
          type: 'single', 
          options: ['chevre', 'brebis', 'vache', 'melange'] 
        },
        { 
          key: 'texture', 
          label: 'Texture', 
          type: 'single', 
          options: ['frais', 'mou', 'semi-dur', 'dur'], 
          optional: true 
        },
        { 
          key: 'aging', 
          label: 'Affinage', 
          type: 'single', 
          options: ['jeune', 'affine', 'vieux'], 
          optional: true 
        }
      ],
      labelTemplate: 'fromage {milk} {texture?} {aging?}',
      i18n: {
        chevre: 'de chèvre',
        brebis: 'de brebis',
        vache: 'de vache',
        melange: 'mixte',
        frais: 'frais',
        mou: 'à pâte molle',
        'semi-dur': 'à pâte semi-dure',
        dur: 'à pâte dure',
        jeune: 'jeune',
        affine: 'affiné',
        vieux: 'vieux'
      }
    },
    
    // === ARTS & CULTURE ===
    {
      id: 'music',
      label: { fr: 'Musique', en: 'Music' },
      attributes: [
        { 
          key: 'format', 
          label: 'Format', 
          type: 'single', 
          options: ['vinyles', 'cd', 'streaming', 'concerts', 'instruments'] 
        },
        { 
          key: 'genre', 
          label: 'Genre', 
          type: 'single', 
          options: ['rock', 'pop', 'jazz', 'classique', 'electronic', 'rap', 'folk'], 
          optional: true 
        }
      ],
      labelTemplate: 'musique {format} {genre?}',
      i18n: {
        vinyles: 'vinyles',
        cd: 'CD',
        streaming: 'streaming',
        concerts: 'concerts',
        instruments: 'instruments',
        rock: 'rock',
        pop: 'pop',
        jazz: 'jazz',
        classique: 'classique',
        electronic: 'électronique',
        rap: 'rap',
        folk: 'folk'
      }
    },
    {
      id: 'games',
      label: { fr: 'Jeux', en: 'Games' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['societe', 'video', 'cartes', 'puzzle'] 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['familial', 'expert', 'party', 'cooperation', 'strategie'], 
          optional: true 
        },
        { 
          key: 'platform', 
          label: 'Plateforme', 
          type: 'single', 
          options: ['playstation', 'xbox', 'nintendo', 'pc', 'mobile'], 
          optional: true 
        }
      ],
      labelTemplate: 'jeu {type} {style?} {platform?}',
      i18n: {
        societe: 'de société',
        video: 'vidéo',
        cartes: 'de cartes',
        puzzle: 'puzzle',
        familial: 'familial',
        expert: 'expert',
        party: 'party',
        cooperation: 'coopératif',
        strategie: 'de stratégie',
        playstation: 'PlayStation',
        xbox: 'Xbox',
        nintendo: 'Nintendo',
        pc: 'PC',
        mobile: 'mobile'
      }
    },
    {
      id: 'sports',
      label: { fr: 'Sports & Fitness', en: 'Sports & Fitness' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['yoga', 'fitness', 'randonnee', 'velo', 'natation', 'tennis', 'padel', 'golf', 'course'] 
        },
        { 
          key: 'level', 
          label: 'Niveau', 
          type: 'single', 
          options: ['debutant', 'intermediaire', 'avance'], 
          optional: true 
        }
      ],
      labelTemplate: 'équipement {type} {level?}',
      i18n: {
        yoga: 'yoga',
        fitness: 'fitness',
        randonnee: 'randonnée',
        velo: 'vélo',
        natation: 'natation',
        tennis: 'tennis',
        padel: 'padel',
        golf: 'golf',
        course: 'course à pied',
        debutant: 'débutant',
        intermediaire: 'intermédiaire',
        avance: 'avancé'
      }
    },
    {
      id: 'creative-arts',
      label: { fr: 'Arts Créatifs', en: 'Creative Arts' },
      attributes: [
        { 
          key: 'medium', 
          label: 'Médium', 
          type: 'single', 
          options: ['aquarelle', 'tricot', 'ceramique', 'calligraphie', 'scrapbook', 'broderie', 'couture'] 
        },
        { 
          key: 'level', 
          label: 'Niveau', 
          type: 'single', 
          options: ['debutant', 'intermediaire', 'avance'], 
          optional: true 
        }
      ],
      labelTemplate: 'matériel {medium} {level?}',
      i18n: {
        aquarelle: 'aquarelle',
        tricot: 'tricot',
        ceramique: 'céramique',
        calligraphie: 'calligraphie',
        scrapbook: 'scrapbook',
        broderie: 'broderie',
        couture: 'couture',
        debutant: 'débutant',
        intermediaire: 'intermédiaire',
        avance: 'avancé'
      }
    },
    
    // === MAISON & DÉCO (détaillé) ===
    {
      id: 'plants',
      label: { fr: 'Plantes', en: 'Plants' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['vertes', 'succulentes', 'orchidees', 'bonsai', 'aromatiques', 'fleurs'] 
        },
        { 
          key: 'care', 
          label: 'Entretien', 
          type: 'single', 
          options: ['facile', 'moyen', 'difficile'], 
          optional: true 
        },
        { 
          key: 'location', 
          label: 'Emplacement', 
          type: 'single', 
          options: ['interieur', 'exterieur', 'balcon'], 
          optional: true 
        }
      ],
      labelTemplate: 'plante {type} {care?} {location?}',
      i18n: {
        vertes: 'verte',
        succulentes: 'succulente',
        orchidees: 'orchidée',
        bonsai: 'bonsaï',
        aromatiques: 'aromatique',
        fleurs: 'à fleurs',
        facile: 'facile',
        moyen: 'moyennement exigeante',
        difficile: 'exigeante',
        interieur: 'dintérieur',
        exterieur: 'dextérieur',
        balcon: 'de balcon'
      }
    },
    {
      id: 'candles',
      label: { fr: 'Bougies', en: 'Candles' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['parfumees', 'naturelles', 'decoratives', 'massages'] 
        },
        { 
          key: 'wax', 
          label: 'Cire', 
          type: 'single', 
          options: ['soja', 'coco', 'abeille', 'parafine'], 
          optional: true 
        },
        { 
          key: 'scent', 
          label: 'Parfum', 
          type: 'single', 
          options: ['vanille', 'lavande', 'agrumes', 'bois', 'floral', 'epice'], 
          optional: true 
        }
      ],
      labelTemplate: 'bougie {type} {wax?} {scent?}',
      i18n: {
        parfumees: 'parfumée',
        naturelles: 'naturelle',
        decoratives: 'décorative',
        massages: 'de massage',
        soja: 'en cire de soja',
        coco: 'en cire de coco',
        abeille: 'en cire dabeille',
        parafine: 'en paraffine',
        vanille: 'vanille',
        lavande: 'lavande',
        agrumes: 'agrumes',
        bois: 'boisé',
        floral: 'floral',
        epice: 'épicé'
      }
    },
    {
      id: 'home-textiles',
      label: { fr: 'Linge de Maison', en: 'Home Textiles' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['plaids', 'coussins', 'linge-lit', 'serviettes', 'rideaux'] 
        },
        { 
          key: 'material', 
          label: 'Matière', 
          type: 'single', 
          options: ['coton', 'lin', 'soie', 'laine', 'bambou'], 
          optional: true 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['moderne', 'vintage', 'boheme', 'scandinave'], 
          optional: true 
        }
      ],
      labelTemplate: '{type} {material?} {style?}',
      i18n: {
        plaids: 'plaid',
        coussins: 'coussin',
        'linge-lit': 'linge de lit',
        serviettes: 'serviettes',
        rideaux: 'rideaux',
        coton: 'en coton',
        lin: 'en lin',
        soie: 'en soie',
        laine: 'en laine',
        bambou: 'en bambou',
        moderne: 'moderne',
        vintage: 'vintage',
        boheme: 'bohème',
        scandinave: 'scandinave'
      }
    },
    
    // === BEAUTÉ & BIEN-ÊTRE (élargi) ===
    {
      id: 'fragrances',
      label: { fr: 'Parfums', en: 'Fragrances' },
      attributes: [
        { 
          key: 'family', 
          label: 'Famille', 
          type: 'single', 
          options: ['floral', 'oriental', 'boise', 'frais', 'gourmand'] 
        },
        { 
          key: 'concentration', 
          label: 'Concentration', 
          type: 'single', 
          options: ['eau-toilette', 'eau-parfum', 'parfum'], 
          optional: true 
        },
        { 
          key: 'gender', 
          label: 'Genre', 
          type: 'single', 
          options: ['femme', 'homme', 'mixte'], 
          optional: true 
        }
      ],
      labelTemplate: 'parfum {family} {concentration?} {gender?}',
      i18n: {
        floral: 'floral',
        oriental: 'oriental',
        boise: 'boisé',
        frais: 'frais',
        gourmand: 'gourmand',
        'eau-toilette': 'eau de toilette',
        'eau-parfum': 'eau de parfum',
        parfum: 'parfum',
        femme: 'pour femme',
        homme: 'pour homme',
        mixte: 'mixte'
      }
    },
    {
      id: 'skincare',
      label: { fr: 'Soins', en: 'Skincare' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['visage', 'corps', 'cheveux', 'mains', 'levres'] 
        },
        { 
          key: 'formulation', 
          label: 'Formulation', 
          type: 'single', 
          options: ['bio', 'naturel', 'vegan', 'sans-parfum'], 
          optional: true 
        },
        { 
          key: 'concern', 
          label: 'Besoin', 
          type: 'single', 
          options: ['hydratation', 'anti-age', 'acne', 'sensible'], 
          optional: true 
        }
      ],
      labelTemplate: 'soin {type} {formulation?} {concern?}',
      i18n: {
        visage: 'visage',
        corps: 'corps',
        cheveux: 'cheveux',
        mains: 'mains',
        levres: 'lèvres',
        bio: 'bio',
        naturel: 'naturel',
        vegan: 'vegan',
        'sans-parfum': 'sans parfum',
        hydratation: 'hydratant',
        'anti-age': 'anti-âge',
        acne: 'anti-acné',
        sensible: 'peaux sensibles'
      }
    },
    
    // === MODE (élargi) ===
    {
      id: 'accessories',
      label: { fr: 'Accessoires', en: 'Accessories' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['sacs', 'ceintures', 'bonnets', 'gants', 'foulards', 'lunettes'] 
        },
        { 
          key: 'material', 
          label: 'Matière', 
          type: 'single', 
          options: ['cuir', 'tissu', 'laine', 'soie', 'metal'], 
          optional: true 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['classique', 'moderne', 'vintage', 'sportif'], 
          optional: true 
        }
      ],
      labelTemplate: '{type} {material?} {style?}',
      i18n: {
        sacs: 'sac',
        ceintures: 'ceinture',
        bonnets: 'bonnet',
        gants: 'gants',
        foulards: 'foulard',
        lunettes: 'lunettes',
        cuir: 'en cuir',
        tissu: 'en tissu',
        laine: 'en laine',
        soie: 'en soie',
        metal: 'en métal',
        classique: 'classique',
        moderne: 'moderne',
        vintage: 'vintage',
        sportif: 'sportif'
      }
    },
    {
      id: 'jewelry',
      label: { fr: 'Bijoux', en: 'Jewelry' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['bagues', 'bracelets', 'colliers', 'boucles-oreilles', 'montres'] 
        },
        { 
          key: 'material', 
          label: 'Matière', 
          type: 'single', 
          options: ['or', 'argent', 'acier', 'fantaisie', 'pierres'], 
          optional: true 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['classique', 'moderne', 'vintage', 'boheme'], 
          optional: true 
        }
      ],
      labelTemplate: '{type} {material?} {style?}',
      i18n: {
        bagues: 'bague',
        bracelets: 'bracelet',
        colliers: 'collier',
        'boucles-oreilles': 'boucles doreilles',
        montres: 'montre',
        or: 'en or',
        argent: 'en argent',
        acier: 'en acier',
        fantaisie: 'fantaisie',
        pierres: 'avec pierres',
        classique: 'classique',
        moderne: 'moderne',
        vintage: 'vintage',
        boheme: 'bohème'
      }
    },
    
    // === TECHNOLOGIE (élargi) ===
    {
      id: 'audio',
      label: { fr: 'Audio', en: 'Audio' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['casques', 'ecouteurs', 'enceintes', 'barres-son', 'platines'] 
        },
        { 
          key: 'connectivity', 
          label: 'Connectivité', 
          type: 'single', 
          options: ['bluetooth', 'filaire', 'wifi'], 
          optional: true 
        },
        { 
          key: 'use', 
          label: 'Usage', 
          type: 'single', 
          options: ['sport', 'studio', 'voyage', 'gaming'], 
          optional: true 
        }
      ],
      labelTemplate: 'équipement audio {type} {connectivity?} {use?}',
      i18n: {
        casques: 'casque',
        ecouteurs: 'écouteurs',
        enceintes: 'enceinte',
        'barres-son': 'barre de son',
        platines: 'platine',
        bluetooth: 'Bluetooth',
        filaire: 'filaire',
        wifi: 'WiFi',
        sport: 'sport',
        studio: 'studio',
        voyage: 'voyage',
        gaming: 'gaming'
      }
    },
    {
      id: 'photo',
      label: { fr: 'Photo', en: 'Photography' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['instantane', 'hybride', 'reflex', 'compact', 'action'] 
        },
        { 
          key: 'brand', 
          label: 'Marque', 
          type: 'single', 
          options: ['fujifilm', 'polaroid', 'canon', 'nikon', 'sony', 'gopro'], 
          optional: true 
        },
        { 
          key: 'accessories', 
          label: 'Accessoires', 
          type: 'multi', 
          options: ['objectifs', 'trepied', 'sac', 'filtres'], 
          optional: true 
        }
      ],
      labelTemplate: 'appareil photo {type} {brand?} {accessories?}',
      i18n: {
        instantane: 'instantané',
        hybride: 'hybride',
        reflex: 'reflex',
        compact: 'compact',
        action: 'action',
        fujifilm: 'Fujifilm',
        polaroid: 'Polaroid',
        canon: 'Canon',
        nikon: 'Nikon',
        sony: 'Sony',
        gopro: 'GoPro',
        objectifs: 'avec objectifs',
        trepied: 'avec trépied',
        sac: 'avec sac',
        filtres: 'avec filtres'
      }
    },
    
    // === EXPÉRIENCES (variées) ===
    {
      id: 'travel',
      label: { fr: 'Voyages', en: 'Travel' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['city-trip', 'montagne', 'plage', 'nature', 'bien-etre', 'culturel'] 
        },
        { 
          key: 'duration', 
          label: 'Durée', 
          type: 'single', 
          options: ['weekend', 'semaine', 'long-sejour'], 
          optional: true 
        },
        { 
          key: 'season', 
          label: 'Saison', 
          type: 'single', 
          options: ['printemps', 'ete', 'automne', 'hiver'], 
          optional: true 
        }
      ],
      labelTemplate: 'voyage {type} {duration?} {season?}',
      i18n: {
        'city-trip': 'city-trip',
        montagne: 'montagne',
        plage: 'plage',
        nature: 'nature',
        'bien-etre': 'bien-être',
        culturel: 'culturel',
        weekend: 'week-end',
        semaine: 'semaine',
        'long-sejour': 'long séjour',
        printemps: 'printemps',
        ete: 'été',
        automne: 'automne',
        hiver: 'hiver'
      }
    },
    {
      id: 'workshops',
      label: { fr: 'Ateliers', en: 'Workshops' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['cuisine', 'ceramique', 'oenologie', 'cocktails', 'photographie', 'art', 'bien-etre'] 
        },
        { 
          key: 'level', 
          label: 'Niveau', 
          type: 'single', 
          options: ['debutant', 'intermediaire', 'avance'], 
          optional: true 
        },
        { 
          key: 'duration', 
          label: 'Durée', 
          type: 'single', 
          options: ['demi-journee', 'journee', 'weekend'], 
          optional: true 
        }
      ],
      labelTemplate: 'atelier {type} {level?} {duration?}',
      i18n: {
        cuisine: 'cuisine',
        ceramique: 'céramique',
        oenologie: 'œnologie',
        cocktails: 'cocktails',
        photographie: 'photographie',
        art: 'art',
        'bien-etre': 'bien-être',
        debutant: 'débutant',
        intermediaire: 'intermédiaire',
        avance: 'avancé',
        'demi-journee': 'demi-journée',
        journee: 'journée',
        weekend: 'week-end'
      }
    },
    
    // === ENFANTS & FAMILLE ===
    {
      id: 'kids-toys',
      label: { fr: 'Jouets Enfants', en: 'Kids Toys' },
      attributes: [
        { 
          key: 'age', 
          label: 'Âge', 
          type: 'single', 
          options: ['0-2', '3-5', '6-8', '9-12', '13+'] 
        },
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['educatif', 'creatif', 'construction', 'peluches', 'vehicules', 'poupees'] 
        },
        { 
          key: 'brand', 
          label: 'Licence', 
          type: 'single', 
          options: ['lego', 'playmobil', 'disney', 'pokemon', 'paw-patrol'], 
          optional: true 
        }
      ],
      labelTemplate: 'jouet {type} {age} {brand?}',
      i18n: {
        '0-2': '0-2 ans',
        '3-5': '3-5 ans',
        '6-8': '6-8 ans',
        '9-12': '9-12 ans',
        '13+': '13+ ans',
        educatif: 'éducatif',
        creatif: 'créatif',
        construction: 'construction',
        peluches: 'peluche',
        vehicules: 'véhicule',
        poupees: 'poupée',
        lego: 'LEGO',
        playmobil: 'Playmobil',
        disney: 'Disney',
        pokemon: 'Pokémon',
        'paw-patrol': 'Pat Patrouille'
      }
    },
    
    // === ANIMAUX ===
    {
      id: 'pet-accessories',
      label: { fr: 'Accessoires Animaux', en: 'Pet Accessories' },
      attributes: [
        { 
          key: 'pet', 
          label: 'Animal', 
          type: 'single', 
          options: ['chien', 'chat', 'oiseau', 'rongeur', 'poisson'] 
        },
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['jouets', 'friandises', 'accessoires', 'soins', 'habitat'] 
        },
        { 
          key: 'size', 
          label: 'Taille', 
          type: 'single', 
          options: ['petit', 'moyen', 'grand'], 
          optional: true 
        }
      ],
      labelTemplate: 'accessoire {pet} {type} {size?}',
      i18n: {
        chien: 'chien',
        chat: 'chat',
        oiseau: 'oiseau',
        rongeur: 'rongeur',
        poisson: 'poisson',
        jouets: 'jouet',
        friandises: 'friandises',
        accessoires: 'accessoire',
        soins: 'soin',
        habitat: 'habitat',
        petit: 'petit',
        moyen: 'moyen',
        grand: 'grand'
      }
    },
    
    // === DIVERS ===
    {
      id: 'stationery',
      label: { fr: 'Papeterie', en: 'Stationery' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['carnets', 'stylos', 'planners', 'crayons', 'marqueurs', 'autocollants'] 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['minimaliste', 'colore', 'vintage', 'kawaii'], 
          optional: true 
        },
        { 
          key: 'use', 
          label: 'Usage', 
          type: 'single', 
          options: ['bureau', 'ecole', 'art', 'planification'], 
          optional: true 
        }
      ],
      labelTemplate: '{type} {style?} {use?}',
      i18n: {
        carnets: 'carnet',
        stylos: 'stylo',
        planners: 'planner',
        crayons: 'crayons',
        marqueurs: 'marqueurs',
        autocollants: 'autocollants',
        minimaliste: 'minimaliste',
        colore: 'coloré',
        vintage: 'vintage',
        kawaii: 'kawaii',
        bureau: 'bureau',
        ecole: 'école',
        art: 'art',
        planification: 'planification'
      }
    },
    
    // === CATÉGORIES EXISTANTES CONSERVÉES ===
    {
      id: 'tea',
      label: { fr: 'Thé', en: 'Tea' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['green', 'black', 'white', 'oolong', 'herbal'] 
        },
        { 
          key: 'form', 
          label: 'Forme', 
          type: 'single', 
          options: ['sachets', 'loose-leaf'] 
        },
        { 
          key: 'origin', 
          label: 'Origine', 
          type: 'single', 
          options: ['japon', 'chine', 'inde', 'nepal'], 
          optional: true 
        }
      ],
      labelTemplate: 'thé {type} {form}',
      i18n: {
        green: 'vert',
        black: 'noir',
        white: 'blanc',
        oolong: 'oolong',
        herbal: 'aux herbes',
        'loose-leaf': 'en vrac',
        sachets: 'en sachets',
        japon: 'du Japon',
        chine: 'de Chine',
        inde: 'dInde',
        nepal: 'du Népal'
      }
    },
    {
      id: 'chocolate',
      label: { fr: 'Chocolat', en: 'Chocolate' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['dark', 'milk', 'white', 'praline'] 
        },
        { 
          key: 'cocoaPct', 
          label: '% Cacao', 
          type: 'range', 
          min: 30, 
          max: 100, 
          step: 5, 
          optional: true 
        },
        { 
          key: 'fill', 
          label: 'Garniture', 
          type: 'multi', 
          options: ['hazelnut', 'almond', 'sea-salt', 'caramel'], 
          optional: true 
        }
      ],
      labelTemplate: 'chocolat {type} {cocoaPct?%} {fill?}',
      i18n: {
        dark: 'noir',
        milk: 'au lait',
        white: 'blanc',
        praline: 'praliné',
        hazelnut: 'aux noisettes',
        almond: 'aux amandes',
        'sea-salt': 'au sel de mer',
        caramel: 'au caramel'
      }
    },
    {
      id: 'coffee',
      label: { fr: 'Café', en: 'Coffee' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['beans', 'ground', 'pods', 'instant'] 
        },
        { 
          key: 'roast', 
          label: 'Torréfaction', 
          type: 'single', 
          options: ['light', 'medium', 'dark'] 
        },
        { 
          key: 'origin', 
          label: 'Origine', 
          type: 'single', 
          options: ['ethiopia', 'colombia', 'brazil', 'guatemala'], 
          optional: true 
        }
      ],
      labelTemplate: 'café {type} {roast} {origin?}',
      i18n: {
        beans: 'en grains',
        ground: 'moulu',
        pods: 'en dosettes',
        instant: 'instantané',
        light: 'blonde',
        medium: 'medium',
        dark: 'foncée',
        ethiopia: 'dÉthiopie',
        colombia: 'de Colombie',
        brazil: 'du Brésil',
        guatemala: 'du Guatemala'
      }
    },
    {
      id: 'books',
      label: { fr: 'Livres', en: 'Books' },
      attributes: [
        { 
          key: 'genre', 
          label: 'Genre', 
          type: 'single', 
          options: ['fiction', 'non-fiction', 'biography', 'history', 'science', 'art', 'cooking'] 
        },
        { 
          key: 'format', 
          label: 'Format', 
          type: 'single', 
          options: ['paperback', 'hardcover', 'ebook', 'audiobook'] 
        }
      ],
      labelTemplate: 'livre {genre} {format}',
      i18n: {
        fiction: 'de fiction',
        'non-fiction': 'documentaire',
        biography: 'biographie',
        history: 'dhistoire',
        science: 'scientifique',
        art: 'dart',
        cooking: 'de cuisine',
        paperback: 'de poche',
        hardcover: 'relié',
        ebook: 'numérique',
        audiobook: 'audio'
      }
    },
    {
      id: 'beauty',
      label: { fr: 'Beauté', en: 'Beauty' },
      attributes: [
        { 
          key: 'category', 
          label: 'Catégorie', 
          type: 'single', 
          options: ['skincare', 'makeup', 'fragrance', 'haircare'] 
        },
        { 
          key: 'brand', 
          label: 'Marque', 
          type: 'single', 
          options: ['luxury', 'drugstore', 'organic', 'korean'], 
          optional: true 
        }
      ],
      labelTemplate: 'produit {category} {brand?}',
      i18n: {
        skincare: 'de soin',
        makeup: 'de maquillage',
        fragrance: 'parfum',
        haircare: 'capillaire',
        luxury: 'de luxe',
        drugstore: 'de pharmacie',
        organic: 'bio',
        korean: 'coréen'
      }
    },
    {
      id: 'home',
      label: { fr: 'Maison', en: 'Home' },
      attributes: [
        { 
          key: 'room', 
          label: 'Pièce', 
          type: 'single', 
          options: ['kitchen', 'bedroom', 'living', 'bathroom', 'office'] 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['modern', 'vintage', 'minimalist', 'rustic'], 
          optional: true 
        }
      ],
      labelTemplate: 'décoration {room} {style?}',
      i18n: {
        kitchen: 'cuisine',
        bedroom: 'chambre',
        living: 'salon',
        bathroom: 'salle de bain',
        office: 'bureau',
        modern: 'moderne',
        vintage: 'vintage',
        minimalist: 'minimaliste',
        rustic: 'rustique'
      }
    },
    {
      id: 'tech',
      label: { fr: 'Technologie', en: 'Technology' },
      attributes: [
        { 
          key: 'category', 
          label: 'Catégorie', 
          type: 'single', 
          options: ['phone', 'laptop', 'tablet', 'audio', 'gaming', 'smart-home'] 
        },
        { 
          key: 'brand', 
          label: 'Marque', 
          type: 'single', 
          options: ['apple', 'samsung', 'sony', 'nintendo', 'other'], 
          optional: true 
        }
      ],
      labelTemplate: 'appareil {category} {brand?}',
      i18n: {
        phone: 'téléphone',
        laptop: 'ordinateur portable',
        tablet: 'tablette',
        audio: 'audio',
        gaming: 'gaming',
        'smart-home': 'maison connectée',
        apple: 'Apple',
        samsung: 'Samsung',
        sony: 'Sony',
        nintendo: 'Nintendo',
        other: 'autre marque'
      }
    },
    {
      id: 'fashion',
      label: { fr: 'Mode', en: 'Fashion' },
      attributes: [
        { 
          key: 'category', 
          label: 'Catégorie', 
          type: 'single', 
          options: ['clothing', 'shoes', 'accessories', 'jewelry'] 
        },
        { 
          key: 'style', 
          label: 'Style', 
          type: 'single', 
          options: ['casual', 'formal', 'sporty', 'vintage'], 
          optional: true 
        }
      ],
      labelTemplate: '{category} {style?}',
      i18n: {
        clothing: 'vêtements',
        shoes: 'chaussures',
        accessories: 'accessoires',
        jewelry: 'bijoux',
        casual: 'décontracté',
        formal: 'formel',
        sporty: 'sportif',
        vintage: 'vintage'
      }
    },
    {
      id: 'experiences',
      label: { fr: 'Expériences', en: 'Experiences' },
      attributes: [
        { 
          key: 'type', 
          label: 'Type', 
          type: 'single', 
          options: ['travel', 'workshop', 'concert', 'restaurant', 'spa', 'sports'] 
        },
        { 
          key: 'duration', 
          label: 'Durée', 
          type: 'single', 
          options: ['half-day', 'full-day', 'weekend', 'week'], 
          optional: true 
        }
      ],
      labelTemplate: 'expérience {type} {duration?}',
      i18n: {
        travel: 'voyage',
        workshop: 'atelier',
        concert: 'concert',
        restaurant: 'restaurant',
        spa: 'spa',
        sports: 'sport',
        'half-day': 'demi-journée',
        'full-day': 'journée complète',
        weekend: 'week-end',
        week: 'semaine'
      }
    }
  ]
};

// Helper functions
export function generateLabel(
  category: TaxonomyCategory, 
  attrs: Record<string, any>
): string {
  let template = category.labelTemplate;
  
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null && value !== '') {
      const translatedValue = Array.isArray(value) 
        ? value.map(v => category.i18n[v] || v).join(', ')
        : category.i18n[value] || value;
      
      // Handle optional attributes
      const optionalRegex = new RegExp(`\\{${key}\\?([^}]*)\\}`, 'g');
      const requiredRegex = new RegExp(`\\{${key}\\}`, 'g');
      
      if (template.includes(`{${key}?`)) {
        template = template.replace(optionalRegex, `$1${translatedValue}`);
      } else {
        template = template.replace(requiredRegex, translatedValue);
      }
    } else {
      // Remove optional attributes that are empty
      const optionalRegex = new RegExp(`\\{${key}\\?[^}]*\\}`, 'g');
      template = template.replace(optionalRegex, '');
    }
  }
  
  // Clean up any remaining unreplaced placeholders
  template = template.replace(/\{[^}]*\}/g, '');
  
  // Clean up extra spaces
  return template.replace(/\s+/g, ' ').trim();
}

export function findCategoryById(categoryId: string): TaxonomyCategory | undefined {
  return DEFAULT_TAXONOMY.categories.find(cat => cat.id === categoryId);
}

export function createPreferenceItem(
  kind: PreferenceItem['kind'],
  label: string,
  canonical?: PreferenceItemCanonical,
  level?: number
): PreferenceItem {
  return {
    id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    kind,
    level: (kind === 'like' || kind === 'giftIdea') ? (level || 2) : undefined,
    label,
    canonical,
    freeText: !canonical,
    category: canonical ? findCategoryById(canonical.categoryId)?.label.fr : undefined
  };
}