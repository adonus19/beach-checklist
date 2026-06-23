import { Day } from './models';

/**
 * The packing plan, authored as plain data. Item ids are derived from the
 * day + group + label, so reordering is safe and saved checkmarks stick as
 * long as the wording doesn't change.
 */
interface RawGroup {
  name: string;
  emoji: string;
  note?: string;
  items: string[];
}
interface RawDay {
  name: string;
  theme: string;
  emoji: string;
  note?: string;
  groups: RawGroup[];
}

const PLAN: RawDay[] = [
  {
    name: 'Monday Night',
    theme: 'Bedding & Sleep Setup',
    emoji: '🌙',
    note: "Won't be needed until you arrive",
    groups: [
      {
        name: 'Bedding & Sleep',
        emoji: '🛏️',
        items: [
          'Sheets (2 sets for queen beds)',
          'Pillowcases',
          'Pillows',
          'Pack-n-play + fitted sheet',
          'Pack-n-play travel bag / carrying case',
          'Lightweight blanket or throw (for A/C nights)',
          'White noise machine or fan (for baby sleep)',
          'Night light',
        ],
      },
    ],
  },
  {
    name: 'Tuesday',
    theme: 'Beach Gear & Outdoor Equipment',
    emoji: '⛱️',
    note: "Bulky items you won't need before you go",
    groups: [
      {
        name: 'Beach Setup',
        emoji: '🏖️',
        items: [
          'Beach chairs',
          'Sun shade / beach canopy',
          'Beach towels',
          'Paddleboard',
          'Paddleboard leash, fin, pump, paddle',
          'Boogie boards',
          'Baby floats / swim floaties',
          'Mesh bag or laundry bag (for wet/sandy gear)',
          'Sand anchors or stakes (for canopy)',
          'Waterproof dry bags',
        ],
      },
      {
        name: 'Sun & Safety',
        emoji: '☀️',
        items: [
          'Sunscreen (multiple bottles)',
          'Aloe vera gel',
          'Aloe spray',
          'Rash guards / UV swim shirts',
          'Baby/toddler sun hat, adult hats',
          'Sunglasses (adults + kids)',
          'First aid kit (bandages, Neosporin, Benadryl, Tylenol/Motrin)',
        ],
      },
    ],
  },
  {
    name: 'Wednesday',
    theme: 'Baby Supplies, Toys & Entertainment',
    emoji: '🧸',
    note: 'Stocking up — not items needed day-to-day',
    groups: [
      {
        name: 'Baby Essentials',
        emoji: '🍼',
        items: [
          'Diapers (full week supply + a few extra)',
          'Baby wipes (2 packs)',
          'Diaper cream / Desitin',
          'Changing pad',
          'Baby carrier or wrap',
          'Swim diapers',
          'Baby sunscreen (SPF 50+, mineral)',
        ],
      },
      {
        name: 'Food & Feeding',
        emoji: '🥪',
        items: [
          'Food pouches',
          'Snacks (crackers, fruit pouches, granola bars)',
          'Other planned food (dry goods, canned, condiments)',
          'Reusable snack bags / zip-locks',
          'Baby spoons / bowls / sippy cups',
          'Portable cooler or soft cooler bag',
          'Ice packs',
        ],
      },
      {
        name: 'Drinks',
        emoji: '🥤',
        items: [
          'Alcoholic beverages',
          'Non-alcoholic drinks (water, juice, sports drinks, sparkling water)',
          'Water bottles / tumblers',
          'Can coolers / koozies',
        ],
      },
      {
        name: 'Toys & Entertainment',
        emoji: '🧩',
        items: [
          'Indoor toys (books, puzzles, small games)',
          'Beach toys (buckets, shovels, molds)',
          'Sand toys bag',
          'Tablet / iPad + case',
          "Kids' headphones",
          'Card games / board games for evenings',
          'Baby monitor',
        ],
      },
    ],
  },
  {
    name: 'Thursday',
    theme: 'Clothes, Tech & Remaining Gear',
    emoji: '🧳',
    note: 'Pack everything non-daily — toiletries set aside for tonight',
    groups: [
      {
        name: 'Clothing',
        emoji: '👕',
        items: [
          'Swimsuits (several per person)',
          'Cover-ups / beach dresses',
          'Casual evening clothes',
          'Underwear & socks',
          'Pajamas',
          'Light jacket or hoodie (for cooler evenings)',
          'Shoes (sandals, water shoes, flip-flops, sneakers)',
          'Laundry bag for dirty clothes',
        ],
      },
      {
        name: 'Tech & Charging',
        emoji: '🔌',
        items: [
          'Phone chargers + wall blocks',
          'Tablet charger',
          'Portable power bank',
          'Multi-port USB hub / charging station',
          'Waterproof phone pouch',
          'Camera + charger + memory cards',
          'Bluetooth speaker (waterproof if possible)',
          'Extension cord or power strip',
        ],
      },
      {
        name: 'Documents & Incidentals',
        emoji: '📄',
        items: [
          'ID / wallet',
          'Vaccination records (if needed for baby)',
          'Insurance cards',
          'Rental confirmation / parking info',
          'Cash for beach vendors, tips, etc.',
          'Reusable grocery bags',
        ],
      },
      {
        name: 'Toiletries',
        emoji: '🧴',
        note: 'Thursday night — set aside to grab last',
        items: [
          'Body wash / soap',
          'Shampoo & conditioner',
          'Toothbrushes (all family members)',
          'Toothpaste',
          'Deodorant',
          'Nail clippers',
          'Hair ties / brush / comb',
          'Face wash / moisturizer',
          'Razors',
          'Baby bath wash & lotion',
          'Feminine hygiene products (if needed)',
          'Prescription medications',
          'Vitamins / supplements',
        ],
      },
    ],
  },
  {
    name: 'Friday Morning',
    theme: 'Last-Minute Grab List',
    emoji: '🌅',
    note: 'Literally as you walk out the door',
    groups: [
      {
        name: 'Grab on the way out',
        emoji: '🚪',
        items: [
          'Toothbrushes & toothpaste (if not packed Thursday)',
          'Phone chargers (still plugged in overnight)',
          'Wallet & keys',
          'Snacks & drinks for the drive',
          "Baby's day bag (wipes, diapers, pouches, change of clothes)",
          'Medications',
          'Sunglasses',
          'Garbage bags (always useful at a beach house)',
          'Do a final walkthrough of every room!',
        ],
      },
    ],
  },
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Expand the authored plan into the runtime model with stable ids. */
export function buildPlan(): Day[] {
  return PLAN.map((day) => {
    const dayId = slug(day.name);
    return {
      id: dayId,
      name: day.name,
      theme: day.theme,
      emoji: day.emoji,
      note: day.note,
      groups: day.groups.map((g) => {
        const groupId = slug(g.name);
        return {
          id: `${dayId}-${groupId}`,
          name: g.name,
          emoji: g.emoji,
          note: g.note,
          items: g.items.map((label) => ({
            id: `${dayId}-${groupId}-${slug(label)}`,
            label,
            done: false,
          })),
        };
      }),
    };
  });
}
