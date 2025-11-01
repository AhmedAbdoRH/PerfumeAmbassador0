import React, { useEffect, useState } from 'react';
import ServiceCard from './ServiceCard';
import { supabase } from '../lib/supabase';
import type { Service, Category } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';

const lightGold = '#FFD700';
const brownDark = '#3d2c1d';
const accentColor = '#d99323';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = selectedCategory
    ? services.filter(service => service.category_id === selectedCategory)
    : services;

  if (isLoading) {
    return (
      <div className={`py-16 bg-gradient-to-br from-[${brownDark}] to-black`}>
        <div className="container mx-auto px-4 text-center text-white">
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-16 bg-gradient-to-br from-[${brownDark}] to-black`}>
        <div className="container mx-auto px-4 text-center text-red-600">
          حدث خطأ أثناء تحميل العطور: {error}
        </div>
      </div>
    );
  }

  return (
    <section className={`py-16 bg-gradient-to-br from-[${brownDark}] to-black`} id="products">
      <motion.div
        className="container mx-auto px-4 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/40"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.8, delayChildren: 0.3, staggerChildren: 0.2 } },
        }}
      >
        {/* العنوان */}
        <motion.h2
          className={`text-3xl font-bold text-center mb-12 text-[${lightGold}]`}
           variants={{
            hidden: { opacity: 0, y: -30 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          منتجاتنا
        </motion.h2>
        {/* الفاصل */}
        <motion.div
          className={`w-full h-1 bg-[${lightGold}] mb-0`}
          variants={{
            hidden: { opacity: 0, scaleX: 0 },
            visible: { opacity: 1, scaleX: 1, transition: { duration: 0.8, ease: 'easeInOut' } },
          }}
        />

        {/* الفئات */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mb-12"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`p-4 rounded-xl transition-all duration-300 ${
              !selectedCategory
                ? `bg-[var(--color-secondary,#34C759)] text-black font-bold shadow-md`
                : 'bg-black/20 text-white hover:bg-black/30 hover:shadow-md'
            }`}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            جميع العطور
          </motion.button>

          <AnimatePresence>
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  category.id === selectedCategory
                    ? `bg-[var(--color-secondary,#34C759)] text-black font-bold shadow-md`
                    : 'bg-black/20 text-white hover:bg-black/30 hover:shadow-md'
                }`}
                 variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
           <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* منتجاتنا */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
           variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
          }}
        >
          <AnimatePresence mode="wait">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <motion.div
                  key={service.id}
                   variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -20 }
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <ServiceCard
                    id={service.id}
                    title={service.title}
                    description={service.description || ''}
                    imageUrl={service.image_url || ''}
                    price={service.price || ''}
                    salePrice={service.sale_price || null}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="no-services"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center text-white text-xl"
                 transition={{ duration: 0.5 }}
              >
                لا توجد منتجات في هذه الفئة.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
}