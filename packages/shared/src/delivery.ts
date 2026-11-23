/**
 * Delivery: the 64 districts of Bangladesh (from glowy's config/districts.php) and the delivery
 * zones. The district a customer picks sets the zone, and the zone sets the delivery charge.
 */

export const SHIPPING_ZONES = {
  inside_dhaka: { label: 'Inside Dhaka', fee: 80 },
  outside_dhaka: { label: 'Outside Dhaka', fee: 130 },
} as const;
export type ShippingZone = keyof typeof SHIPPING_ZONES;

export interface District {
  key: string;
  name: string;
  /** Bangla name */
  bn: string;
  zone: ShippingZone;
  /** Older / alternative spellings customers type. */
  aliases?: string;
}

export const DISTRICTS: readonly District[] = [
  { key: 'dhaka', name: 'Dhaka', bn: 'ঢাকা', zone: 'inside_dhaka' },
  { key: 'faridpur', name: 'Faridpur', bn: 'ফরিদপুর', zone: 'outside_dhaka' },
  { key: 'gazipur', name: 'Gazipur', bn: 'গাজীপুর', zone: 'outside_dhaka' },
  { key: 'gopalganj', name: 'Gopalganj', bn: 'গোপালগঞ্জ', zone: 'outside_dhaka' },
  { key: 'kishoreganj', name: 'Kishoreganj', bn: 'কিশোরগঞ্জ', zone: 'outside_dhaka' },
  { key: 'madaripur', name: 'Madaripur', bn: 'মাদারীপুর', zone: 'outside_dhaka' },
  { key: 'manikganj', name: 'Manikganj', bn: 'মানিকগঞ্জ', zone: 'outside_dhaka' },
  { key: 'munshiganj', name: 'Munshiganj', bn: 'মুন্সিগঞ্জ', zone: 'outside_dhaka' },
  { key: 'narayanganj', name: 'Narayanganj', bn: 'নারায়ণগঞ্জ', zone: 'outside_dhaka' },
  { key: 'narsingdi', name: 'Narsingdi', bn: 'নরসিংদী', zone: 'outside_dhaka' },
  { key: 'rajbari', name: 'Rajbari', bn: 'রাজবাড়ী', zone: 'outside_dhaka' },
  { key: 'shariatpur', name: 'Shariatpur', bn: 'শরীয়তপুর', zone: 'outside_dhaka' },
  { key: 'tangail', name: 'Tangail', bn: 'টাঙ্গাইল', zone: 'outside_dhaka' },
  { key: 'bandarban', name: 'Bandarban', bn: 'বান্দরবান', zone: 'outside_dhaka' },
  { key: 'brahmanbaria', name: 'Brahmanbaria', bn: 'ব্রাহ্মণবাড়িয়া', zone: 'outside_dhaka' },
  { key: 'chandpur', name: 'Chandpur', bn: 'চাঁদপুর', zone: 'outside_dhaka' },
  {
    key: 'chattogram',
    name: 'Chattogram',
    bn: 'চট্টগ্রাম',
    zone: 'outside_dhaka',
    aliases: 'Chittagong Ctg',
  },
  {
    key: 'coxs-bazar',
    name: "Cox's Bazar",
    bn: 'কক্সবাজার',
    zone: 'outside_dhaka',
    aliases: 'Coxs Bazar',
  },
  { key: 'cumilla', name: 'Cumilla', bn: 'কুমিল্লা', zone: 'outside_dhaka', aliases: 'Comilla' },
  { key: 'feni', name: 'Feni', bn: 'ফেনী', zone: 'outside_dhaka' },
  {
    key: 'khagrachhari',
    name: 'Khagrachhari',
    bn: 'খাগড়াছড়ি',
    zone: 'outside_dhaka',
    aliases: 'Khagrachari',
  },
  {
    key: 'lakshmipur',
    name: 'Lakshmipur',
    bn: 'লক্ষ্মীপুর',
    zone: 'outside_dhaka',
    aliases: 'Laxmipur',
  },
  { key: 'noakhali', name: 'Noakhali', bn: 'নোয়াখালী', zone: 'outside_dhaka' },
  { key: 'rangamati', name: 'Rangamati', bn: 'রাঙ্গামাটি', zone: 'outside_dhaka' },
  { key: 'bogura', name: 'Bogura', bn: 'বগুড়া', zone: 'outside_dhaka', aliases: 'Bogra' },
  {
    key: 'chapainawabganj',
    name: 'Chapainawabganj',
    bn: 'চাঁপাইনবাবগঞ্জ',
    zone: 'outside_dhaka',
    aliases: 'Chapai Nawabganj',
  },
  { key: 'joypurhat', name: 'Joypurhat', bn: 'জয়পুরহাট', zone: 'outside_dhaka' },
  { key: 'naogaon', name: 'Naogaon', bn: 'নওগাঁ', zone: 'outside_dhaka' },
  { key: 'natore', name: 'Natore', bn: 'নাটোর', zone: 'outside_dhaka' },
  { key: 'pabna', name: 'Pabna', bn: 'পাবনা', zone: 'outside_dhaka' },
  { key: 'rajshahi', name: 'Rajshahi', bn: 'রাজশাহী', zone: 'outside_dhaka' },
  { key: 'sirajganj', name: 'Sirajganj', bn: 'সিরাজগঞ্জ', zone: 'outside_dhaka' },
  { key: 'bagerhat', name: 'Bagerhat', bn: 'বাগেরহাট', zone: 'outside_dhaka' },
  { key: 'chuadanga', name: 'Chuadanga', bn: 'চুয়াডাঙ্গা', zone: 'outside_dhaka' },
  { key: 'jashore', name: 'Jashore', bn: 'যশোর', zone: 'outside_dhaka', aliases: 'Jessore' },
  { key: 'jhenaidah', name: 'Jhenaidah', bn: 'ঝিনাইদহ', zone: 'outside_dhaka' },
  { key: 'khulna', name: 'Khulna', bn: 'খুলনা', zone: 'outside_dhaka' },
  { key: 'kushtia', name: 'Kushtia', bn: 'কুষ্টিয়া', zone: 'outside_dhaka' },
  { key: 'magura', name: 'Magura', bn: 'মাগুরা', zone: 'outside_dhaka' },
  { key: 'meherpur', name: 'Meherpur', bn: 'মেহেরপুর', zone: 'outside_dhaka' },
  { key: 'narail', name: 'Narail', bn: 'নড়াইল', zone: 'outside_dhaka' },
  { key: 'satkhira', name: 'Satkhira', bn: 'সাতক্ষীরা', zone: 'outside_dhaka' },
  { key: 'barguna', name: 'Barguna', bn: 'বরগুনা', zone: 'outside_dhaka' },
  { key: 'barishal', name: 'Barishal', bn: 'বরিশাল', zone: 'outside_dhaka', aliases: 'Barisal' },
  { key: 'bhola', name: 'Bhola', bn: 'ভোলা', zone: 'outside_dhaka' },
  {
    key: 'jhalokati',
    name: 'Jhalokati',
    bn: 'ঝালকাঠি',
    zone: 'outside_dhaka',
    aliases: 'Jhalakathi',
  },
  { key: 'patuakhali', name: 'Patuakhali', bn: 'পটুয়াখালী', zone: 'outside_dhaka' },
  { key: 'pirojpur', name: 'Pirojpur', bn: 'পিরোজপুর', zone: 'outside_dhaka' },
  { key: 'habiganj', name: 'Habiganj', bn: 'হবিগঞ্জ', zone: 'outside_dhaka' },
  {
    key: 'moulvibazar',
    name: 'Moulvibazar',
    bn: 'মৌলভীবাজার',
    zone: 'outside_dhaka',
    aliases: 'Maulvibazar',
  },
  { key: 'sunamganj', name: 'Sunamganj', bn: 'সুনামগঞ্জ', zone: 'outside_dhaka' },
  { key: 'sylhet', name: 'Sylhet', bn: 'সিলেট', zone: 'outside_dhaka' },
  { key: 'dinajpur', name: 'Dinajpur', bn: 'দিনাজপুর', zone: 'outside_dhaka' },
  { key: 'gaibandha', name: 'Gaibandha', bn: 'গাইবান্ধা', zone: 'outside_dhaka' },
  { key: 'kurigram', name: 'Kurigram', bn: 'কুড়িগ্রাম', zone: 'outside_dhaka' },
  { key: 'lalmonirhat', name: 'Lalmonirhat', bn: 'লালমনিরহাট', zone: 'outside_dhaka' },
  { key: 'nilphamari', name: 'Nilphamari', bn: 'নীলফামারী', zone: 'outside_dhaka' },
  { key: 'panchagarh', name: 'Panchagarh', bn: 'পঞ্চগড়', zone: 'outside_dhaka' },
  { key: 'rangpur', name: 'Rangpur', bn: 'রংপুর', zone: 'outside_dhaka' },
  { key: 'thakurgaon', name: 'Thakurgaon', bn: 'ঠাকুরগাঁও', zone: 'outside_dhaka' },
  { key: 'jamalpur', name: 'Jamalpur', bn: 'জামালপুর', zone: 'outside_dhaka' },
  { key: 'mymensingh', name: 'Mymensingh', bn: 'ময়মনসিংহ', zone: 'outside_dhaka' },
  { key: 'netrokona', name: 'Netrokona', bn: 'নেত্রকোনা', zone: 'outside_dhaka' },
  { key: 'sherpur', name: 'Sherpur', bn: 'শেরপুর', zone: 'outside_dhaka' },
];

export const districtByKey = (key: string): District | undefined =>
  DISTRICTS.find((d) => d.key === key);

/** Bangladeshi mobile number (glowy QuickCheckoutRequest): 01XXXXXXXXX, optional +88 / 88. */
export const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;

/** Most units of one product (or variant) in a single order (glowy shop.max_quantity_per_item). */
export const MAX_QUANTITY_PER_ITEM = 10;
