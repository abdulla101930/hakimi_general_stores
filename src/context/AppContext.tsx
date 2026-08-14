import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db, isConfigured } from '../lib/firebase';
import { doc, collection, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { logOwnerAction } from '../lib/audit';
import { safeJSONParse, safeJSONStringify } from '../lib/storage';
import { DEFAULT_PRODUCTS, isOwnerPhone } from '../lib/constants';
import { mergeCatalogByVariant } from '../lib/catalog';
import { computeBill, computeDeliveryCharge, type BillResult } from '../lib/billing';
import {
  cartKeyOf,
  getProductHandlingFee,
  resolveCartLines as buildCartLines,
  type CartLine
} from '../lib/cart';
import type {
  Address,
  Coupon,
  DeliveryPricingMode,
  DeliverySettings,
  Order,
  OrderStatus,
  OrderTimelog,
  Product,
  Role,
  User,
  View
} from '../types';

interface AppContextType {
  user: User | null;
  role: Role;
  catalog: Product[];
  customerCatalog: Product[];
  cart: Record<string, number>;
  orders: Order[];
  activeOrder: Order | null;
  currentView: View;
  addressList: Address[];
  selectedAddress: Address | null;
  appliedCoupon: Coupon | null;
  isLoginOpen: boolean;
  freeDeliveryThreshold: number;
  setFreeDeliveryThreshold: (threshold: number) => void;
  deliveryPricingMode: DeliveryPricingMode;
  flatDeliveryCharge: number;
  distanceRateMultiplier: number;
  deliverySettings: DeliverySettings;
  setDeliverySettings: (settings: Partial<DeliverySettings>) => void;
  getDeliveryCharge: (itemsTotal: number, address?: Address | null) => number;
  isMaintenanceMode: boolean;
  toggleMaintenanceMode: (enabled?: boolean) => void;
  login: (phone: string, name: string, addresses: Address[]) => void;
  logout: () => void;
  setLoginOpen: (open: boolean) => void;
  setView: (view: View) => void;
  addToCart: (productId: string, weight?: string) => void;
  removeFromCart: (productId: string, weight?: string) => void;
  updateCartQty: (productId: string, weight: string, qty: number) => void;
  clearCart: () => void;
  resolveCartLines: () => CartLine[];
  setSelectedAddress: (addr: Address) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  createOrder: (
    instructions: string,
    paymentMethod?: 'COD' | 'ONLINE',
    paymentStatus?: 'Pending' | 'Paid (Online)'
  ) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addNewAddress: (addr: Address) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updatedFields: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const readUser = (): User | null => {
  const parsed = safeJSONParse<unknown>('hakimi_user', null);
  if (parsed && typeof parsed === 'object' && typeof (parsed as User).phone === 'string') {
    return parsed as User;
  }
  return null;
};

const DEFAULT_SETTINGS: DeliverySettings = {
  freeDeliveryThreshold: 200,
  deliveryPricingMode: 'flat',
  flatDeliveryCharge: 30,
  distanceRateMultiplier: 10
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);

  const [role, setRole] = useState<Role>(() => {
    const u = readUser();
    return u ? (isOwnerPhone(u.phone) ? 'owner' : 'customer') : 'customer';
  });

  const [catalog, setCatalog] = useState<Product[]>(() => {
    if (!isConfigured) {
      const saved = safeJSONParse<Product[] | null>('hakimi_catalog', null);
      return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_PRODUCTS;
    }
    return [];
  });
  const [cart, setCart] = useState<Record<string, number>>(() => {
    const u = readUser();
    return u ? safeJSONParse<Record<string, number>>(`hakimi_cart_${u.phone}`, {}) : {};
  });

  const customerCatalog = useMemo(() => mergeCatalogByVariant(catalog), [catalog]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    const parsed = safeJSONParse<Order | null>('hakimi_active_order', null);
    return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
  });

  const [currentView, setView] = useState<View>(() => {
    const u = readUser();
    return u ? (isOwnerPhone(u.phone) ? 'admin' : 'catalog') : 'catalog';
  });

  const [deliverySettings, setDeliverySettingsState] = useState<DeliverySettings>(() => ({
    freeDeliveryThreshold: (() => {
      const saved = safeJSONParse<number | null>('hakimi_free_delivery_threshold', null);
      return typeof saved === 'number' && !isNaN(saved) ? saved : DEFAULT_SETTINGS.freeDeliveryThreshold;
    })(),
    deliveryPricingMode: (() => {
      const saved = safeJSONParse<DeliveryPricingMode | null>('hakimi_delivery_mode', null);
      return saved === 'flat' || saved === 'distance' ? saved : DEFAULT_SETTINGS.deliveryPricingMode;
    })(),
    flatDeliveryCharge: (() => {
      const saved = safeJSONParse<number | null>('hakimi_flat_delivery_charge', null);
      return typeof saved === 'number' && !isNaN(saved) ? saved : DEFAULT_SETTINGS.flatDeliveryCharge;
    })(),
    distanceRateMultiplier: (() => {
      const saved = safeJSONParse<number | null>('hakimi_distance_rate_multiplier', null);
      return typeof saved === 'number' && !isNaN(saved) ? saved : DEFAULT_SETTINGS.distanceRateMultiplier;
    })()
  }));

  const { freeDeliveryThreshold, deliveryPricingMode, flatDeliveryCharge, distanceRateMultiplier } = deliverySettings;

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() =>
    safeJSONParse<boolean>('hakimi_maintenance_mode', false)
  );

  const [selectedAddress, setSelectedAddressState] = useState<Address | null>(() => {
    const u = readUser();
    return u && Array.isArray(u.addresses) && u.addresses.length > 0 ? u.addresses[0] : null;
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLoginOpen, setLoginOpen] = useState(false);

  const persistSettings = (partial: Partial<DeliverySettings>) => {
    if (partial.freeDeliveryThreshold !== undefined)
      safeJSONStringify('hakimi_free_delivery_threshold', partial.freeDeliveryThreshold);
    if (partial.deliveryPricingMode !== undefined)
      safeJSONStringify('hakimi_delivery_mode', partial.deliveryPricingMode);
    if (partial.flatDeliveryCharge !== undefined)
      safeJSONStringify('hakimi_flat_delivery_charge', partial.flatDeliveryCharge);
    if (partial.distanceRateMultiplier !== undefined)
      safeJSONStringify('hakimi_distance_rate_multiplier', partial.distanceRateMultiplier);
  };

  const setFreeDeliveryThreshold = (val: number) => {
    logOwnerAction('DELIVERY_THRESHOLD_UPDATED', {
      oldThreshold: freeDeliveryThreshold,
      newThreshold: val
    });
    setDeliverySettingsState((prev) => ({ ...prev, freeDeliveryThreshold: val }));
    persistSettings({ freeDeliveryThreshold: val });
  };

  const setDeliverySettings = (settings: Partial<DeliverySettings>) => {
    setDeliverySettingsState((prev) => ({ ...prev, ...settings }));
    persistSettings(settings);
    if (isConfigured) {
      setDoc(doc(db, 'settings', 'store_status'), settings, { merge: true }).catch(() => {});
    }
    logOwnerAction('DELIVERY_SETTINGS_UPDATED', settings);
  };

  const getDeliveryCharge = (itemsTotal: number, address?: Address | null) =>
    computeDeliveryCharge(itemsTotal, deliverySettings, address);

  // --- Real-time store status (maintenance mode + delivery settings) ---
  useEffect(() => {
    if (!isConfigured) return;
    const settingsRef = doc(db, 'settings', 'store_status');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data() as Partial<DeliverySettings> & { isMaintenanceMode?: boolean };
      if (data.isMaintenanceMode !== undefined) {
        setIsMaintenanceMode(Boolean(data.isMaintenanceMode));
        safeJSONStringify('hakimi_maintenance_mode', Boolean(data.isMaintenanceMode));
      }
      const partial: Partial<DeliverySettings> = {};
      if (data.freeDeliveryThreshold !== undefined) partial.freeDeliveryThreshold = data.freeDeliveryThreshold;
      if (data.deliveryPricingMode !== undefined) partial.deliveryPricingMode = data.deliveryPricingMode;
      if (data.flatDeliveryCharge !== undefined) partial.flatDeliveryCharge = data.flatDeliveryCharge;
      if (data.distanceRateMultiplier !== undefined) partial.distanceRateMultiplier = data.distanceRateMultiplier;
      if (Object.keys(partial).length > 0) {
        setDeliverySettingsState((prev) => ({ ...prev, ...partial }));
        persistSettings(partial);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hakimi_maintenance_mode' && e.newValue !== null) {
        try {
          setIsMaintenanceMode(JSON.parse(e.newValue) === true);
        } catch {
          /* noop */
        }
      }
    };
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { isMaintenanceMode?: boolean } | undefined;
      if (detail?.isMaintenanceMode !== undefined) setIsMaintenanceMode(detail.isMaintenanceMode);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('hakimi_maintenance_event', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('hakimi_maintenance_event', handleCustomEvent);
    };
  }, []);

  const toggleMaintenanceMode = (enabled?: boolean) => {
    const nextVal = enabled !== undefined ? enabled : !isMaintenanceMode;
    setIsMaintenanceMode(nextVal);
    safeJSONStringify('hakimi_maintenance_mode', nextVal);
    window.dispatchEvent(
      new CustomEvent('hakimi_maintenance_event', { detail: { isMaintenanceMode: nextVal } })
    );
    if (isConfigured) {
      setDoc(doc(db, 'settings', 'store_status'), { isMaintenanceMode: nextVal }, { merge: true }).catch(() => {});
    }
    logOwnerAction('MAINTENANCE_MODE_TOGGLED', { enabled: nextVal });
  };

  // --- Catalog sync ---
  useEffect(() => {
    if (!isConfigured) {
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
          await setDoc(doc(db, 'products', id), data).catch(() => {});
        });
      } else {
        setCatalog((prev) => {
          const prevJson = JSON.stringify(prev);
          const nextJson = JSON.stringify(productsList);
          return prevJson === nextJson ? prev : productsList;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConfigured) safeJSONStringify('hakimi_catalog', catalog);
  }, [catalog]);

  // --- Orders sync ---
  useEffect(() => {
    if (!isConfigured) {
      const saved = safeJSONParse<Order[] | null>('hakimi_orders', null);
      setOrders(Array.isArray(saved) ? saved : []);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        ordersList.push(doc.data() as Order);
      });
      ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders((prev) => {
        const prevJson = JSON.stringify(prev);
        const nextJson = JSON.stringify(ordersList);
        return prevJson === nextJson ? prev : ordersList;
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConfigured) safeJSONStringify('hakimi_orders', orders);
  }, [orders]);

  useEffect(() => {
    if (activeOrder) safeJSONStringify('hakimi_active_order', activeOrder);
    else safeJSONStringify('hakimi_active_order', null);
  }, [activeOrder]);

  // --- Active order realtime listener ---
  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'delivered') return;

    if (!isConfigured) {
      const syncedOrder = orders.find((o) => o.id === activeOrder.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrder?.id]);

  // --- Cart persistence ---
  useEffect(() => {
    if (user) safeJSONStringify(`hakimi_cart_${user.phone}`, cart);
  }, [cart, user]);

  const login = (phone: string, name: string, addresses: Address[]) => {
    const newUser: User = { phone: phone.trim(), name: name.trim(), addresses };
    safeJSONStringify('hakimi_user', newUser);
    const persistedCart = safeJSONParse<Record<string, number>>(`hakimi_cart_${newUser.phone}`, {});
    setCart((prev) => {
      const merged: Record<string, number> = { ...persistedCart };
      Object.entries(prev).forEach(([key, count]) => {
        merged[key] = (merged[key] || 0) + count;
      });
      return merged;
    });
    setUser(newUser);
    if (isOwnerPhone(newUser.phone)) {
      setRole('owner');
      setView('admin');
      logOwnerAction('OWNER_LOGIN', { phone: newUser.phone });
    } else {
      setRole('customer');
      setView('catalog');
      if (addresses.length > 0) setSelectedAddressState(addresses[0]);
    }
    setLoginOpen(false);
  };

  const addNewAddress = (addr: Address) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, addresses: [...(prev.addresses || []), addr] };
      safeJSONStringify('hakimi_user', updatedUser);
      return updatedUser;
    });
    setSelectedAddressState(addr);
  };

  const logout = () => {
    safeJSONStringify('hakimi_user', null);
    setUser(null);
    setRole('customer');
    setCart({});
    setActiveOrder(null);
    setAppliedCoupon(null);
    setView('catalog');
    setSelectedAddressState(null);
  };

  const addToCart = (productId: string, weight?: string) => {
    const product = customerCatalog.find((p) => p.id === productId);
    const w = weight ?? product?.weight;
    const key = w ? cartKeyOf(productId, w) : productId;
    setCart((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const removeFromCart = (productId: string, weight?: string) => {
    const product = customerCatalog.find((p) => p.id === productId);
    const w = weight ?? product?.weight;
    const key = w ? cartKeyOf(productId, w) : productId;
    setCart((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      copy[key] -= 1;
      if (copy[key] <= 0) delete copy[key];
      return copy;
    });
  };

  const updateCartQty = (productId: string, weight: string, qty: number) => {
    const key = cartKeyOf(productId, weight);
    setCart((prev) => {
      const copy = { ...prev };
      if (qty <= 0) delete copy[key];
      else copy[key] = qty;
      return copy;
    });
  };

  const clearCart = () => setCart({});

  const resolveCartLines = () => buildCartLines(cart, customerCatalog);

  const applyCoupon = (code: string) => {
    const uppercaseCode = code.trim().toUpperCase();
    if (uppercaseCode === 'WELCOME50') {
      setAppliedCoupon({ code: 'WELCOME50', description: 'Flat ₹50 Off on your entire purchase!', discountType: 'flat', value: 50 });
      return { success: true, message: 'WELCOME50 coupon applied!' };
    }
    if (uppercaseCode === 'FREEGO' || uppercaseCode === 'FREEDELIVERY') {
      setAppliedCoupon({ code: uppercaseCode, description: 'Free handling & delivery charges!', discountType: 'free_shipping', value: 0 });
      return { success: true, message: `${uppercaseCode} coupon applied successfully!` };
    }
    return { success: false, message: 'Invalid coupon code.' };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const createOrder = (
    instructions: string,
    paymentMethod: 'COD' | 'ONLINE' = 'COD',
    paymentStatus: 'Pending' | 'Paid (Online)' = 'Pending'
  ): Order => {
    if (!user) throw new Error('Must be logged in to place an order.');
    if (!selectedAddress) throw new Error('Please select or add a delivery address.');

    const cartLines = buildCartLines(cart, customerCatalog);
    const orderItems: Order['items'] = cartLines.map((line) => ({
      id: line.product.id,
      name: line.product.name,
      quantity: line.quantity,
      price: line.price,
      weight: line.weight
    }));

    const bill: BillResult = computeBill({
      items: cartLines.map((line) => ({
        price: line.price,
        quantity: line.quantity,
        handlingFee: getProductHandlingFee(line.product, line.weight)
      })),
      settings: deliverySettings,
      address: selectedAddress,
      coupon: appliedCoupon
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newOrder: Order = {
      id: `HKM-${Math.floor(100000 + Math.random() * 900000)}`,
      customerPhone: user.phone,
      customerName: user.name,
      items: orderItems,
      address: selectedAddress,
      bill,
      status: 'placed',
      date: new Date().toLocaleString(),
      timelog: { placedAt: nowTime },
      instructions: instructions || undefined,
      driverPosition: { x: 15, y: 85 },
      eta: 15,
      paymentMethod,
      paymentStatus
    };

    if (isConfigured) {
      setDoc(doc(db, 'orders', newOrder.id), JSON.parse(JSON.stringify(newOrder))).catch(() => {});
    } else {
      setOrders((prev) => [newOrder, ...prev]);
    }

    setActiveOrder(newOrder);
    setCart({});
    setAppliedCoupon(null);
    setView('tracking');
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const existingOrder = orders.find((o) => o.id === orderId);
    const updatedTimelog: OrderTimelog = { ...(existingOrder?.timelog || {}) };
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (status === 'packing' && !updatedTimelog.packingAt) updatedTimelog.packingAt = nowTime;
    if (status === 'out_for_delivery' && !updatedTimelog.outForDeliveryAt) updatedTimelog.outForDeliveryAt = nowTime;
    if (status === 'delivered' && !updatedTimelog.deliveredAt) updatedTimelog.deliveredAt = nowTime;

    const updatedFields: Partial<Order> = { status, timelog: updatedTimelog };
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
      updateDoc(doc(db, 'orders', orderId), JSON.parse(JSON.stringify(updatedFields))).catch(() => {});
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o)));
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
      await setDoc(doc(db, 'products', newId), JSON.parse(JSON.stringify(p))).catch(() => {});
    } else {
      setCatalog((prev) => [{ ...p, id: newId }, ...prev]);
    }
  };

  const updateProduct = async (productId: string, fields: Partial<Product>) => {
    const existingProduct = catalog.find((p) => p.id === productId);
    logOwnerAction('PRODUCT_UPDATED', {
      id: productId,
      name: existingProduct?.name,
      updatedFields: fields,
      previousState: existingProduct
    });
    if (isConfigured) {
      await updateDoc(doc(db, 'products', productId), JSON.parse(JSON.stringify(fields))).catch(() => {});
    } else {
      setCatalog((prev) => prev.map((p) => (p.id === productId ? { ...p, ...fields } : p)));
    }
  };

  const deleteProduct = async (productId: string) => {
    const targetProduct = catalog.find((p) => p.id === productId);
    logOwnerAction('PRODUCT_DELETED', {
      id: productId,
      name: targetProduct?.name,
      price: targetProduct?.price,
      mainCategory: targetProduct?.mainCategory,
      subCategory: targetProduct?.subCategory
    });
    if (isConfigured) {
      await deleteDoc(doc(db, 'products', productId)).catch(() => {});
    } else {
      setCatalog((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        catalog,
        customerCatalog,
        cart,
        orders,
        activeOrder,
        currentView,
        addressList: user?.addresses || [],
        selectedAddress,
        appliedCoupon,
        isLoginOpen,
        freeDeliveryThreshold,
        setFreeDeliveryThreshold,
        deliveryPricingMode,
        flatDeliveryCharge,
        distanceRateMultiplier,
        deliverySettings,
        setDeliverySettings,
        getDeliveryCharge,
        isMaintenanceMode,
        toggleMaintenanceMode,
        login,
        logout,
        setLoginOpen,
        setView,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        resolveCartLines,
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
}

// eslint-disable-next-line react/only-export-components
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
