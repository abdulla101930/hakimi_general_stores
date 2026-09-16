import type { Product, Coupon } from '../types';

export const OWNER_LOGIN_PHONE = '5253123456';
export const OWNER_LOGIN_DISPLAY = '5253123456';
export const OWNER_PHONE = '+919993949604';
export const OWNER_PHONE_DISPLAY = '+91 99939 49604';
export const OWNER_WHATSAPP = '919993949604';
export const OWNER_PHONE_LINK = 'tel:+919993949604';
export const OWNER_UPI_ID = '9993949604@ybl';
export const OWNER_NAME = 'Murtaza Basra';
export const OWNER_PASSWORD = '786530';

export const isOwnerPhone = (phone: string): boolean => {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  return clean === '915253123456' || clean === '5253123456';
};

export const COUPONS: Record<string, Coupon> = {
  WELCOME50: {
    code: 'WELCOME50',
    description: 'Flat ₹50 Off on your entire purchase!',
    discountType: 'flat',
    value: 50
  },
  FREEGO: {
    code: 'FREEGO',
    description: 'Free handling & delivery charges!',
    discountType: 'free_shipping',
    value: 0
  },
  FREEDELIVERY: {
    code: 'FREEDELIVERY',
    description: 'Free handling & delivery charges!',
    discountType: 'free_shipping',
    value: 0
  }
};

export const FOOD_SUBDIVISIONS = [
  'All',
  'veg/fruits',
  'atta/rice/dal',
  'oil/ghee/masala',
  'dairy/bread/eggs',
  'bakery/biscuits',
  'dry fruits/cereal',
  'chips/namkeen',
  'teas/coffees/beverages',
  'frozen/instant foods',
  'sauces/spreads',
  'pickles',
  'icecream'
];

export const HYGIENE_SUBDIVISIONS = [
  'All',
  'bath/body',
  'hair',
  'skin care',
  'inners',
  'detergents'
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Fresh Farm Tomatoes', price: 35, originalPrice: 50, weight: '500 g', mainCategory: 'Food', subCategory: 'veg/fruits', dietaryType: 'veg', inStock: true, image: '🍅' },
  { id: 'prod-2', name: 'Organic Red Onions', price: 40, originalPrice: 48, weight: '1 kg', mainCategory: 'Food', subCategory: 'veg/fruits', dietaryType: 'veg', inStock: true, image: '🧅' },
  { id: 'prod-3', name: 'Fresh Shimla Apples', price: 140, originalPrice: 180, weight: '1 kg', mainCategory: 'Food', subCategory: 'veg/fruits', dietaryType: 'veg', inStock: true, image: '🍎' },
  { id: 'prod-4', name: "Aashirvaad Shuddh Chakki Atta", price: 245, originalPrice: 275, weight: '5 kg', mainCategory: 'Food', subCategory: 'atta/rice/dal', dietaryType: 'veg', inStock: true, image: '🌾' },
  { id: 'prod-5', name: 'Fortune Everyday Basmati Rice', price: 165, originalPrice: 195, weight: '1 kg', mainCategory: 'Food', subCategory: 'atta/rice/dal', dietaryType: 'veg', inStock: true, image: '🍚' },
  { id: 'prod-6', name: 'Tata Sampann Toor Dal', price: 135, originalPrice: 155, weight: '1 kg', mainCategory: 'Food', subCategory: 'atta/rice/dal', dietaryType: 'veg', inStock: true, image: '🥣' },
  { id: 'prod-7', name: 'Amul Pure Cow Ghee', price: 320, originalPrice: 340, weight: '500 ml', mainCategory: 'Food', subCategory: 'oil/ghee/masala', dietaryType: 'veg', inStock: true, image: '🏺' },
  { id: 'prod-8', name: 'Fortune Refined Sunflower Oil', price: 145, originalPrice: 165, weight: '1 L', mainCategory: 'Food', subCategory: 'oil/ghee/masala', dietaryType: 'veg', inStock: true, image: '🌻' },
  { id: 'prod-9', name: 'Amul Taaza Toned Milk', price: 27, weight: '500 ml', mainCategory: 'Food', subCategory: 'dairy/bread/eggs', dietaryType: 'veg', inStock: true, image: '🥛' },
  { id: 'prod-10', name: 'Farm Fresh White Eggs', price: 48, originalPrice: 55, weight: '6 pcs', mainCategory: 'Food', subCategory: 'dairy/bread/eggs', dietaryType: 'non-veg', inStock: true, image: '🥚' },
  { id: 'prod-11', name: 'Modern Whole Wheat Bread', price: 40, weight: '400 g', mainCategory: 'Food', subCategory: 'dairy/bread/eggs', dietaryType: 'veg', inStock: true, image: '🍞' },
  { id: 'prod-12', name: 'Britannia Good Day Butter Cookies', price: 30, originalPrice: 35, weight: '150 g', mainCategory: 'Food', subCategory: 'bakery/biscuits', dietaryType: 'veg', inStock: true, image: '🍪' },
  { id: 'prod-13', name: 'California Almonds (Badam)', price: 220, originalPrice: 260, weight: '250 g', mainCategory: 'Food', subCategory: 'dry fruits/cereal', dietaryType: 'veg', inStock: true, image: '🥜' },
  { id: 'prod-14', name: "Haldiram's Aloo Bhujia", price: 55, originalPrice: 65, weight: '200 g', mainCategory: 'Food', subCategory: 'chips/namkeen', dietaryType: 'veg', inStock: true, image: '🍟' },
  { id: 'prod-15', name: 'Red Label Strong Tea Powder', price: 130, originalPrice: 145, weight: '250 g', mainCategory: 'Food', subCategory: 'teas/coffees/beverages', dietaryType: 'veg', inStock: true, image: '☕' },
  { id: 'prod-16', name: 'McCain Veggie Nuggets', price: 125, originalPrice: 140, weight: '320 g', mainCategory: 'Food', subCategory: 'frozen/instant foods', dietaryType: 'veg', inStock: true, image: '🧆' },
  { id: 'prod-17', name: 'Crispy Chicken Nuggets (Frozen)', price: 195, originalPrice: 230, weight: '350 g', mainCategory: 'Food', subCategory: 'frozen/instant foods', dietaryType: 'non-veg', inStock: true, image: '🍗' },
  { id: 'prod-18', name: 'Kissan Fresh Tomato Ketchup', price: 110, originalPrice: 125, weight: '950 g', mainCategory: 'Food', subCategory: 'sauces/spreads', dietaryType: 'veg', inStock: true, image: '🥫' },
  { id: 'prod-19', name: "Mother's Recipe Mango Pickle", price: 85, originalPrice: 95, weight: '400 g', mainCategory: 'Food', subCategory: 'pickles', dietaryType: 'veg', inStock: true, image: '🥭' },
  { id: 'prod-20', name: "Kwali Wall's Chocolate Tub", price: 175, originalPrice: 200, weight: '700 ml', mainCategory: 'Food', subCategory: 'icecream', dietaryType: 'veg', inStock: true, image: '🍨' },
  { id: 'prod-21', name: 'Dettol Original Bathing Soap', price: 140, originalPrice: 160, weight: '125g x 3', mainCategory: 'Hygiene', subCategory: 'bath/body', dietaryType: 'none', inStock: true, image: '🧼' },
  { id: 'prod-22', name: 'Head & Shoulders Anti-Dandruff Shampoo', price: 210, originalPrice: 240, weight: '340 ml', mainCategory: 'Hygiene', subCategory: 'hair', dietaryType: 'none', inStock: true, image: '🧴' },
  { id: 'prod-23', name: 'Nivea Soft Moisturizing Cream', price: 165, originalPrice: 185, weight: '100 ml', mainCategory: 'Hygiene', subCategory: 'skin care', dietaryType: 'none', inStock: true, image: '✨' },
  { id: 'prod-24', name: 'Jockey Cotton Innerwear V-Neck', price: 299, originalPrice: 329, weight: '1 Pack', mainCategory: 'Hygiene', subCategory: 'inners', dietaryType: 'none', inStock: true, image: '👕' },
  { id: 'prod-25', name: 'Surf Excel Easy Wash Detergent Powder', price: 145, originalPrice: 160, weight: '1 kg', mainCategory: 'Hygiene', subCategory: 'detergents', dietaryType: 'none', inStock: true, image: '🧺' }
];
