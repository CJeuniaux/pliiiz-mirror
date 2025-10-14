// Mock data service for testing PLIIIZ
import { 
  User, 
  Profile, 
  Preferences, 
  CurrentWant, 
  EventType,
  AccessRequest,
  Idea
} from "@/types/pliiiz";

// Import profile images
import thomasImg from "@/assets/generated/profiles/thomas.jpg";
import alexImg from "@/assets/generated/profiles/alex.jpg";
import zoeImg from "@/assets/generated/profiles/zoe.jpg";
import samirImg from "@/assets/generated/profiles/samir.jpg";
import lilaImg from "@/assets/generated/profiles/lila.jpg";
import camilleImg from "@/assets/generated/profiles/camille.jpg";

// Mock contacts data
export const mockContacts = [
  {
    id: "thomas-l",
    name: "Thomas L.",
    city: "Lyon",
    avatar: thomasImg,
    acceptsRegift: true,
    upcomingEvents: [
      { type: "birthday", name: "Anniversaire", daysUntil: 12 }
    ],
    preferences: {
      likes: ["Rhum vieux", "Livres d'architecture", "Café de spécialité"],
      dislikes: ["Chick lit", "Accessoires de cuisine", "Parfums forts"],
      allergies: [],
      sizes: { top: "M", bottom: "40", shoes: "42" }
    }
  },
  {
    id: "alex-m",
    name: "Alex M.",
    city: "Paris",
    avatar: alexImg,
    acceptsRegift: false,
    upcomingEvents: [
      { type: "dinner", name: "Dîner", daysUntil: 5 },
      { type: "secret-santa", name: "Secret Santa", daysUntil: 45 }
    ],
    preferences: {
      likes: ["Chocolat noir 85%", "Papeterie premium", "Livres SF"],
      dislikes: ["Parfums forts", "Alcool", "Gadgets électroniques"],
      allergies: [],
      sizes: { top: "L", bottom: "42", shoes: "44" }
    }
  },
  {
    id: "zoe-d",
    name: "Zoé D.",
    city: "Marseille",
    avatar: zoeImg,
    acceptsRegift: true,
    upcomingEvents: [
      { type: "housewarming", name: "Crémaillère", daysUntil: 8 }
    ],
    preferences: {
      likes: ["Plantes d'intérieur faciles", "Déco minimaliste", "Thé en vrac"],
      dislikes: ["Objets encombrants", "Alcool", "Parfums"],
      allergies: ["Pollen"],
      sizes: { top: "S", bottom: "36", shoes: "37" }
    }
  },
  {
    id: "samir-k",
    name: "Samir K.",
    city: "Toulouse",
    avatar: samirImg,
    acceptsRegift: false,
    upcomingEvents: [
      { type: "birthday", name: "Anniversaire", daysUntil: 23 },
      { type: "brunch", name: "Brunch", daysUntil: 3 }
    ],
    preferences: {
      likes: ["Accessoires vélo", "Café de spécialité", "Livres techniques"],
      dislikes: ["Bougies parfumées", "Vêtements", "Alcool"],
      allergies: ["Noix"],
      sizes: { top: "M", bottom: "38", shoes: "41" }
    }
  },
  {
    id: "lila-r",
    name: "Lila R.",
    city: "Bordeaux",
    avatar: lilaImg,
    acceptsRegift: true,
    upcomingEvents: [
      { type: "birthday", name: "Fête des mères", daysUntil: 18 }
    ],
    preferences: {
      likes: ["Cosmétiques sans parfum", "Livres SF", "Tisanes bio"],
      dislikes: ["Fleurs coupées", "Bijoux fantaisie", "Produits chimiques"],
      allergies: ["Parfums synthétiques"],
      sizes: { top: "M", bottom: "38", shoes: "39" }
    }
  }
];

export function createTestProfile(): {
  user: User;
  profile: Profile;
  preferences: Preferences;
} {
  const testUser: User = {
    id: "test-user-camille",
    email: "camille.l@example.com",
    firstName: "Camille",
    pseudo: "CamillePlants",
    avatar: undefined,
    language: "fr",
    country: "France",
    city: "Lyon",
    createdAt: new Date("2024-01-15"),
    lastActiveAt: new Date()
  };

  const testProfile: Profile = {
    userId: testUser.id,
    bio: "Passionnée de plantes, café et lecture 🌱☕📚",
    visibilityDefaults: {
      publicPreview: true,
      defaultSections: ["likes", "budgets", "currentWants"]
    },
    eventTypes: ["birthday", "dinner", "housewarming", "christmas"]
  };

  const testCurrentWants: CurrentWant[] = [
    {
      id: "want-1",
      title: "Carnet pointillé A5",
      note: "Format Bullet Journal, couverture rigide de préférence",
      priority: "high",
      category: "papeterie"
    },
    {
      id: "want-2", 
      title: "Support téléphone vélo",
      note: "Compatible iPhone, étanche",
      priority: "medium",
      category: "sport"
    },
    {
      id: "want-3",
      title: "Roman de Becky Chambers (FR)",
      note: "Série Wayfarers, tome 2 ou 3",
      priority: "medium",
      category: "lecture"
    },
    {
      id: "want-4",
      title: "Mug isotherme 350ml",
      note: "Sans plastique, design minimaliste",
      priority: "low",
      category: "cuisine"
    }
  ];

  const testPreferences: Preferences = {
    userId: testUser.id,
    likes: [
      { text: "café de spécialité", weight: 1 },
      { text: "papeterie premium (Muji)", weight: 1 },
      { text: "plantes faciles (pothos)", weight: 1 },
      { text: "livres SF francophones", weight: 1 },
      { text: "chocolat noir 85%", weight: 1 },
      { text: "bougies non parfumées", weight: 1 },
      { text: "accessoires de vélo", weight: 1 }
    ],
    dislikes: [
      { text: "mugs supplémentaires", weight: 1 },
      { text: "parfum fort", weight: 1 },
      { text: "fleurs coupées", weight: 1 },
      { text: "gadgets encombrants", weight: 1 },
      { text: "alcool", weight: 1 }
    ],
    brands: ["Muji", "Moleskine", "Kinto", "Michel et Augustin"],
    colors: ["vert sauge", "blanc cassé", "beige", "terracotta"],
    materials: ["céramique", "bois", "coton bio", "verre"],
    styles: ["minimaliste", "scandinave", "naturel"],
    sizes: {
      top: "S",
      bottom: "36", 
      shoes: "38",
      ring: undefined,
      hat: undefined
    },
    dietary: {
      dietType: "vegetarian",
      allergies: ["arachides"],
      alcohol: {
        allowed: false,
        types: []
      }
    },
    ethics: {
      secondHandOk: true,
      crueltyFree: true,
      local: true,
      ecoLabels: ["bio", "commerce équitable"]
    },
    budgets: [
      { min: 15, max: 30, currency: "EUR", label: "15-30€" },
      { min: 30, max: 60, currency: "EUR", label: "30-60€" }
    ],
    currentWants: testCurrentWants
  };

  return {
    user: testUser,
    profile: testProfile, 
    preferences: testPreferences
  };
}

// Mock access requests
export function createTestAccessRequests(): AccessRequest[] {
  return [
    {
      id: "req-1",
      requesterId: "friend-1",
      requesterEmail: "marie.d@example.com",
      requesterName: "Marie Dubois",
      ownerId: "test-user-camille",
      eventType: "birthday",
      eventDate: new Date("2024-10-15"),
      note: "Pour l'anniversaire de Camille le 15 octobre !",
      requestedAt: new Date("2024-09-01"),
      status: "pending",
      accessScope: {
        sections: ["likes", "currentWants", "budgets", "dislikes"],
        durationDays: 30
      }
    },
    {
      id: "req-2",
      requesterId: "friend-2",
      requesterEmail: "alex.m@example.com", 
      requesterName: "Alex Martin",
      ownerId: "test-user-camille",
      eventType: "dinner",
      eventDate: new Date("2024-09-20"),
      note: "Dîner chez Camille samedi prochain",
      requestedAt: new Date("2024-09-18"),
      status: "pending",
      accessScope: {
        sections: ["likes", "dislikes", "dietary"],
        durationDays: 7
      }
    }
  ];
}

// Mock safe bet ideas
export function createTestIdeas(): Idea[] {
  return [
    {
      id: "idea-1",
      ownerId: "test-user-camille",
      title: "Carte librairie locale",
      description: "Librairie Mollat ou Page 111",
      priceEstimated: 30,
      category: "lecture",
      status: "approved",
      createdBy: "owner",
      tags: ["lecture", "local"],
      isSafeBet: false,
      createdAt: new Date("2024-01-20")
    },
    {
      id: "idea-2", 
      ownerId: "test-user-camille",
      title: "Chocolat noir 85% bio",
      description: "Marque Alter Eco ou équivalent",
      priceEstimated: 8,
      category: "gourmandise",
      status: "approved",
      createdBy: "owner", 
      tags: ["chocolat", "bio"],
      isSafeBet: false,
      createdAt: new Date("2024-01-20")
    },
    {
      id: "idea-3",
      ownerId: "test-user-camille", 
      title: "Plante verte (pothos)",
      description: "Facile d'entretien, pot inclus",
      priceEstimated: 15,
      category: "plantes",
      status: "approved",
      createdBy: "owner",
      tags: ["plantes", "déco"],
      isSafeBet: false,
      createdAt: new Date("2024-01-20")
    }
  ];
}

export function initializeTestData() {
  const { user, profile, preferences } = createTestProfile();
  const accessRequests = createTestAccessRequests();
  const ideas = createTestIdeas();

  // Store in localStorage for demo
  localStorage.setItem('pliiiz_current_user', JSON.stringify(user));
  localStorage.setItem('pliiiz_profiles', JSON.stringify({ [user.id]: profile }));
  localStorage.setItem('pliiiz_preferences', JSON.stringify({ [user.id]: preferences }));
  localStorage.setItem('pliiiz_access_requests', JSON.stringify(accessRequests));
  localStorage.setItem('pliiiz_ideas', JSON.stringify(ideas));

  return { user, profile, preferences, accessRequests, ideas };
}