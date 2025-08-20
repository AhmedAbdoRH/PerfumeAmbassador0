import React from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Banner, StoreSettings } from '../types/database';

const brownDark = '#3d2c1d';
const lightGold = '#FFD700';

interface HeroProps {
  storeSettings?: StoreSettings | null;
  banner?: Banner | null;
}

export default function Hero({ storeSettings, banner: bannerProp }: HeroProps) {
  // استخدم البانر الممرر مباشرة بدون جلب جديد
  const banner = bannerProp ?? null;

  return (
    <div className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[${brownDark}] to-black overflow-hidden pt-20`}>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-900/10 rounded-full blur-3xl opacity-40" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-800/10 rounded-full blur-3xl opacity-40" />

      <div className="container mx-auto px-4 relative z-10">
        {banner?.type === 'image' && banner.image_url ? (
          <div className="relative w-full h-40 flex items-center justify-center rounded-2xl overflow-hidden">
  <img 
    src={banner.image_url} 
    alt={banner.title || 'Banner'} 
    className="w-full h-full object-cover object-center rounded-2xl shadow-lg opacity-0 animate-fadeIn"
    style={{ display: 'block', background: 'none', animation: 'fadeIn 1.8s ease 0.1s forwards' }}
  />
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 1.8s ease 0.1s forwards;
    }
  `}</style>
  { (banner.title || banner.description) && (
    <div className="absolute inset-0 flex items-end pointer-events-none">
      <div className="p-8 text-white w-full">
        {banner.title && <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">{banner.title}</h1>}
        {banner.description && <p className="text-lg sm:text-xl text-gray-200">{banner.description}</p>}
      </div>
    </div>
  )}
</div>
        ) : (
          <div className="w-full h-40 flex flex-col justify-center items-center bg-white/5 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex justify-center mb-6">
              <Sparkles className={`h-12 w-12 sm:h-16 sm:w-16 text-[${lightGold}]`} />
            </div>
            <h1
  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-center text-white"
  style={{ letterSpacing: '0.03em', fontFamily: `'Cairo', 'Tajawal', 'Amiri', 'Arial', sans-serif'` }}
>
  {storeSettings?.store_name || banner?.title || '   '}
</h1>
<p
  className="text-lg sm:text-xl mb-8 text-center text-gray-300"
  style={{ letterSpacing: '0.02em', fontFamily: `'Cairo', 'Tajawal', 'Amiri', 'Arial', 'sans-serif'` }}
>
  {storeSettings?.store_description || banner?.description || ''}
</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#products"
                className={`bg-[${lightGold}] text-gray-200 px-8 py-3 rounded-lg font-bold transition-colors duration-300 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
              >
                تصفح المنتجات
              </a>
              <a
                href="#contact"
                className="bg-white/10 hover:bg-white/20 text-gray-200 px-8 py-3 rounded-lg font-bold transition-colors duration-300 border border-white/20 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                تواصل معنا
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}