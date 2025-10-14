export function categoryPlaceholder(slug?: string) {
  const map: Record<string, string> = {
    "carte-cadeau":"🎟️", "massage":"🪨", "bien-etre":"🕯️", "vin":"🍷", "champagne":"🥂",
    "biere":"🍺","cafe":"☕","the":"🫖","chocolat":"🍫","patisserie":"🧁","restaurant":"🍽️",
    "cuisine-accessoires":"🥣","epicerie-fine":"🫙","fleurs":"💐","plantes":"🪴","livre":"📚",
    "papeterie":"📒","jeux-de-societe":"🎲","puzzle":"🧩","gaming":"🎮","musique":"🎧",
    "cinema":"🎬","photo":"📷","tech-accessoires":"🔌","audio-ecouteurs":"🎧","montre-connectee":"⌚",
    "beaute-soins":"💧","parfum":"🌸","coffret-cadeau":"🎁","bougies":"🕯️","deco-maison":"🏡",
    "arts-creatifs":"🎨","poterie-cours":"🏺","yoga":"🧘","running":"👟","fitness-maison":"🏋️",
    "randonnee":"🥾","camping":"⛺","voyage":"🧳","cuisine-couteaux":"🔪","bar-cocktails":"🍸",
    "fromage":"🧀","charcuterie":"🥖","petit-dejeuner":"🥐","enfants-jouets":"🧸",
    "bebe-naissance":"🍼","animaux-accessoires":"🐾","jardinage":"🌱","abonnement":"📦","don-caritatif":"🎗️"
  };
  return <span className="text-4xl">{map[slug ?? ""] ?? "🎁"}</span>;
}
