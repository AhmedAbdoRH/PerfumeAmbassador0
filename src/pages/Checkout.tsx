import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Checkout: React.FC = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'cashOnDelivery'
  });

  useEffect(() => {
    // إذا كانت السلة فارغة، ارجع إلى الصفحة الرئيسية
    if (!cart || cart.length === 0) {
      console.log('Cart is empty or undefined, navigating to home.');
      navigate('/');
    }
  }, [cart, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Submitting form. Current cart:', cart);

    try {
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
            total_amount: totalPrice,
            status: 'pending'
          }
        ])
        .select();

      if (orderError) throw orderError;

      // إضافة عناصر الطلب
      if (order && order.length > 0) {
        const orderId = order[0].id;
        
        const orderItems = cart.map(item => ({
          order_id: orderId,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.name
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

  return (
    <>
      <Helmet>
        <title>إكمال الطلب - سفير العطور</title>
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-8">إكمال الطلب</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* نموذج معلومات العميل */}
            <div className="order-2 md:order-1">
              <h2 className="text-xl font-semibold mb-4">معلومات التوصيل</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    طريقة الدفع
                  </label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="radio"
                      id="cashOnDelivery"
                      name="paymentMethod"
                      value="cashOnDelivery"
                      checked={formData.paymentMethod === 'cashOnDelivery'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <label htmlFor="cashOnDelivery" className="text-sm text-gray-700">
                      الدفع عند الاستلام
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-dark transition duration-300 disabled:opacity-50"
                >
                  {loading ? 'جاري إرسال الطلب...' : 'إتمام الطلب'}
                </button>
              </form>
            </div>
            
            {/* ملخص الطلب */}
            <div className="order-1 md:order-2 bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">ملخص الطلب</h2>
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto">
                  {cart && cart.length > 0 ? (
                    cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex items-center">
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="mr-4">
                            <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.price * item.quantity} ج.م
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">السلة فارغة.</p>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>المجموع</p>
                    <p>{totalPrice} ج.م</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">سيتم احتساب رسوم التوصيل عند التسليم</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;