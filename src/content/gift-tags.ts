// Convention: kebab-case, FR sans accents
// core: tags obligatoires pour matching optimal
// optional: tags secondaires qui améliorent le score
// negative: tags à éviter absolument

export const GIFT_TAG_SETS: Record<string, {
  core: string[]; 
  optional: string[]; 
  negative: string[];
}> = {
  "carte-cadeau": {
    core: ["carte","enveloppe","ruban","icone-cadeau"],
    optional: ["boite","papier-kraft","confettis","noeud","voucher","code"],
    negative: ["personne","main","visage","logo-marque"]
  },
  "massage": {
    core: ["spa","serviettes","pierres","bougies","huiles-fermees"],
    optional: ["fleurs","diffuseur","bois-clair","galets","peignoir","bain"],
    negative: ["personne","peau","corps","sensuel","erotique"]
  },
  "bien-etre": {
    core: ["bougie","plante","tasse","coussin"],
    optional: ["brume","livre","couverture","lumiere-douce"],
    negative: ["alcool-fort","tabac","personne"]
  },
  "vin": {
    core: ["bouteille","verre","bouchon"],
    optional: ["liquide-rouge","liquide-blanc","cave","carafe","etiquette-neutre"],
    negative: ["biere","spiritueux","logo-marque","personne"]
  },
  "champagne": {
    core: ["bouteille","verres-flute","bulles"],
    optional: ["glacon","seau","etiquette-neutre","celebration"],
    negative: ["biere","vin-rouge","personne"]
  },
  "biere": {
    core: ["verre-biere","mousse","bouteille"],
    optional: ["pack","pression","houblon"],
    negative: ["vin","cocktail","personne"]
  },
  "cafe": {
    core: ["tasse","cafe-grains","cafetieres"],
    optional: ["moulin","mousse-latte","soucoupe"],
    negative: ["theiere","alcool","personne"]
  },
  "the": {
    core: ["theiere","tasse","infuseur"],
    optional: ["feuilles-the","boite-the","vapeur"],
    negative: ["cafe-grains","espresso","personne"]
  },
  "chocolat": {
    core: ["tablette","carres","cacao"],
    optional: ["coffret","ganache","ruban"],
    negative: ["personne","logo-marque","bonbon-colore"]
  },
  "patisserie": {
    core: ["gateau","patisseries","boite-patisserie"],
    optional: ["fruits-rouges","glacage","eclairs","macarons"],
    negative: ["plats-sales","personne"]
  },
  "restaurant": {
    core: ["assiette","couvert","nappe"],
    optional: ["menu","table-preparee","verre-vin"],
    negative: ["personne","serveur","marque"]
  },
  "cuisine-accessoires": {
    core: ["planche-bois","ustensiles","bol"],
    optional: ["couteau-chef","torchon","herbes"],
    negative: ["viande-crue-gros-plan","personne"]
  },
  "epicerie-fine": {
    core: ["bocaux","huile-olive","vinaigre"],
    optional: ["truffe","pates-seches","coffret"],
    negative: ["marque","personne"]
  },
  "fleurs": {
    core: ["bouquet","papier-kraft","ruban"],
    optional: ["vase","eucalyptus","fleurs-saisonnieres"],
    negative: ["terre","jardin-outils","personne"]
  },
  "plantes": {
    core: ["plante-en-pot","feuillage","pot-ceramique"],
    optional: ["cache-pot","brumisateur","terreau"],
    negative: ["bouquet","personne"]
  },
  "livre": {
    core: ["livre","pages","couverture"],
    optional: ["pile-de-livres","marque-page","etagere"],
    negative: ["tablette-numerique","personne"]
  },
  "papeterie": {
    core: ["carnet","stylo","papier"],
    optional: ["agrafes","trombone","encrier","boite"],
    negative: ["clavier","ecran","personne"]
  },
  "jeux-de-societe": {
    core: ["boite-jeu","pions","des"],
    optional: ["plateau","cartes","meeples"],
    negative: ["console","manette","personne"]
  },
  "puzzle": {
    core: ["pieces-puzzle","boite-puzzle","motif"],
    optional: ["piece-manquante","table-bois"],
    negative: ["jeu-video","personne"]
  },
  "gaming": {
    core: ["manette","casque-gaming","console"],
    optional: ["led","dock","cartouche"],
    negative: ["armes-reelles","sang","marque"]
  },
  "musique": {
    core: ["casque-audio","vinyle","platine"],
    optional: ["enceinte","partition","metronome"],
    negative: ["concert-personnes","logo-marque"]
  },
  "cinema": {
    core: ["clap-cinema","pellicule","popcorn"],
    optional: ["fauteuil-rouge","ticket"],
    negative: ["acteur-visage","marque"]
  },
  "photo": {
    core: ["appareil-photo","objectif","polaroid"],
    optional: ["pellicule","trepied","sangle"],
    negative: ["personne","marque-visible"]
  },
  "tech-accessoires": {
    core: ["powerbank","cable-usb","adaptateur"],
    optional: ["support-telephone","chargeur-induction"],
    negative: ["ecran-allume-contenu","marque"]
  },
  "audio-ecouteurs": {
    core: ["ecouteurs","boitier-charging"],
    optional: ["embouts","cable"],
    negative: ["personne","oreille"]
  },
  "montre-connectee": {
    core: ["montre","bracelet","ecran-noir"],
    optional: ["chargeur-magnetique","packaging"],
    negative: ["poignet-personne","logo"]
  },
  "beaute-soins": {
    core: ["flacons","creme-pot","pipette"],
    optional: ["serviette","plateau-bain","fleurs"],
    negative: ["maquillage-fort","personne-visage","marque"]
  },
  "parfum": {
    core: ["flacon-parfum","vaporisateur","capuchon"],
    optional: ["coffret","ruban","lumiere-douce"],
    negative: ["personne","logo-marque"]
  },
  "coffret-cadeau": {
    core: ["boite","papier-de-soie","ruban"],
    optional: ["separateurs","remplissage","etiquette-neutre"],
    negative: ["personne","marque"]
  },
  "bougies": {
    core: ["bougie","cire","pot-verre"],
    optional: ["allumettes","coupe-meche","plateau"],
    negative: ["bougie-anniversaire-chiffres","personne"]
  },
  "deco-maison": {
    core: ["vase","cadre-photo","coussin"],
    optional: ["plaid","bougie","livres-empiles"],
    negative: ["canape-avec-personne","tele-allumee"]
  },
  "arts-creatifs": {
    core: ["pinceaux","peinture","toile"],
    optional: ["palette","easel-chevalet","crayons"],
    negative: ["personne","atelier-encombre"]
  },
  "poterie-cours": {
    core: ["argile","tour-potier","bol-non-emaille"],
    optional: ["outil-sculpture","tablier-accroche"],
    negative: ["mains","personne"]
  },
  "yoga": {
    core: ["tapis-yoga","bloc","sangle-yoga"],
    optional: ["sac-tapis","bouteille"],
    negative: ["positions-humaines","salle-cours"]
  },
  "running": {
    core: ["chaussures-running","montre","bidon"],
    optional: ["chaussettes-tech","sac-hydratation"],
    negative: ["coureur-personne","logo-marque"]
  },
  "fitness-maison": {
    core: ["halteres","kettlebell","tapis"],
    optional: ["corde-saut","bande-elastique"],
    negative: ["personne","salle-pleine"]
  },
  "randonnee": {
    core: ["sac-a-dos","bouteille","boussole"],
    optional: ["carte","batons-rando"],
    negative: ["personne","sommet-selfie"]
  },
  "camping": {
    core: ["tente","lampe","sac-couchage"],
    optional: ["rechaud","tapis-sol"],
    negative: ["feu-geant","personne"]
  },
  "voyage": {
    core: ["valise","etiquette-bagage","trousse-toilette"],
    optional: ["masque-yeux","oreiller-cou"],
    negative: ["personne-aeroport","passeport-ouvert"]
  },
  "cuisine-couteaux": {
    core: ["couteau-chef","bloc-couteaux","planche-bois"],
    optional: ["aiguiseur","torchon"],
    negative: ["gros-plan-lame-sang","personne"]
  },
  "bar-cocktails": {
    core: ["shaker","verre-cocktail","doseur"],
    optional: ["zeste-citron","glacons"],
    negative: ["personne","logo-alcool"]
  },
  "fromage": {
    core: ["plateau-fromage","couteau-fromage","grapes-raisin"],
    optional: ["noix","miel"],
    negative: ["personne","marque"]
  },
  "charcuterie": {
    core: ["plateau-charcuterie","planche-bois","cornichons"],
    optional: ["pain","moutarde"],
    negative: ["personne","marque"]
  },
  "petit-dejeuner": {
    core: ["bol","jus-orange","viennoiseries"],
    optional: ["confiture","beurre","plateau"],
    negative: ["personne","logo-marque"]
  },
  "enfants-jouets": {
    core: ["peluche","blocs-bois","livre-enfant"],
    optional: ["puzzle-enfant","arc-en-ciel"],
    negative: ["enfant-reel","personne"]
  },
  "bebe-naissance": {
    core: ["doudou","biberon","chaussons-bebe"],
    optional: ["couverture","boite-souvenirs"],
    negative: ["bebe-reel","personne"]
  },
  "animaux-accessoires": {
    core: ["laisse","gamelle","jouet-chien-chat"],
    optional: ["sachet-croquettes","brosse"],
    negative: ["animal-reel","personne"]
  },
  "jardinage": {
    core: ["arrosoir","gants-jardin","graine-sachet"],
    optional: ["pots","truelle"],
    negative: ["personne","terre-sur-mains"]
  },
  "abonnement": {
    core: ["carte","boite-cadeau","calendrier"],
    optional: ["icone-livraison","enveloppe"],
    negative: ["logo-service","personne"]
  },
  "don-caritatif": {
    core: ["coeur-icone","certificat","ruban"],
    optional: ["boite","enveloppe"],
    negative: ["personne","logo-asso"]
  }
};
