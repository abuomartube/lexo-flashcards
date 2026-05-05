export interface Theme {
  id: string;
  label: string;
  emoji: string;
  color: {
    gradient: string;
    glow: string;
    text: string;
  };
  words: string[];
}

export const THEMES: Theme[] = [
  {
    id: "family",
    label: "Family",
    emoji: "👨‍👩‍👧",
    color: {
      gradient: "bg-gradient-to-r from-pink-500 to-rose-500",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]",
      text: "text-pink-300",
    },
    words: [
      "mother", "father", "brother", "sister", "son", "daughter",
      "parent", "child", "baby", "family", "husband", "wife",
      "uncle", "aunt", "cousin", "grandfather", "grandmother",
      "marry", "married", "couple",
    ],
  },
  {
    id: "food",
    label: "Food & Drink",
    emoji: "🍎",
    color: {
      gradient: "bg-gradient-to-r from-orange-500 to-red-500",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.35)]",
      text: "text-orange-300",
    },
    words: [
      "bread", "milk", "cheese", "butter", "egg", "meat",
      "fish", "rice", "fruit", "vegetable", "apple", "sugar",
      "salt", "coffee", "tea", "water", "juice", "chicken",
      "soup", "cake",
    ],
  },
  {
    id: "body",
    label: "Body",
    emoji: "🧍",
    color: {
      gradient: "bg-gradient-to-r from-rose-500 to-pink-500",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]",
      text: "text-rose-300",
    },
    words: [
      "head", "hair", "eye", "ear", "nose", "mouth",
      "tooth", "neck", "shoulder", "arm", "hand", "finger",
      "leg", "foot", "knee", "back", "heart", "skin",
      "face", "body",
    ],
  },
  {
    id: "clothes",
    label: "Clothes",
    emoji: "👕",
    color: {
      gradient: "bg-gradient-to-r from-fuchsia-500 to-purple-500",
      glow: "shadow-[0_0_20px_rgba(217,70,239,0.35)]",
      text: "text-fuchsia-300",
    },
    words: [
      "shirt", "dress", "hat", "coat", "shoe", "sock",
      "jacket", "jeans", "skirt", "suit", "tie", "boot",
      "pocket", "belt", "uniform", "cotton", "wool",
      "wear", "clothes", "scarf",
    ],
  },
  {
    id: "house",
    label: "Home",
    emoji: "🏠",
    color: {
      gradient: "bg-gradient-to-r from-amber-500 to-yellow-500",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]",
      text: "text-amber-300",
    },
    words: [
      "house", "home", "room", "kitchen", "bathroom", "bedroom",
      "door", "window", "wall", "floor", "roof", "garden",
      "table", "chair", "bed", "lamp", "mirror", "key",
      "stairs", "yard",
    ],
  },
  {
    id: "school",
    label: "School",
    emoji: "🎓",
    color: {
      gradient: "bg-gradient-to-r from-blue-500 to-indigo-500",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.35)]",
      text: "text-blue-300",
    },
    words: [
      "school", "teacher", "student", "class", "lesson", "book",
      "pen", "pencil", "paper", "desk", "exam", "test",
      "study", "learn", "read", "write", "university",
      "college", "library", "homework",
    ],
  },
  {
    id: "animals",
    label: "Animals",
    emoji: "🐾",
    color: {
      gradient: "bg-gradient-to-r from-emerald-500 to-green-500",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
      text: "text-emerald-300",
    },
    words: [
      "dog", "cat", "bird", "fish", "horse", "cow",
      "pig", "sheep", "mouse", "rabbit", "lion", "tiger",
      "bear", "elephant", "monkey", "snake", "duck", "wolf",
      "animal", "insect",
    ],
  },
  {
    id: "nature",
    label: "Nature",
    emoji: "🌳",
    color: {
      gradient: "bg-gradient-to-r from-teal-500 to-emerald-500",
      glow: "shadow-[0_0_20px_rgba(20,184,166,0.35)]",
      text: "text-teal-300",
    },
    words: [
      "tree", "flower", "grass", "river", "lake", "sea",
      "mountain", "hill", "forest", "sky", "sun", "moon",
      "star", "cloud", "rain", "snow", "wind", "fire",
      "earth", "ice",
    ],
  },
  {
    id: "colors",
    label: "Colors",
    emoji: "🎨",
    color: {
      gradient: "bg-gradient-to-r from-violet-500 to-purple-500",
      glow: "shadow-[0_0_20px_rgba(139,92,246,0.35)]",
      text: "text-violet-300",
    },
    words: [
      "red", "blue", "green", "yellow", "black", "white",
      "brown", "pink", "orange", "purple", "gray", "color",
      "dark", "light", "bright", "pale", "silver", "gold",
      "shade", "rainbow",
    ],
  },
  {
    id: "time",
    label: "Time",
    emoji: "⏰",
    color: {
      gradient: "bg-gradient-to-r from-cyan-500 to-sky-500",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.35)]",
      text: "text-cyan-300",
    },
    words: [
      "hour", "minute", "second", "day", "week", "month",
      "year", "morning", "afternoon", "evening", "night",
      "today", "tomorrow", "yesterday", "time", "date",
      "weekend", "season", "summer", "winter",
    ],
  },
];

export function getThemeById(id: string | null): Theme | undefined {
  if (!id) return undefined;
  return THEMES.find((t) => t.id === id);
}

export function buildThemeWordSet(theme: Theme): Set<string> {
  return new Set(theme.words.map((w) => w.toLowerCase()));
}
