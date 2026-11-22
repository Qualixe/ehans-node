// Generated from the ehans-mart template (design/ehans-mart). Safe to edit by hand.
// Used by run-seed.ts for local development and demos — never run against production data.

export interface SeedCategory {
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  position: number;
  homePosition: number | null;
  homeTitle: string | null;
  children: { slug: string; name: string; position: number }[];
}

export interface SeedProduct {
  ref: number;
  name: string;
  slug: string;
  sku: string;
  category: string;
  tags: string[];
  price: number;
  compareAtPrice: number | null;
  stock: number;
  soldCount: number;
  ratingAverage: number;
  ratingCount: number;
  isFeatured: boolean;
  images: string[];
  brand?: string;
  description?: string;
  specifications?: { label: string; value: string }[];
  buyWith?: number[];
  upsells?: number[];
  options?: { name: string; values: string[] }[];
  variants?: { title: string; option1: string; price: number; compareAtPrice: number | null }[];
}

/** Default "Bundle & Save" tiers from the template product page. */
export const seedBundles = [
  { quantity: 1, title: 'Single', discountPercent: 0, badge: null, freeDelivery: false, isDefault: false },
  { quantity: 2, title: 'Buy 2', discountPercent: 10, badge: '⚡Most Popular', freeDelivery: false, isDefault: false },
  { quantity: 3, title: 'Buy 3', discountPercent: 15, badge: '🔥Exclusive Deal', freeDelivery: true, isDefault: true },
] as const;

export const seedCategories: SeedCategory[] = [
  {
    "slug": "baby-care",
    "name": "Baby Care",
    "image": "/assets/images/category-baby-care.jpg",
    "description": "Soft, safe and useful picks for your little one — from caps to tiffin boxes.",
    "position": 0,
    "homePosition": 1,
    "homeTitle": "Baby Care",
    "children": [
      {
        "slug": "baby-care-baby-caps-and-hats",
        "name": "Baby Caps & Hats",
        "position": 0
      },
      {
        "slug": "baby-care-baby-carriers",
        "name": "Baby Carriers",
        "position": 1
      },
      {
        "slug": "baby-care-tiffin-boxes",
        "name": "Tiffin Boxes",
        "position": 2
      },
      {
        "slug": "baby-care-sun-hats",
        "name": "Sun Hats",
        "position": 3
      },
      {
        "slug": "baby-care-feeding-essentials",
        "name": "Feeding Essentials",
        "position": 4
      },
      {
        "slug": "baby-care-baby-clothing",
        "name": "Baby Clothing",
        "position": 5
      },
      {
        "slug": "baby-care-bath-and-skin-care",
        "name": "Bath & Skin Care",
        "position": 6
      },
      {
        "slug": "baby-care-baby-toys",
        "name": "Baby Toys",
        "position": 7
      },
      {
        "slug": "baby-care-diaper-bags",
        "name": "Diaper Bags",
        "position": 8
      }
    ]
  },
  {
    "slug": "baby-safety",
    "name": "Baby Safety",
    "image": "/assets/images/category-baby-safety.jpg",
    "description": "Child locks, helmets and belts that keep curious kids safe at home and on the road.",
    "position": 8,
    "homePosition": 3,
    "homeTitle": "Home Safety & Storage",
    "children": [
      {
        "slug": "baby-safety-safety-helmets",
        "name": "Safety Helmets",
        "position": 0
      },
      {
        "slug": "baby-safety-riding-safety-belts",
        "name": "Riding Safety Belts",
        "position": 1
      },
      {
        "slug": "baby-safety-fridge-child-locks",
        "name": "Fridge Child Locks",
        "position": 2
      },
      {
        "slug": "baby-safety-cabinet-locks",
        "name": "Cabinet Locks",
        "position": 3
      },
      {
        "slug": "baby-safety-drawer-locks",
        "name": "Drawer Locks",
        "position": 4
      },
      {
        "slug": "baby-safety-corner-guards",
        "name": "Corner Guards",
        "position": 5
      },
      {
        "slug": "baby-safety-door-stoppers",
        "name": "Door Stoppers",
        "position": 6
      },
      {
        "slug": "baby-safety-socket-covers",
        "name": "Socket Covers",
        "position": 7
      },
      {
        "slug": "baby-safety-safety-gates",
        "name": "Safety Gates",
        "position": 8
      }
    ]
  },
  {
    "slug": "home-kitchen",
    "name": "Home & Kitchen",
    "image": "/assets/images/category-home-kitchen.jpg",
    "description": "Smart tools that make cooking, cleaning and organizing easier every day.",
    "position": 1,
    "homePosition": 2,
    "homeTitle": "Home & Kitchen",
    "children": [
      {
        "slug": "home-kitchen-kitchen-aprons",
        "name": "Kitchen Aprons",
        "position": 0
      },
      {
        "slug": "home-kitchen-oil-dispensers",
        "name": "Oil Dispensers",
        "position": 1
      },
      {
        "slug": "home-kitchen-cleaning-sprays",
        "name": "Cleaning Sprays",
        "position": 2
      },
      {
        "slug": "home-kitchen-dish-washing-gloves",
        "name": "Dish Washing Gloves",
        "position": 3
      },
      {
        "slug": "home-kitchen-drawer-organizers",
        "name": "Drawer Organizers",
        "position": 4
      },
      {
        "slug": "home-kitchen-fridge-covers",
        "name": "Fridge Covers",
        "position": 5
      },
      {
        "slug": "home-kitchen-door-foam",
        "name": "Door Foam",
        "position": 6
      },
      {
        "slug": "home-kitchen-door-closers",
        "name": "Door Closers",
        "position": 7
      },
      {
        "slug": "home-kitchen-magic-erasers",
        "name": "Magic Erasers",
        "position": 8
      },
      {
        "slug": "home-kitchen-mouse-traps",
        "name": "Mouse Traps",
        "position": 9
      },
      {
        "slug": "home-kitchen-furniture-polish",
        "name": "Furniture Polish",
        "position": 10
      },
      {
        "slug": "home-kitchen-kitchen-face-shields",
        "name": "Kitchen Face Shields",
        "position": 11
      }
    ]
  },
  {
    "slug": "womens-essentials",
    "name": "Women’s Essentials",
    "image": "/assets/images/category-womens-essentials.jpg",
    "description": "Beauty and daily-care helpers loved by thousands of customers.",
    "position": 5,
    "homePosition": 0,
    "homeTitle": "Women’s Essentials",
    "children": [
      {
        "slug": "womens-essentials-face-masks",
        "name": "Face Masks",
        "position": 0
      },
      {
        "slug": "womens-essentials-facial-hair-removers",
        "name": "Facial Hair Removers",
        "position": 1
      },
      {
        "slug": "womens-essentials-earring-supports",
        "name": "Earring Supports",
        "position": 2
      },
      {
        "slug": "womens-essentials-clothing-tag-guns",
        "name": "Clothing Tag Guns",
        "position": 3
      },
      {
        "slug": "womens-essentials-beauty-tools",
        "name": "Beauty Tools",
        "position": 4
      },
      {
        "slug": "womens-essentials-skin-care",
        "name": "Skin Care",
        "position": 5
      },
      {
        "slug": "womens-essentials-makeup-organizers",
        "name": "Makeup Organizers",
        "position": 6
      },
      {
        "slug": "womens-essentials-handbag-accessories",
        "name": "Handbag Accessories",
        "position": 7
      },
      {
        "slug": "womens-essentials-personal-care",
        "name": "Personal Care",
        "position": 8
      }
    ]
  },
  {
    "slug": "hair-accessories",
    "name": "Hair Accessories",
    "image": "/assets/images/category-hair-accessories.jpg",
    "description": "Cute bows, clips and pins for school, parties and every day.",
    "position": 7,
    "homePosition": null,
    "homeTitle": null,
    "children": [
      {
        "slug": "hair-accessories-bow-hair-clips",
        "name": "Bow Hair Clips",
        "position": 0
      },
      {
        "slug": "hair-accessories-spring-clips",
        "name": "Spring Clips",
        "position": 1
      },
      {
        "slug": "hair-accessories-butterfly-clips",
        "name": "Butterfly Clips",
        "position": 2
      },
      {
        "slug": "hair-accessories-tassel-hairpins",
        "name": "Tassel Hairpins",
        "position": 3
      },
      {
        "slug": "hair-accessories-princess-clips",
        "name": "Princess Clips",
        "position": 4
      },
      {
        "slug": "hair-accessories-hair-oil-combs",
        "name": "Hair Oil Combs",
        "position": 5
      },
      {
        "slug": "hair-accessories-hair-bands",
        "name": "Hair Bands",
        "position": 6
      },
      {
        "slug": "hair-accessories-scrunchies",
        "name": "Scrunchies",
        "position": 7
      },
      {
        "slug": "hair-accessories-kids-hair-clips",
        "name": "Kids Hair Clips",
        "position": 8
      }
    ]
  },
  {
    "slug": "mens-essentials",
    "name": "Man’s Essentials",
    "image": "/assets/images/category-mens-essentials.jpg",
    "description": "Simple grooming and daily essentials made for men.",
    "position": 6,
    "homePosition": null,
    "homeTitle": null,
    "children": [
      {
        "slug": "mens-essentials-white-hair-cover",
        "name": "White Hair Cover",
        "position": 0
      },
      {
        "slug": "mens-essentials-grooming-tools",
        "name": "Grooming Tools",
        "position": 1
      },
      {
        "slug": "mens-essentials-beard-care",
        "name": "Beard Care",
        "position": 2
      },
      {
        "slug": "mens-essentials-hair-care",
        "name": "Hair Care",
        "position": 3
      },
      {
        "slug": "mens-essentials-wallets",
        "name": "Wallets",
        "position": 4
      },
      {
        "slug": "mens-essentials-personal-care",
        "name": "Personal Care",
        "position": 5
      }
    ]
  },
  {
    "slug": "garden-outdoor",
    "name": "Garden & Outdoor",
    "image": "/assets/images/category-garden-outdoor.jpg",
    "description": "Easy tools to keep your plants, roof garden and balcony healthy.",
    "position": 2,
    "homePosition": null,
    "homeTitle": null,
    "children": [
      {
        "slug": "garden-outdoor-branch-cutters",
        "name": "Branch Cutters",
        "position": 0
      },
      {
        "slug": "garden-outdoor-pruning-tools",
        "name": "Pruning Tools",
        "position": 1
      },
      {
        "slug": "garden-outdoor-garden-gloves",
        "name": "Garden Gloves",
        "position": 2
      },
      {
        "slug": "garden-outdoor-plant-care",
        "name": "Plant Care",
        "position": 3
      },
      {
        "slug": "garden-outdoor-watering-tools",
        "name": "Watering Tools",
        "position": 4
      },
      {
        "slug": "garden-outdoor-outdoor-essentials",
        "name": "Outdoor Essentials",
        "position": 5
      }
    ]
  },
  {
    "slug": "tools",
    "name": "Tools",
    "image": "/assets/images/category-tools.jpg",
    "description": "Handy tools for small repairs and everyday jobs around the house.",
    "position": 3,
    "homePosition": null,
    "homeTitle": null,
    "children": [
      {
        "slug": "tools-hand-tools",
        "name": "Hand Tools",
        "position": 0
      },
      {
        "slug": "tools-cutting-tools",
        "name": "Cutting Tools",
        "position": 1
      },
      {
        "slug": "tools-measuring-tools",
        "name": "Measuring Tools",
        "position": 2
      },
      {
        "slug": "tools-repair-kits",
        "name": "Repair Kits",
        "position": 3
      },
      {
        "slug": "tools-tool-organizers",
        "name": "Tool Organizers",
        "position": 4
      },
      {
        "slug": "tools-diy-essentials",
        "name": "DIY Essentials",
        "position": 5
      }
    ]
  },
  {
    "slug": "lifestyle",
    "name": "Lifestyle",
    "image": "/assets/images/category-lifestyle.jpg",
    "description": "Useful everyday products that make life a little smarter.",
    "position": 4,
    "homePosition": null,
    "homeTitle": null,
    "children": [
      {
        "slug": "lifestyle-travel-accessories",
        "name": "Travel Accessories",
        "position": 0
      },
      {
        "slug": "lifestyle-storage-and-organizers",
        "name": "Storage & Organizers",
        "position": 1
      },
      {
        "slug": "lifestyle-gift-items",
        "name": "Gift Items",
        "position": 2
      },
      {
        "slug": "lifestyle-daily-essentials",
        "name": "Daily Essentials",
        "position": 3
      },
      {
        "slug": "lifestyle-home-decor",
        "name": "Home Decor",
        "position": 4
      },
      {
        "slug": "lifestyle-gadget-accessories",
        "name": "Gadget Accessories",
        "position": 5
      }
    ]
  }
];

export const seedProducts: SeedProduct[] = [
  {
    "ref": 286,
    "name": "কিউট বেবি ক্যাপ",
    "slug": "baby-cap-hat-286",
    "sku": "EHM-286",
    "category": "baby-care",
    "tags": [
      "baby",
      "cap",
      "hat"
    ],
    "price": 600,
    "compareAtPrice": null,
    "stock": 74,
    "soldCount": 16,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-286-1.jpg",
      "/assets/images/ehans-product-286-2.jpg"
    ]
  },
  {
    "ref": 243,
    "name": "শিশুর মাথার সুরক্ষায় বেবি সেফটি হেলমেট",
    "slug": "baby-safety-helmet-head-243",
    "sku": "EHM-243",
    "category": "baby-safety",
    "tags": [
      "baby",
      "safety",
      "helmet",
      "head"
    ],
    "price": 350,
    "compareAtPrice": 590,
    "stock": 65,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-243-1.jpg",
      "/assets/images/ehans-product-243-2.jpg"
    ]
  },
  {
    "ref": 244,
    "name": "শিশু কোলে নেওয়ার আরামদায়ক মাল্টি-ফাংশনাল কেরিয়ার ব্যাগ",
    "slug": "baby-carrier-sling-bag-244",
    "sku": "EHM-244",
    "category": "baby-care",
    "tags": [
      "baby",
      "carrier",
      "sling",
      "bag"
    ],
    "price": 750,
    "compareAtPrice": 1100,
    "stock": 74,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-244-1.jpg",
      "/assets/images/ehans-product-244-2.jpg"
    ]
  },
  {
    "ref": 251,
    "name": "শিশুদের রোদ থেকে রক্ষার সান হ্যাট (টুপি)",
    "slug": "kids-sun-hat-cap-251",
    "sku": "EHM-251",
    "category": "baby-care",
    "tags": [
      "kids",
      "sun",
      "hat",
      "cap"
    ],
    "price": 450,
    "compareAtPrice": 990,
    "stock": 74,
    "soldCount": 16,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-251-1.jpg",
      "/assets/images/ehans-product-251-2.jpg"
    ]
  },
  {
    "ref": 252,
    "name": "বাচ্চাদের নিরাপদ ভ্রমণের জন্য বেবি রাইডিং সেফটি বেল্ট",
    "slug": "baby-riding-safety-belt-252",
    "sku": "EHM-252",
    "category": "baby-safety",
    "tags": [
      "baby",
      "riding",
      "safety",
      "belt",
      "harness"
    ],
    "price": 890,
    "compareAtPrice": 990,
    "stock": 20,
    "soldCount": 22,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-252-1.jpg",
      "/assets/images/ehans-product-252-2.jpg"
    ]
  },
  {
    "ref": 253,
    "name": "বাচ্চাদের প্রিমিয়াম কোয়ালিটির টিফিন বক্স",
    "slug": "kids-tiffin-lunch-box-253",
    "sku": "EHM-253",
    "category": "baby-care",
    "tags": [
      "kids",
      "tiffin",
      "lunch",
      "box"
    ],
    "price": 1250,
    "compareAtPrice": 1800,
    "stock": 29,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-253-1.jpg",
      "/assets/images/ehans-product-253-2.jpg"
    ]
  },
  {
    "ref": 277,
    "name": "গাছের ডালপালা কাটিং টুল",
    "slug": "garden-branch-cutter-pruner-277",
    "sku": "EHM-277",
    "category": "garden-outdoor",
    "tags": [
      "garden",
      "branch",
      "cutter",
      "pruner",
      "tool",
      "scissor"
    ],
    "price": 240,
    "compareAtPrice": 350,
    "stock": 56,
    "soldCount": 22,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-277-1.jpg"
    ]
  },
  {
    "ref": 296,
    "name": "প্রিমিয়াম মাউস ট্র্যাপ",
    "slug": "mouse-trap-rat-296",
    "sku": "EHM-296",
    "category": "home-kitchen",
    "tags": [
      "mouse",
      "trap",
      "rat"
    ],
    "price": 480,
    "compareAtPrice": null,
    "stock": 38,
    "soldCount": 16,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-296-1.jpg"
    ]
  },
  {
    "ref": 290,
    "name": "সুপার ক্লিনিং ন্যানো ম্যাজিক ইরেজার",
    "slug": "magic-eraser-cleaning-sponge-290",
    "sku": "EHM-290",
    "category": "home-kitchen",
    "tags": [
      "magic",
      "eraser",
      "cleaning",
      "sponge"
    ],
    "price": 350,
    "compareAtPrice": null,
    "stock": 47,
    "soldCount": 10,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-290-1.jpg"
    ]
  },
  {
    "ref": 269,
    "name": "কিচেন ফেস প্রোটেকশন মাস্ক",
    "slug": "kitchen-face-mask-shield-269",
    "sku": "EHM-269",
    "category": "home-kitchen",
    "tags": [
      "kitchen",
      "face",
      "mask",
      "shield"
    ],
    "price": 450,
    "compareAtPrice": 780,
    "stock": 47,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-269-1.jpg",
      "/assets/images/ehans-product-269-2.jpg"
    ]
  },
  {
    "ref": 255,
    "name": "ডোর ফোম - বাতাস, শব্দ ও পোকামাকড় প্রতিরোধক",
    "slug": "door-foam-draft-stopper-255",
    "sku": "EHM-255",
    "category": "home-kitchen",
    "tags": [
      "door",
      "foam",
      "draft",
      "stopper"
    ],
    "price": 100,
    "compareAtPrice": 220,
    "stock": 47,
    "soldCount": 10,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-255-1.jpg",
      "/assets/images/ehans-product-255-2.jpg"
    ]
  },
  {
    "ref": 292,
    "name": "বি-ওয়াক্স ফার্নিচার পলিস",
    "slug": "beewax-furniture-polish-wax-292",
    "sku": "EHM-292",
    "category": "home-kitchen",
    "tags": [
      "beewax",
      "furniture",
      "polish",
      "wax",
      "wood"
    ],
    "price": 290,
    "compareAtPrice": 490,
    "stock": 62,
    "soldCount": 28,
    "ratingAverage": 4.9,
    "ratingCount": 66,
    "isFeatured": false,
    "images": [
      "/assets/images/product-beewax-1.jpg",
      "/assets/images/product-beewax-2.jpg",
      "/assets/images/product-beewax-3.jpg",
      "/assets/images/product-beewax-4.jpg",
      "/assets/images/product-beewax-5.jpg",
      "/assets/images/product-beewax-6.jpg",
      "/assets/images/product-beewax-7.jpg",
      "/assets/images/product-beewax-8.jpg"
    ],
    "brand": "Mintiml",
    "description": "<p><strong>✨ BeeWax Furniture Polish</strong></p><p>পুরানো বা মলিন ফার্নিচারকে আবারও চকচকে ও সুন্দর দেখাতে ব্যবহার করুন BeeWax Furniture Polish। সহজে ব্যবহারযোগ্য এই পলিশ ফার্নিচারের উপরিভাগে ঘষে লাগালেই কাঠের মলিনভাব কমিয়ে উজ্জ্বল ও ফ্রেশ লুক দিতে সাহায্য করে।</p><p><strong>🪑 যেসব ফার্নিচারে ব্যবহার করতে পারবেন:</strong> কাঠের ফার্নিচার, বেতের ফার্নিচার, ম্যালামাইন বোর্ড, টেবিল, চেয়ার, আলমারি ও অন্যান্য ফার্নিচার।</p><p><strong>🧽 ব্যবহার পদ্ধতি:</strong> ফার্নিচারের উপরিভাগ পরিষ্কার করে অল্প পরিমাণ পলিশ নিন। এরপর কাপড় বা উপযুক্ত প্যাড দিয়ে হালকা হাতে ভালোভাবে ঘষে লাগিয়ে দিন। প্রয়োজন অনুযায়ী আবারও পলিশ করুন।</p>",
    "specifications": [
      {
        "label": "Brand",
        "value": "Mintiml"
      },
      {
        "label": "Net Weight",
        "value": "120 ml"
      },
      {
        "label": "Finish",
        "value": "Glossy look, fast dry"
      },
      {
        "label": "Use On",
        "value": "Wood, rattan / cane, melamine board"
      }
    ],
    "buyWith": [
      290,
      260
    ],
    "upsells": [
      263,
      264,
      273
    ]
  },
  {
    "ref": 256,
    "name": "আটোমেটিক দরজা বা জানালা বন্ধ করার ডিভাইস",
    "slug": "automatic-door-closer-256",
    "sku": "EHM-256",
    "category": "home-kitchen",
    "tags": [
      "automatic",
      "door",
      "closer"
    ],
    "price": 480,
    "compareAtPrice": 790,
    "stock": 56,
    "soldCount": 16,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-256-1.jpg",
      "/assets/images/ehans-product-256-2.jpg"
    ]
  },
  {
    "ref": 267,
    "name": "প্রিমিয়াম রেফ্রিজারেটর চাইল্ড লক",
    "slug": "fridge-refrigerator-child-lock-267",
    "sku": "EHM-267",
    "category": "baby-safety",
    "tags": [
      "fridge",
      "refrigerator",
      "child",
      "lock"
    ],
    "price": 350,
    "compareAtPrice": 550,
    "stock": 29,
    "soldCount": 22,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-267-1.jpg",
      "/assets/images/ehans-product-267-2.jpg"
    ]
  },
  {
    "ref": 287,
    "name": "রেগুলার কিচেন এপ্রোন",
    "slug": "kitchen-apron-287",
    "sku": "EHM-287",
    "category": "home-kitchen",
    "tags": [
      "kitchen",
      "apron"
    ],
    "price": 280,
    "compareAtPrice": 400,
    "stock": 20,
    "soldCount": 22,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-287-1.jpg",
      "/assets/images/ehans-product-287-2.jpg"
    ]
  },
  {
    "ref": 264,
    "name": "ফ্রিজ ধুলোমুক্ত রাখার কভার",
    "slug": "fridge-cover-dust-264",
    "sku": "EHM-264",
    "category": "home-kitchen",
    "tags": [
      "fridge",
      "cover",
      "dust"
    ],
    "price": 250,
    "compareAtPrice": 500,
    "stock": 65,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-264-1.jpg",
      "/assets/images/ehans-product-264-2.jpg",
      "/assets/images/ehans-product-264-3.jpg"
    ],
    "options": [
      {
        "name": "Pack",
        "values": [
          "1 Pc",
          "2 Pcs",
          "3 Pcs"
        ]
      }
    ],
    "variants": [
      {
        "title": "1 Pc",
        "option1": "1 Pc",
        "price": 250,
        "compareAtPrice": 500
      },
      {
        "title": "2 Pcs",
        "option1": "2 Pcs",
        "price": 480,
        "compareAtPrice": 1000
      },
      {
        "title": "3 Pcs",
        "option1": "3 Pcs",
        "price": 700,
        "compareAtPrice": 1500
      }
    ]
  },
  {
    "ref": 274,
    "name": "প্রিমিয়াম কিচেন এপ্রোন",
    "slug": "premium-kitchen-apron-274",
    "sku": "EHM-274",
    "category": "home-kitchen",
    "tags": [
      "premium",
      "kitchen",
      "apron"
    ],
    "price": 500,
    "compareAtPrice": 1250,
    "stock": 29,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-274-1.jpg",
      "/assets/images/ehans-product-274-2.jpg"
    ]
  },
  {
    "ref": 293,
    "name": "২ ইন ১ স্মার্ট অয়েল ডিসপেনসার বোতল",
    "slug": "oil-dispenser-bottle-spray-293",
    "sku": "EHM-293",
    "category": "home-kitchen",
    "tags": [
      "oil",
      "dispenser",
      "bottle",
      "spray"
    ],
    "price": 450,
    "compareAtPrice": 650,
    "stock": 74,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-293-1.jpg",
      "/assets/images/ehans-product-293-2.jpg"
    ]
  },
  {
    "ref": 260,
    "name": "দাগ ও তেল দূরকারী শক্তিশালী কিচেন ফোম স্প্রে",
    "slug": "kitchen-foam-cleaner-spray-260",
    "sku": "EHM-260",
    "category": "home-kitchen",
    "tags": [
      "kitchen",
      "foam",
      "cleaner",
      "spray"
    ],
    "price": 530,
    "compareAtPrice": 790,
    "stock": 29,
    "soldCount": 10,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-260-1.jpg",
      "/assets/images/ehans-product-260-2.jpg"
    ]
  },
  {
    "ref": 263,
    "name": "(6Pcs) ড্রয়ার গুছানোর প্লাস্টিক স্টোরেজ পার্টিশন",
    "slug": "drawer-organizer-partition-storage-263",
    "sku": "EHM-263",
    "category": "home-kitchen",
    "tags": [
      "drawer",
      "organizer",
      "partition",
      "storage"
    ],
    "price": 450,
    "compareAtPrice": 890,
    "stock": 56,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-263-1.jpg",
      "/assets/images/ehans-product-263-2.jpg",
      "/assets/images/ehans-product-263-3.jpg"
    ],
    "options": [
      {
        "name": "Pack",
        "values": [
          "1 Pc",
          "2 Pcs",
          "3 Pcs"
        ]
      }
    ],
    "variants": [
      {
        "title": "1 Pc",
        "option1": "1 Pc",
        "price": 450,
        "compareAtPrice": 890
      },
      {
        "title": "2 Pcs",
        "option1": "2 Pcs",
        "price": 860,
        "compareAtPrice": 1780
      },
      {
        "title": "3 Pcs",
        "option1": "3 Pcs",
        "price": 1250,
        "compareAtPrice": 2670
      }
    ]
  },
  {
    "ref": 271,
    "name": "মাল্টি-ফাংশনাল ক্যাবিনেট ও রেফ্রিজারেটর লক",
    "slug": "cabinet-fridge-lock-271",
    "sku": "EHM-271",
    "category": "baby-safety",
    "tags": [
      "cabinet",
      "fridge",
      "lock"
    ],
    "price": 450,
    "compareAtPrice": 900,
    "stock": 65,
    "soldCount": 16,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-271-1.jpg",
      "/assets/images/ehans-product-271-2.jpg"
    ]
  },
  {
    "ref": 273,
    "name": "পিভিসি কিচেন সিলিকন ডিশ ওয়াশিং হ্যান্ড গ্লাভস",
    "slug": "kitchen-gloves-dish-washing-273",
    "sku": "EHM-273",
    "category": "home-kitchen",
    "tags": [
      "kitchen",
      "gloves",
      "dish",
      "washing"
    ],
    "price": 290,
    "compareAtPrice": 490,
    "stock": 20,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-273-1.jpg",
      "/assets/images/ehans-product-273-2.jpg",
      "/assets/images/ehans-product-273-3.jpg"
    ],
    "options": [
      {
        "name": "Pack",
        "values": [
          "1 Pc",
          "2 Pcs",
          "3 Pcs"
        ]
      }
    ],
    "variants": [
      {
        "title": "1 Pc",
        "option1": "1 Pc",
        "price": 290,
        "compareAtPrice": 490
      },
      {
        "title": "2 Pcs",
        "option1": "2 Pcs",
        "price": 560,
        "compareAtPrice": 980
      },
      {
        "title": "3 Pcs",
        "option1": "3 Pcs",
        "price": 820,
        "compareAtPrice": 1470
      }
    ]
  },
  {
    "ref": 284,
    "name": "সাদা চুল ঢাকার সহজ সমাধান",
    "slug": "hair-color-white-hair-284",
    "sku": "EHM-284",
    "category": "mens-essentials",
    "tags": [
      "hair",
      "color",
      "white",
      "hair",
      "cover"
    ],
    "price": 380,
    "compareAtPrice": 650,
    "stock": 56,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-284-1.jpg"
    ]
  },
  {
    "ref": 298,
    "name": "V-Shape ফেস মাস্ক",
    "slug": "v-shape-face-mask-298",
    "sku": "EHM-298",
    "category": "womens-essentials",
    "tags": [
      "v",
      "shape",
      "face",
      "mask",
      "lifting"
    ],
    "price": 380,
    "compareAtPrice": null,
    "stock": 56,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-298-1.jpg",
      "/assets/images/ehans-product-298-2.jpg"
    ]
  },
  {
    "ref": 272,
    "name": "ফেসিয়াল কটন থ্রেড হেয়ার রিমুভার",
    "slug": "facial-thread-hair-remover-272",
    "sku": "EHM-272",
    "category": "womens-essentials",
    "tags": [
      "facial",
      "thread",
      "hair",
      "remover"
    ],
    "price": 480,
    "compareAtPrice": 1200,
    "stock": 74,
    "soldCount": 22,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-272-1.jpg",
      "/assets/images/ehans-product-272-2.jpg"
    ]
  },
  {
    "ref": 283,
    "name": "লিলি ফুল প্রিন্সেস বো হেয়ার ক্লিপ",
    "slug": "lily-bow-hair-clip-283",
    "sku": "EHM-283",
    "category": "hair-accessories",
    "tags": [
      "lily",
      "bow",
      "hair",
      "clip"
    ],
    "price": 550,
    "compareAtPrice": 650,
    "stock": 47,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-283-1.jpg",
      "/assets/images/ehans-product-283-2.jpg"
    ]
  },
  {
    "ref": 294,
    "name": "কানের দুলের সাপোর্ট স্টিকার",
    "slug": "earring-support-sticker-294",
    "sku": "EHM-294",
    "category": "womens-essentials",
    "tags": [
      "earring",
      "support",
      "sticker"
    ],
    "price": 350,
    "compareAtPrice": null,
    "stock": 20,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-294-1.jpg",
      "/assets/images/ehans-product-294-2.jpg"
    ]
  },
  {
    "ref": 285,
    "name": "হেয়ার অয়েল অ্যাপ্লিকেটর চিরুনি",
    "slug": "hair-oil-applicator-comb-285",
    "sku": "EHM-285",
    "category": "womens-essentials",
    "tags": [
      "hair",
      "oil",
      "applicator",
      "comb"
    ],
    "price": 380,
    "compareAtPrice": 650,
    "stock": 65,
    "soldCount": 10,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-285-1.jpg",
      "/assets/images/ehans-product-285-2.jpg"
    ]
  },
  {
    "ref": 278,
    "name": "লাল টিউলিপ বো হেয়ার ক্লিপ",
    "slug": "red-tulip-bow-hair-278",
    "sku": "EHM-278",
    "category": "hair-accessories",
    "tags": [
      "red",
      "tulip",
      "bow",
      "hair",
      "clip"
    ],
    "price": 600,
    "compareAtPrice": 750,
    "stock": 65,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": true,
    "images": [
      "/assets/images/ehans-product-278-1.jpg",
      "/assets/images/ehans-product-278-2.jpg"
    ]
  },
  {
    "ref": 268,
    "name": "সেফটিপিন বিহীন প্রিমিয়াম কাপড় ক্লিপিং গান",
    "slug": "clothing-tag-gun-268",
    "sku": "EHM-268",
    "category": "womens-essentials",
    "tags": [
      "clothing",
      "tag",
      "gun"
    ],
    "price": 980,
    "compareAtPrice": 1650,
    "stock": 38,
    "soldCount": 28,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-268-1.jpg",
      "/assets/images/ehans-product-268-2.jpg"
    ]
  },
  {
    "ref": 279,
    "name": "লাভ বো স্প্রিং ক্লিপ",
    "slug": "love-bow-spring-clip-279",
    "sku": "EHM-279",
    "category": "hair-accessories",
    "tags": [
      "love",
      "bow",
      "spring",
      "clip"
    ],
    "price": 430,
    "compareAtPrice": 550,
    "stock": 74,
    "soldCount": 34,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-279-1.jpg",
      "/assets/images/ehans-product-279-2.jpg"
    ]
  },
  {
    "ref": 280,
    "name": "ক্রিস্টাল বাটারফ্লাই ট্যাসেল হেয়ারপিন",
    "slug": "butterfly-crystal-tassel-hairpin-280",
    "sku": "EHM-280",
    "category": "hair-accessories",
    "tags": [
      "butterfly",
      "crystal",
      "tassel",
      "hairpin"
    ],
    "price": 650,
    "compareAtPrice": 850,
    "stock": 20,
    "soldCount": 10,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-280-1.jpg",
      "/assets/images/ehans-product-280-2.jpg"
    ]
  },
  {
    "ref": 281,
    "name": "বাটারফ্লাই ফেয়ারি হেয়ার ক্লিপ",
    "slug": "butterfly-fairy-hair-clip-281",
    "sku": "EHM-281",
    "category": "hair-accessories",
    "tags": [
      "butterfly",
      "fairy",
      "hair",
      "clip"
    ],
    "price": 550,
    "compareAtPrice": 850,
    "stock": 29,
    "soldCount": 16,
    "ratingAverage": 4.8,
    "ratingCount": 495,
    "isFeatured": false,
    "images": [
      "/assets/images/ehans-product-281-1.jpg",
      "/assets/images/ehans-product-281-2.jpg"
    ]
  }
];

