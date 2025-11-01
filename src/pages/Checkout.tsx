import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Truck, CreditCard, CheckCircle, AlertCircle, User, Phone, MapPin, FileText } from 'lucide-react';

const Checkout: React.FC = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'cashOnDelivery'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [animatingItem, setAnimatingItem] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    // إذا كانت السلة فارغة، ارجع إلى الصفحة الرئيسية
    if (!cartItems || cartItems.length === 0) {
      console.log('Cart is empty or undefined, navigating to home.');
      navigate('/');
    }
  }, [cartItems, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم الكامل مطلوب';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'الاسم يجب أن يكون أكثر من 3 أحرف';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'رقم هاتف غير صالح';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'العنوان مطلوب';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'العنوان يجب أن يكون مفصلاً (10 أحرف على الأقل)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setStep(1); // Return to first step if validation fails
      return;
    }

    setLoading(true);

    try {
      // Convert cartTotal from string to number
      const totalAmount = parseFloat(cartTotal) || 0;

      // إنشاء الطلب في قاعدة البيانات
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: formData.name,
            customer_phone: formData.phone,
            customer_address: formData.address,
            notes: formData.notes,
            payment_method: formData.paymentMethod,
            total_amount: totalAmount,
            status: 'pending'
          }
        ])
        .select();

      if (orderError) throw orderError;

      // إضافة عناصر الطلب
      if (order && order.length > 0) {
        const orderId = order[0].id;
        
        const orderItems = cartItems.map(item => ({
          order_id: orderId,
          product_id: item.productId || item.id,
          quantity: item.quantity,
          price: item.numericPrice,
          product_name: item.title
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // تفريغ السلة بعد إتمام الطلب
        clearCart();
        
        // توجيه المستخدم إلى صفحة تأكيد الطلب
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.numericPrice * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <Helmet>
        <title>إكمال الطلب - سفير العطور</title>
      </Helmet>
      <Header />
      <main className="min-h-screen py-12 px-4" style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.95) 100%)',
      }}>
        <motion.div 
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Page Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-light mb-4 shadow-lg">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              إكمال الطلب
            </h1>
            <p className="text-gray-300 text-lg">
              نحن متحمسون لتقديم أفضل تجربة تسوق لك
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              <div className={`flex items-center ${step >= 1 ? 'text-accent' : 'text-gray-500'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-accent bg-accent/20' : 'border-gray-500'}`}>
                  <User className="w-6 h-6" />
                </div>
                <span className="mr-2 font-medium">المعلومات</span>
              </div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-accent' : 'bg-gray-500'}`} />
              <div className={`flex items-center ${step >= 2 ? 'text-accent' : 'text-gray-500'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-accent bg-accent/20' : 'border-gray-500'}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="mr-2 font-medium">الدفع</span>
              </div>
              <div className={`w-24 h-1 ${step >= 3 ? 'bg-accent' : 'bg-gray-500'}`} />
              <div className={`flex items-center ${step >= 3 ? 'text-accent' : 'text-gray-500'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-accent bg-accent/20' : 'border-gray-500'}`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="mr-2 font-medium">التأكيد</span>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <User className="w-6 h-6 ml-2 text-accent" />
                      معلومات التوصيل
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          الاسم الكامل <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all ${
                            errors.name ? 'border-red-500' : 'border-gray-300 focus:border-accent'
                          }`}
                          placeholder="اكتب اسمك الكامل"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 ml-1" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                          رقم الهاتف <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all ${
                            errors.phone ? 'border-red-500' : 'border-gray-300 focus:border-accent'
                          }`}
                          placeholder="01123456789"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 ml-1" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline ml-1" />
                        العنوان الكامل <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none ${
                          errors.address ? 'border-red-500' : 'border-gray-300 focus:border-accent'
                        }`}
                        placeholder="اكتب عنوانك الكامل بالتفصيل (المحافظة، المدينة، الحي، الشارع، رقم المبنى)"
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 ml-1" />
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <AnimatePresence>
                      {!showNotes ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="mt-4"
                        >
                          <motion.button
                            type="button"
                            onClick={() => setShowNotes(true)}
                            className="flex items-center justify-center bg-transparent text-gray-700 py-2 px-4 rounded-lg font-semibold hover:text-black transition-colors border-2 border-black hover:bg-gray-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <FileText className="w-5 h-5 ml-2" />
                            إضافة ملاحظات
                            <span className="text-2xl mr-2">+</span>
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">
                              <FileText className="w-4 h-4 inline ml-1" />
                              ملاحظات إضافية (اختياري)
                            </label>
                            <motion.button
                              type="button"
                              onClick={() => {
                                setShowNotes(false);
                                setFormData(prev => ({ ...prev, notes: '' }));
                              }}
                              className="text-red-500 hover:text-red-700 font-semibold text-sm"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              إلغاء
                            </motion.button>
                          </div>
                          <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all resize-none"
                            placeholder="أي تعليمات أو ملاحظات خاصة بالطلب"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Payment Method */}
                  <div className="border-t pt-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <CreditCard className="w-6 h-6 ml-2 text-accent" />
                      طريقة الدفع
                    </h2>
                    
                    <div className="space-y-4">
                      <motion.label 
                        htmlFor="cashOnDelivery"
                        className="flex items-center p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="radio"
                          id="cashOnDelivery"
                          name="paymentMethod"
                          value="cashOnDelivery"
                          checked={formData.paymentMethod === 'cashOnDelivery'}
                          onChange={handleChange}
                          className="w-5 h-5 text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2"
                        />
                        <div className="mr-4 flex-1">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center ml-3">
                              <Truck className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">الدفع عند الاستلام</p>
                              <p className="text-sm text-gray-600">ستدفع عند استلام طلبك</p>
                            </div>
                          </div>
                        </div>
                        <CheckCircle className={`w-6 h-6 ${formData.paymentMethod === 'cashOnDelivery' ? 'text-accent' : 'text-gray-400'}`} />
                      </motion.label>
                    </div>

                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-accent to-accent-light text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white ml-3"></div>
                        جاري إرسال الطلب...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6 ml-2" />
                        إتمام الطلب
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>
                
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        {item.imageUrl && (
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              onLoad={() => setAnimatingItem(null)}
                            />
                          </div>
                        )}
                        <div className="mr-3 flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-xs text-gray-600">الكمية: {item.quantity}</p>
                          <p className="text-sm font-bold text-accent mt-1">
                            {item.price} × {item.quantity} = {(item.numericPrice * item.quantity).toFixed(2)} ج.م
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                <div className="border-t pt-6 space-y-4">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-semibold">المجموع الفرعي</span>
                    <span className="font-bold">{subtotal.toFixed(2)} ج.م</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-dashed">
                    <span className="text-lg font-bold text-gray-900">الإجمالي</span>
                    <span className="text-2xl font-bold text-accent">{cartTotal} ج.م</span>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs text-green-800 text-center">
                      <Truck className="w-4 h-4 inline ml-1" />
                      سيتم حساب رسوم التوصيل عند الاستلام
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
