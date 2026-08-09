import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, isConfigured } from '../firebase';
import { logOwnerAction } from '../utils/auditLogger';
import { 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  weight: string;
  mainCategory: 'Food' | 'Hygiene';
  subCategory: string; // veg/fruits, atta/rice/dal, bath/body, hair, etc.
  category?: string; // Legacy fallback
  dietaryType?: 'veg' | 'non-veg' | 'none'; // veg, non-veg, or none (for hygiene)
  inStock: boolean;
  image: string;
  handlingFee?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  weight: string;
}

export interface Address {
  type: string;
  details: string;
  gps?: { lat: number; lng: number };
  distanceKm?: number;
}

export interface BillDetails {
  itemsTotal: number;
  handlingCharge: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
}

export interface OrderTimelog {
  placedAt?: string;
  packingAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  customerPhone: string;
  customerName: string;
  items: OrderItem[];
  address: Address;
  bill: BillDetails;
  status: 'placed' | 'packing' | 'out_for_delivery' | 'delivered';
  date: string;
  timelog?: OrderTimelog;
  instructions?: string;
  driverPosition?: { x: number; y: number }; // Simulated GPS
  eta?: number; // Estimated minutes remaining
  paymentMethod?: 'COD' | 'ONLINE';
  paymentStatus?: 'Pending' | 'Paid (Online)';
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'flat' | 'free_shipping';
  value: number;
}

interface AppContextType {
  user: { phone: string; name: string; addresses: Address[] } | null;
  role: 'customer' | 'owner';
  catalog: Product[];
  cart: Record<string, number>;
  orders: Order[];
  activeOrder: Order | null;
  currentView: 'catalog' | 'cart' | 'tracking' | 'admin';
  addressList: Address[];
  selectedAddress: Address | null;
  appliedCoupon: Coupon | null;
  isLoginOpen: boolean;
  isCartOpen: boolean;
  freeDeliveryThreshold: number;
  setFreeDeliveryThreshold: (threshold: number) => void;
  deliveryPricingMode: 'flat' | 'distance';
  flatDeliveryCharge: number;
  distanceRateMultiplier: number;
  setDeliverySettings: (settings: {
    freeDeliveryThreshold?: number;
    deliveryPricingMode?: 'flat' | 'distance';
    flatDeliveryCharge?: number;
    distanceRateMultiplier?: number;
  }) => void;
  getDeliveryCharge: (itemsTotal: number, address?: Address | null) => number;
  isMaintenanceMode: boolean;
  toggleMaintenanceMode: (enabled?: boolean) => void;
  login: (phone: string, name: string, addresses: Address[]) => void;
  logout: () => void;
  setCartOpen: (open: boolean) => void;
  setLoginOpen: (open: boolean) => void;
  setView: (view: 'catalog' | 'cart' | 'tracking' | 'admin') => void;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setSelectedAddress: (addr: Address) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  createOrder: (instructions: string, paymentMethod?: 'COD' | 'ONLINE', paymentStatus?: 'Pending' | 'Paid (Online)') => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  addNewAddress: (addr: Address) => void;
  
  // Catalog Management (Owner)
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updatedFields: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_PRODUCTS: Product[] = [
  // FOOD - veg/fruits
  {
    id: 'prod-1',
    name: 'Fresh Farm Tomatoes',
    price: 35,
    originalPrice: 50,
    weight: '500 g',
    mainCategory: 'Food',
    subCategory: 'veg/fruits',
    dietaryType: 'veg',
    inStock: true,
    image: '🍅'
  },
  {
    id: 'prod-2',
    name: 'Organic Red Onions',
    price: 40,
    originalPrice: 48,
    weight: '1 kg',
    mainCategory: 'Food',
    subCategory: 'veg/fruits',
    dietaryType: 'veg',
    inStock: true,
    image: '🧅'
  },
  {
    id: 'prod-3',
    name: 'Fresh Shimla Apples',
    price: 140,
    originalPrice: 180,
    weight: '1 kg',
    mainCategory: 'Food',
    subCategory: 'veg/fruits',
    dietaryType: 'veg',
    inStock: true,
    image: '🍎'
  },

  // FOOD - atta/rice/dal
  {
    id: 'prod-4',
    name: 'Aashirvaad Shuddh Chakki Atta',
    price: 245,
    originalPrice: 275,
    weight: '5 kg',
    mainCategory: 'Food',
    subCategory: 'atta/rice/dal',
    dietaryType: 'veg',
    inStock: true,
    image: '🌾'
  },
  {
    id: 'prod-5',
    name: 'Fortune Everyday Basmati Rice',
    price: 165,
    originalPrice: 195,
    weight: '1 kg',
    mainCategory: 'Food',
    subCategory: 'atta/rice/dal',
    dietaryType: 'veg',
    inStock: true,
    image: '🍚'
  },
  {
    id: 'prod-6',
    name: 'Tata Sampann Toor Dal',
    price: 135,
    originalPrice: 155,
    weight: '1 kg',
    mainCategory: 'Food',
    subCategory: 'atta/rice/dal',
    dietaryType: 'veg',
    inStock: true,
    image: '🥣'
  },

  // FOOD - oil/ghee/masala
  {
    id: 'prod-7',
    name: 'Amul Pure Cow Ghee',
    price: 320,
    originalPrice: 340,
    weight: '500 ml',
    mainCategory: 'Food',
    subCategory: 'oil/ghee/masala',
    dietaryType: 'veg',
    inStock: true,
    image: '🏺'
  },
  {
    id: 'prod-8',
    name: 'Fortune Refined Sunflower Oil',
    price: 145,
    originalPrice: 165,
    weight: '1 L',
    mainCategory: 'Food',
    subCategory: 'oil/ghee/masala',
    dietaryType: 'veg',
    inStock: true,
    image: '🌻'
  },

  // FOOD - dairy/bread/eggs
  {
    id: 'prod-9',
    name: 'Amul Taaza Toned Milk',
    price: 27,
    weight: '500 ml',
    mainCategory: 'Food',
    subCategory: 'dairy/bread/eggs',
    dietaryType: 'veg',
    inStock: true,
    image: '🥛'
  },
  {
    id: 'prod-10',
    name: 'Farm Fresh White Eggs',
    price: 48,
    originalPrice: 55,
    weight: '6 pcs',
    mainCategory: 'Food',
    subCategory: 'dairy/bread/eggs',
    dietaryType: 'non-veg',
    inStock: true,
    image: '🥚'
  },
  {
    id: 'prod-11',
    name: 'Modern Whole Wheat Bread',
    price: 40,
    weight: '400 g',
    mainCategory: 'Food',
    subCategory: 'dairy/bread/eggs',
    dietaryType: 'veg',
    inStock: true,
    image: '🍞'
  },

  // FOOD - bakery/biscuits
  {
    id: 'prod-12',
    name: 'Britannia Good Day Butter Cookies',
    price: 30,
    originalPrice: 35,
    weight: '150 g',
    mainCategory: 'Food',
    subCategory: 'bakery/biscuits',
    dietaryType: 'veg',
    inStock: true,
    image: '🍪'
  },

  // FOOD - dry fruits/cereal
  {
    id: 'prod-13',
    name: 'California Almonds (Badam)',
    price: 220,
    originalPrice: 260,
    weight: '250 g',
    mainCategory: 'Food',
    subCategory: 'dry fruits/cereal',
    dietaryType: 'veg',
    inStock: true,
    image: '🥜'
  },

  // FOOD - chips/namkeen
  {
    id: 'prod-14',
    name: 'Haldiram\'s Aloo Bhujia',
    price: 55,
    originalPrice: 65,
    weight: '200 g',
    mainCategory: 'Food',
    subCategory: 'chips/namkeen',
    dietaryType: 'veg',
    inStock: true,
    image: '🍟'
  },

  // FOOD - teas/coffees/beverages
  {
    id: 'prod-15',
    name: 'Red Label Strong Tea Powder',
    price: 130,
    originalPrice: 145,
    weight: '250 g',
    mainCategory: 'Food',
    subCategory: 'teas/coffees/beverages',
    dietaryType: 'veg',
    inStock: true,
    image: '☕'
  },

  // FOOD - frozen/instant foods
  {
    id: 'prod-16',
    name: 'McCain Veggie Nuggets',
    price: 125,
    originalPrice: 140,
    weight: '320 g',
    mainCategory: 'Food',
    subCategory: 'frozen/instant foods',
    dietaryType: 'veg',
    inStock: true,
    image: '🧆'
  },
  {
    id: 'prod-17',
    name: 'Crispy Chicken Nuggets (Frozen)',
    price: 195,
    originalPrice: 230,
    weight: '350 g',
    mainCategory: 'Food',
    subCategory: 'frozen/instant foods',
    dietaryType: 'non-veg',
    inStock: true,
    image: '🍗'
  },

  // FOOD - sauces/spreads & pickles
  {
    id: 'prod-18',
    name: 'Kissan Fresh Tomato Ketchup',
    price: 110,
    originalPrice: 125,
    weight: '950 g',
    mainCategory: 'Food',
    subCategory: 'sauces/spreads',
    dietaryType: 'veg',
    inStock: true,
    image: '🥫'
  },
  {
    id: 'prod-19',
    name: 'Mother\'s Recipe Mango Pickle',
    price: 85,
    originalPrice: 95,
    weight: '400 g',
    mainCategory: 'Food',
    subCategory: 'pickles',
    dietaryType: 'veg',
    inStock: true,
    image: '🥭'
  },

  // FOOD - icecream
  {
    id: 'prod-20',
    name: 'Kwali Wall\'s Chocolate Tub',
    price: 175,
    originalPrice: 200,
    weight: '700 ml',
    mainCategory: 'Food',
    subCategory: 'icecream',
    dietaryType: 'veg',
    inStock: true,
    image: '🍨'
  },

  // HYGIENE - bath/body
  {
    id: 'prod-21',
    name: 'Dettol Original Bathing Soap',
    price: 140,
    originalPrice: 160,
    weight: '125g x 3',
    mainCategory: 'Hygiene',
    subCategory: 'bath/body',
    dietaryType: 'none',
    inStock: true,
    image: '🧼'
  },

  // HYGIENE - hair
  {
    id: 'prod-22',
    name: 'Head & Shoulders Anti-Dandruff Shampoo',
    price: 210,
    originalPrice: 240,
    weight: '340 ml',
    mainCategory: 'Hygiene',
    subCategory: 'hair',
    dietaryType: 'none',
    inStock: true,
    image: '🧴'
  },

  // HYGIENE - skin care
  {
    id: 'prod-23',
    name: 'Nivea Soft Moisturizing Cream',
    price: 165,
    originalPrice: 185,
    weight: '100 ml',
    mainCategory: 'Hygiene',
    subCategory: 'skin care',
    dietaryType: 'none',
    inStock: true,
    image: '✨'
  },

  // HYGIENE - inners
  {
    id: 'prod-24',
    name: 'Jockey Cotton Innerwear V-Neck',
    price: 299,
    originalPrice: 329,
    weight: '1 Pack',
    mainCategory: 'Hygiene',
    subCategory: 'inners',
    dietaryType: 'none',
    inStock: true,
    image: '👕'
  },

  // HYGIENE - detergents
  {
    id: 'prod-25',
    name: 'Surf Excel Easy Wash Detergent Powder',
    price: 145,
    originalPrice: 160,
    weight: '1 kg',
    mainCategory: 'Hygiene',
    subCategory: 'detergents',
    dietaryType: 'none',
    inStock: true,
    image: '🧺'
  }
];

export const OWNER_PHONE = '+919993949604';
export const OWNER_PHONE_DISPLAY = '+91 99939 49604';

export const isOwnerPhone = (phone: string) => {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, '');
  return clean === '919993949604' || clean === '9993949604';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ phone: string; name: string; addresses: Address[] } | null>(() => {
    const saved = localStorage.getItem('hakimi_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRole] = useState<'customer' | 'owner'>(() => {
    const savedUser = localStorage.getItem('hakimi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return isOwnerPhone(parsed.phone) ? 'owner' : 'customer';
    }
    return 'customer';
  });

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>(() => {
    const savedUser = localStorage.getItem('hakimi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const cartKey = `hakimi_cart_${parsed.phone}`;
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : {};
    }
    return {};
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    const saved = localStorage.getItem('hakimi_active_order');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setView] = useState<'catalog' | 'cart' | 'tracking' | 'admin'>(() => {
    const savedUser = localStorage.getItem('hakimi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return isOwnerPhone(parsed.phone) ? 'admin' : 'catalog';
    }
    return 'catalog';
  });

  // Owner Configurable Free Delivery & Delivery Fee Settings
  const [freeDeliveryThreshold, setFreeDeliveryThresholdState] = useState<number>(() => {
    const saved = localStorage.getItem('hakimi_free_delivery_threshold');
    return saved ? parseFloat(saved) : 200;
  });

  const [deliveryPricingMode, setDeliveryPricingMode] = useState<'flat' | 'distance'>(() => {
    const saved = localStorage.getItem('hakimi_delivery_mode');
    return (saved as 'flat' | 'distance') || 'flat';
  });

  const [flatDeliveryCharge, setFlatDeliveryCharge] = useState<number>(() => {
    const saved = localStorage.getItem('hakimi_flat_delivery_charge');
    return saved ? parseFloat(saved) : 30;
  });

  const [distanceRateMultiplier, setDistanceRateMultiplier] = useState<number>(() => {
    const saved = localStorage.getItem('hakimi_distance_rate_multiplier');
    return saved ? parseFloat(saved) : 10; // Default ₹10 / km
  });

  const setFreeDeliveryThreshold = (val: number) => {
    logOwnerAction('DELIVERY_THRESHOLD_UPDATED', { oldThreshold: freeDeliveryThreshold, newThreshold: val });
    setFreeDeliveryThresholdState(val);
    localStorage.setItem('hakimi_free_delivery_threshold', val.toString());
  };

  const setDeliverySettings = (settings: {
    freeDeliveryThreshold?: number;
    deliveryPricingMode?: 'flat' | 'distance';
    flatDeliveryCharge?: number;
    distanceRateMultiplier?: number;
  }) => {
    if (settings.freeDeliveryThreshold !== undefined) {
      setFreeDeliveryThresholdState(settings.freeDeliveryThreshold);
      localStorage.setItem('hakimi_free_delivery_threshold', settings.freeDeliveryThreshold.toString());
    }
    if (settings.deliveryPricingMode !== undefined) {
      setDeliveryPricingMode(settings.deliveryPricingMode);
      localStorage.setItem('hakimi_delivery_mode', settings.deliveryPricingMode);
    }
    if (settings.flatDeliveryCharge !== undefined) {
      setFlatDeliveryCharge(settings.flatDeliveryCharge);
      localStorage.setItem('hakimi_flat_delivery_charge', settings.flatDeliveryCharge.toString());
    }
    if (settings.distanceRateMultiplier !== undefined) {
      setDistanceRateMultiplier(settings.distanceRateMultiplier);
      localStorage.setItem('hakimi_distance_rate_multiplier', settings.distanceRateMultiplier.toString());
    }
    logOwnerAction('DELIVERY_SETTINGS_UPDATED', settings);
  };

  const getDeliveryCharge = (itemsTotal: number, address?: Address | null): number => {
    if (itemsTotal >= freeDeliveryThreshold) {
      return 0;
    }

    if (deliveryPricingMode === 'distance') {
      let distanceKm = address?.distanceKm || 3; // Default 3 km
      if (address?.gps?.lat && address?.gps?.lng) {
        const shopLocation = { lat: 22.7196, lng: 75.8577 };
        const R = 6371; // Earth radius in km
        const dLat = ((address.gps.lat - shopLocation.lat) * Math.PI) / 180;
        const dLng = ((address.gps.lng - shopLocation.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((shopLocation.lat * Math.PI) / 180) *
            Math.cos((address.gps.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Math.max(1, Math.round(R * c * 10) / 10);
      }
      // Distance charge: distanceInKm * distanceRateMultiplier
      return Math.max(10, Math.round(distanceKm * distanceRateMultiplier));
    }

    return flatDeliveryCharge;
  };

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('hakimi_maintenance_mode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleMaintenanceMode = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !isMaintenanceMode;
    setIsMaintenanceMode(nextVal);
    localStorage.setItem('hakimi_maintenance_mode', JSON.stringify(nextVal));
    logOwnerAction('MAINTENANCE_MODE_TOGGLED' as any, { enabled: nextVal });
  };

  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(() => {
    const savedUser = localStorage.getItem('hakimi_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.addresses && parsed.addresses.length > 0) {
        return parsed.addresses[0];
      }
    }
    return null;
  });
  
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<string | null>(null);

  // --- FIRESTORE CATALOG SYNC ---
  useEffect(() => {
    if (!isConfigured) {
      const saved = localStorage.getItem('hakimi_catalog');
      setCatalog(saved ? JSON.parse(saved) : DEFAULT_PRODUCTS);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const productsList: Product[] = [];
      snapshot.forEach((doc) => {
        productsList.push({ id: doc.id, ...doc.data() } as Product);
      });

      if (productsList.length === 0) {
        DEFAULT_PRODUCTS.forEach(async (p) => {
          const { id, ...data } = p;
          await setDoc(doc(db, 'products', id), data);
        });
      } else {
        setCatalog(productsList);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      localStorage.setItem('hakimi_catalog', JSON.stringify(catalog));
    }
  }, [catalog]);

  // --- FIRESTORE ORDERS SYNC ---
  useEffect(() => {
    if (!isConfigured) {
      const saved = localStorage.getItem('hakimi_orders');
      setOrders(saved ? JSON.parse(saved) : []);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        ordersList.push(doc.data() as Order);
      });
      ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(ordersList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('hakimi_active_order', JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem('hakimi_active_order');
    }
  }, [activeOrder]);

  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'delivered') return;

    if (!isConfigured) {
      const syncedOrder = orders.find(o => o.id === activeOrder.id);
      if (syncedOrder && syncedOrder.status !== activeOrder.status) {
        setActiveOrder(syncedOrder);
      }
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'orders', activeOrder.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as Order;
        if (JSON.stringify(data) !== JSON.stringify(activeOrder)) {
          setActiveOrder(data);
        }
      }
    });

    return () => unsubscribe();
  }, [activeOrder?.id, orders]);

  useEffect(() => {
    if (!isConfigured) {
      localStorage.setItem('hakimi_orders', JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`hakimi_cart_${user.phone}`, JSON.stringify(cart));
    }
  }, [cart, user]);

  useEffect(() => {
    if (user) {
      const cartKey = `hakimi_cart_${user.phone}`;
      const savedCart = localStorage.getItem(cartKey);
      const userCart = savedCart ? JSON.parse(savedCart) : {};
      
      if (pendingCartAction) {
        userCart[pendingCartAction] = (userCart[pendingCartAction] || 0) + 1;
        setPendingCartAction(null);
      }
      
      setCart(userCart);
    }
  }, [user]);

  const login = (phone: string, name: string, addresses: Address[]) => {
    const formattedPhone = phone.trim();
    const formattedName = name.trim();
    const newUser = { phone: formattedPhone, name: formattedName, addresses };
    localStorage.setItem('hakimi_user', JSON.stringify(newUser));
    setUser(newUser);
    
    if (isOwnerPhone(formattedPhone)) {
      setRole('owner');
      setView('admin');
      logOwnerAction('OWNER_LOGIN', { phone: formattedPhone });
    } else {
      setRole('customer');
      setView('catalog');
      if (addresses.length > 0) {
        setSelectedAddressState(addresses[0]);
      }
    }
    setLoginOpen(false);
  };

  const addNewAddress = (addr: Address) => {
    if (!user) return;
    const updatedAddresses = [...(user.addresses || []), addr];
    const updatedUser = { ...user, addresses: updatedAddresses };
    localStorage.setItem('hakimi_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSelectedAddressState(addr);
  };

  const logout = () => {
    localStorage.removeItem('hakimi_user');
    setUser(null);
    setRole('customer');
    setCart({});
    setActiveOrder(null);
    setAppliedCoupon(null);
    setView('catalog');
    setSelectedAddressState(null);
  };

  const addToCart = (productId: string) => {
    if (!user) {
      setPendingCartAction(productId);
      setLoginOpen(true);
      return;
    }
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const copy = { ...prev };
      if (!copy[productId]) return prev;
      copy[productId] -= 1;
      if (copy[productId] <= 0) {
        delete copy[productId];
      }
      return copy;
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    } else {
      setCart(prev => ({
        ...prev,
        [productId]: qty
      }));
    }
  };

  const clearCart = () => {
    setCart({});
  };

  const applyCoupon = (code: string) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (uppercaseCode === 'WELCOME50') {
      const coupon: Coupon = {
        code: 'WELCOME50',
        description: 'Flat ₹50 Off on your entire purchase!',
        discountType: 'flat',
        value: 50
      };
      setAppliedCoupon(coupon);
      return { success: true, message: 'WELCOME50 coupon applied!' };
    } else if (uppercaseCode === 'FREEGO' || uppercaseCode === 'FREEDELIVERY') {
      const coupon: Coupon = {
        code: uppercaseCode,
        description: 'Free handling & delivery charges!',
        discountType: 'free_shipping',
        value: 0
      };
      setAppliedCoupon(coupon);
      return { success: true, message: `${uppercaseCode} coupon applied successfully!` };
    }
    return { success: false, message: 'Invalid coupon code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const createOrder = (
    instructions: string, 
    paymentMethod: 'COD' | 'ONLINE' = 'COD', 
    paymentStatus: 'Pending' | 'Paid (Online)' = 'Pending'
  ) => {
    if (!user) throw new Error('Must be logged in to place an order.');
    if (!selectedAddress) throw new Error('Please select or add a delivery address.');

    let itemsTotal = 0;
    let handlingCharge = 0;
    const orderItems: OrderItem[] = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = catalog.find(p => p.id === id);
      if (prod) {
        const cost = prod.price * qty;
        itemsTotal += cost;
        handlingCharge += (prod.handlingFee || 0) * qty;
        orderItems.push({
          id: prod.id,
          name: prod.name,
          quantity: qty,
          price: prod.price,
          weight: prod.weight
        });
      }
    });

    let deliveryCharge = getDeliveryCharge(itemsTotal, selectedAddress);

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'flat') {
        discount = Math.min(appliedCoupon.value, itemsTotal);
      } else if (appliedCoupon.discountType === 'free_shipping') {
        handlingCharge = 0;
        deliveryCharge = 0;
      }
    }

    const grandTotal = Math.max(0, itemsTotal + handlingCharge + deliveryCharge - discount);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: `HKM-${Math.floor(100000 + Math.random() * 900000)}`,
      customerPhone: user.phone,
      customerName: user.name,
      items: orderItems,
      address: selectedAddress,
      bill: { itemsTotal, handlingCharge, deliveryCharge, discount, grandTotal },
      status: 'placed',
      date: new Date().toLocaleString(),
      timelog: {
        placedAt: nowTime
      },
      instructions: instructions || undefined,
      driverPosition: { x: 15, y: 85 },
      eta: 15,
      paymentMethod,
      paymentStatus
    };

    if (isConfigured) {
      const firestoreOrder = JSON.parse(JSON.stringify(newOrder));
      setDoc(doc(db, 'orders', newOrder.id), firestoreOrder).catch(console.error);
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }

    setActiveOrder(newOrder);
    setCart({});
    setAppliedCoupon(null);
    setView('tracking');
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const existingOrder = orders.find(o => o.id === orderId);
    const updatedTimelog: OrderTimelog = { ...(existingOrder?.timelog || {}) };
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (status === 'packing' && !updatedTimelog.packingAt) updatedTimelog.packingAt = nowTime;
    if (status === 'out_for_delivery' && !updatedTimelog.outForDeliveryAt) updatedTimelog.outForDeliveryAt = nowTime;
    if (status === 'delivered' && !updatedTimelog.deliveredAt) updatedTimelog.deliveredAt = nowTime;

    const updatedFields: Partial<Order> = { 
      status, 
      timelog: updatedTimelog 
    };

    if (status === 'out_for_delivery') {
      updatedFields.driverPosition = { x: 15, y: 85 };
      updatedFields.eta = 15;
    } else if (status === 'delivered') {
      updatedFields.driverPosition = { x: 85, y: 15 };
      updatedFields.eta = 0;
    }

    logOwnerAction('ORDER_STATUS_CHANGED', {
      orderId,
      oldStatus: existingOrder?.status,
      newStatus: status,
      customerName: existingOrder?.customerName,
      customerPhone: existingOrder?.customerPhone
    });

    if (isConfigured) {
      const cleanFields = JSON.parse(JSON.stringify(updatedFields));
      updateDoc(doc(db, 'orders', orderId), cleanFields).catch(console.error);
    } else {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, ...updatedFields } : o))
      );
    }
  };

  const addProduct = async (p: Omit<Product, 'id'>) => {
    const newId = `prod-${Math.floor(1000 + Math.random() * 9000)}`;
    logOwnerAction('PRODUCT_ADDED', {
      id: newId,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      weight: p.weight,
      mainCategory: p.mainCategory,
      subCategory: p.subCategory,
      inStock: p.inStock
    });

    if (isConfigured) {
      const cleanProd = JSON.parse(JSON.stringify(p));
      await setDoc(doc(db, 'products', newId), cleanProd).catch(console.error);
    } else {
      const newProduct: Product = { ...p, id: newId };
      setCatalog(prev => [newProduct, ...prev]);
    }
  };

  const updateProduct = async (productId: string, fields: Partial<Product>) => {
    const existingProduct = catalog.find(p => p.id === productId);
    logOwnerAction('PRODUCT_UPDATED', {
      id: productId,
      name: existingProduct?.name,
      updatedFields: fields,
      previousState: existingProduct
    });

    if (isConfigured) {
      const cleanFields = JSON.parse(JSON.stringify(fields));
      await updateDoc(doc(db, 'products', productId), cleanFields).catch(console.error);
    } else {
      setCatalog(prev =>
        prev.map(p => (p.id === productId ? { ...p, ...fields } : p))
      );
    }
  };

  const deleteProduct = async (productId: string) => {
    const targetProduct = catalog.find(p => p.id === productId);
    logOwnerAction('PRODUCT_DELETED', {
      id: productId,
      name: targetProduct?.name,
      price: targetProduct?.price,
      mainCategory: targetProduct?.mainCategory,
      subCategory: targetProduct?.subCategory
    });

    if (isConfigured) {
      await deleteDoc(doc(db, 'products', productId)).catch(console.error);
    } else {
      setCatalog(prev => prev.filter(p => p.id !== productId));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        catalog,
        cart,
        orders,
        activeOrder,
        currentView,
        addressList: user?.addresses || [],
        selectedAddress,
        appliedCoupon,
        isLoginOpen,
        isCartOpen,
        freeDeliveryThreshold,
        setFreeDeliveryThreshold,
        deliveryPricingMode,
        flatDeliveryCharge,
        distanceRateMultiplier,
        setDeliverySettings,
        getDeliveryCharge,
        isMaintenanceMode,
        toggleMaintenanceMode,
        login,
        logout,
        setCartOpen,
        setLoginOpen,
        setView,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        setSelectedAddress: setSelectedAddressState,
        applyCoupon,
        removeCoupon,
        createOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        addNewAddress
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
};
