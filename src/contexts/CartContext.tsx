import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface CartItem {
  id: string;
  title: string;
  price: string;
  numericPrice: number;
  quantity: number;
  imageUrl?: string;
  productId?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity' | 'numericPrice'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  isAutoShowing: boolean;
  toggleCart: (open?: boolean) => void;
  itemCount: number;
  cartTotal: string;
  subtotal: string; // Add subtotal to context type
  shippingFee: number; // Add shippingFee to context type
  sendOrderViaWhatsApp: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAutoShowing, setIsAutoShowing] = useState(false);

  const SHIPPING_FEE = 100; // Define shipping fee here

  const cleanPrice = (price: string | number): { display: string; numeric: number } => {
    // If price is already a number, use it directly
    if (typeof price === 'number') {
      return {
        display: price.toString(),
        numeric: price
      };
    }

    // Handle Arabic numerals by converting to Western numerals first
    const westernPrice = price
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

    // Extract numbers with decimal points and commas
    const match = westernPrice.match(/[\d,.]*/g)?.join('');
    let numericValue = 0;
    
    if (match) {
      // Remove any non-numeric characters except decimal point
      const cleanNumber = match.replace(/[^\d.,]/g, '')
        .replace(/,/g, '.')
        .replace(/\.(?=.*\.)/g, ''); // Remove all but last decimal point
    }
    
    return {
      display: price.trim(),
      numeric: numericValue
    };
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity' | 'numericPrice'>) => {
    const { display, numeric } = cleanPrice(item.price);
    
    setCartItems(prevItems => {
      // Check if item already exists in cart by title (since we might not have productId)
      const existingItem = prevItems.find(
        cartItem => cartItem.title === item.title
      );

      if (existingItem) {
        // If item exists, increase quantity
        return prevItems.map(cartItem =>
          cartItem.title === item.title
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
    
    // If item doesn't exist, add it to cart
    return [...prevItems, { 
      ...item, 
      id: Date.now().toString(),
      price: display,
      numericPrice: numeric,
      quantity: 1 
    }];
    });
    
    // Show cart temporarily when adding an item
    if (typeof showTemporarily === 'function') {
      showTemporarily();
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      // If last item is removed, hide the cart if it was auto-shown
      if (newItems.length === 0 && isAutoShowing) {
        toggleCart(false);
      }
      return newItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const showTemporarily = useCallback(() => {
    setIsCartOpen(true);
    setIsAutoShowing(true);
    
    // إخفاء السلة بعد 4 ثواني
    const timer = setTimeout(() => {
      setIsCartOpen(false);
      setIsAutoShowing(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleCart = useCallback((open?: boolean) => {
    if (open !== undefined) {
      setIsCartOpen(open);
      if (!open) setIsAutoShowing(false);
    } else {
      setIsCartOpen(prev => {
        const newState = !prev;
        if (!newState) setIsAutoShowing(false);
        return newState;
      });
    }
  }, []);

  const itemCount = useMemo(() => 
    cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(() => {
    const calculatedSubtotal = cartItems.reduce((total, item) => {
      const price = typeof item.numericPrice === 'number' ? item.numericPrice : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      return total + (price * quantity);
    }, 0);
    return calculatedSubtotal.toFixed(2);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    const total = parseFloat(subtotal) + SHIPPING_FEE;
    return total.toFixed(2);
  }, [subtotal]);

  const sendOrderViaWhatsApp = () => {
    if (cartItems.length === 0) {
      toast.warning('السلة فارغة، أضف منتجات أولاً');
      return;
    }

    // Format order details
    const orderDetails = cartItems.map(item =>
      `- ${item.title} (${item.quantity} × ${item.price})`
    ).join('%0A');

    // Create the message with order details, subtotal, shipping, and total
    const message = `مرحباً، أود طلب المنتجات التالية:%0A%0A${orderDetails}%0A%0Aالإجمالي الفرعي: ${subtotal} ج%0Aرسوم الشحن: ${SHIPPING_FEE.toFixed(2)} ج%0Aالإجمالي الكلي: ${cartTotal} ج%0A%0Aشكراً لكم!`;

    // Open WhatsApp with the order details
    window.open(`https://wa.me/201027381559?text=${message}`, '_blank');

    // Close the cart after sending
    toggleCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        subtotal, // Provide subtotal
        shippingFee: SHIPPING_FEE, // Provide shippingFee
        isCartOpen,
        isAutoShowing,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        sendOrderViaWhatsApp
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
