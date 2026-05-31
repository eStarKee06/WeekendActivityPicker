export const CATEGORIES = {
  "Physical Activity": [
    { label: "Park",                    weight: 10 },
    { label: "Downtown",                weight: 1  },
    { label: "Fashion Valley",          weight: 1  },
    { label: "North Park",              weight: 1  },
    { label: "Hillcrest",               weight: 1  },
    { label: "PB / Mission Beach",      weight: 1  },
    { label: "La Mesa",                 weight: 1  },
    { label: "Old Town",                weight: 1  },
    { label: "Mission Valley",          weight: 1  },
    { label: "Point Loma / Liberty St", weight: 1  },
    { label: "Balboa Park / Banker's",  weight: 1  },
    { label: "Volunteering",            weight: 1  }
  ],
  "Unjustified Splurge": [
    { label: "Kayaking",       weight: 1 },
    { label: "Arcade",         weight: 1 },
    { label: "Cat Cafe",       weight: 1 },
    { label: "Yacht",          weight: 1 },
    { label: "Fishing",        weight: 1 },
    { label: "Shooting Range", weight: 1 },
    { label: "GoKart",         weight: 1 }
  ],
  "Anti-sun Activity": [
    { label: "Karaoke",          weight: 1 },
    { label: "Dance Party",      weight: 1 },
    { label: "Improv",           weight: 1 },
    { label: "Boardgames",       weight: 1 },
    { label: "Crafting",         weight: 1 },
    { label: "Tangible Puzzles", weight: 1 }
  ]
};

export const CONFIG = {
  splurgeCategoryName: "Unjustified Splurge",
  splurgeYesWeight: 5,
  splurgeNoWeight: 95,
  palette: [
    "#7b2fff","#e040fb","#ff6b6b","#ffa94d","#ffe066","#69db7c",
    "#4dabf7","#da77f2","#f783ac","#63e6be","#74c0fc","#a9e34b","#ff8787"
  ],
  splurgePalette: ["#69db7c","#ff6b6b"],
  narrowBreakpoint: 480
};
