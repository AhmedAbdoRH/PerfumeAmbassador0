import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrderDetails(order);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return (
    <>
      <Helmet>
        <title>تأكيد الطلب - سفير العطور</title>
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          {loading ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الطلب...</p>
            </div>
          ) : orderDetails ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">تم استلام طلبك بنجاح!</h1>
              <p className="text-lg text-gray-600 mb-6">شكراً لك على طلبك. سنقوم بالتواصل معك قريباً لتأكيد الطلب.</p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-2">تفاصيل الطلب</h2>
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span className="font-medium">رقم الطلب:</span>
                  <span>{orderId}</span>
                </div>
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span className="font-medium">الاسم:</span>
                  <span>{orderDetails.customer_name}</span>
                </div>
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span className="font-medium">رقم الهاتف:</span>
                  <span>{orderDetails.customer_phone}</span>
                </div>
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span className="font-medium">العنوان:</span>
                  <span>{orderDetails.customer_address}</span>
                </div>
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span className="font-medium">طريقة الدفع:</span>
                  <span>الدفع عند الاستلام</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>المجموع:</span>
                  <span>{orderDetails.total_amount} ج.م</span>
                </div>
              </div>
              
              <Link 
                to="/" 
                className="inline-block bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark transition duration-300"
              >
                العودة للصفحة الرئيسية
              </Link>
            </>
          ) : (
            <div className="py-8">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">لم يتم العثور على الطلب</h1>
              <p className="text-gray-600 mb-6">عذراً، لم نتمكن من العثور على تفاصيل الطلب المطلوب.</p>
              <Link 
                to="/" 
                className="inline-block bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition duration-300"
              >
                العودة للصفحة الرئيسية
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OrderConfirmation;