import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase'; // تأكد من أن مسار supabase صحيح
import type { Service, Category, StoreSettings } from '../types/database'; // تأكد من أن مسار الأنواع صحيح

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// =====================
// إعدادات Groq API
// =====================
const GROQ_API_KEY = "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"; // استبدل بمفتاحك الخاص
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192";

// =================================================================================
// تعديل: تم تحديث المكون ليعرض وصف المنتج كنص، ثم يضيف زر "عرض المنتج" في الأسفل
// =================================================================================
const RenderMessageWithLinks = ({ text }: { text: string }) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: { url: string }[] = [];

  // نسخة جديدة من Regex لاستخدامها في الحلقة لتجنب مشاكل lastIndex
  const regexForLoop = new RegExp(linkRegex);
  let match;

  // أولاً: استخراج كل روابط المنتجات وتخزينها
  while ((match = regexForLoop.exec(text)) !== null) {
    const [, , url] = match; // المجموعة الثانية تحتوي على الرابط
    links.push({ url });
  }
  
  // ثانياً: تنظيف النص من صيغة الماركدوان، مع الإبقاء على اسم المنتج كنص عادي
  // مثال: "جرب [عطر رائع](url)" سيصبح "جرب عطر رائع"
  const cleanedText = text.replace(linkRegex, '$1');

  return (
    <div className="flex flex-col">
      <p className="whitespace-pre-wrap font-medium">{cleanedText}</p>
      
      {/* عرض الأزرار فقط إذا تم العثور على روابط */}
      {links.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-center bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-semibold py-1.5 px-3 rounded-lg transition-all border border-emerald-500/50"
            >
              <ExternalLink className="w-3 h-3"/>
              عرض المنتج
            </a>
          ))}
        </div>
      )}
    </div>
  );
};


export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'أهلاً بك في سفير العطور 🌹 كيف أقدر أساعدك؟',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storeData, setStoreData] = useState<{
    products: Service[];
    categories: Category[];
    storeSettings: StoreSettings | null;
  }>({
    products: [],
    categories: [],
    storeSettings: null
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && storeData.products.length === 0) {
      fetchStoreData();
    }
  }, [isOpen]);

  const fetchStoreData = async () => {
    try {
      const { data: products, error: productsError } = await supabase.from('services').select(`*, category:categories(*)`).order('created_at', { ascending: false });
      if (productsError) throw productsError;

      const { data: categories, error: categoriesError } = await supabase.from('categories').select('*').order('name');
      if (categoriesError) throw categoriesError;

      const { data: storeSettings, error: storeError } = await supabase.from('store_settings').select('*').single();
      if (storeError && storeError.code !== 'PGRST116') console.error('Error fetching store settings:', storeError);

      setStoreData({ products: products || [], categories: categories || [], storeSettings: storeSettings || null });
    } catch (error) {
      console.error('Error fetching store data:', error);
    }
  };

  const generateStoreContext = () => {
    const { products, storeSettings } = storeData;
    let context = `أنت مساعد ذكي لمتجر "${storeSettings?.store_name || 'سفير العطور'}".\n\n`;
    
    if (products.length > 0) {
      context += `المنتجات المتاحة في المتجر:\n`;
      products.forEach(product => {
        context += `\n--- ${product.title} ---\n`;
        context += `رابط المنتج: https://perfume-ambassador.com/product/${product.id}\n`;
        if (product.description) context += `الوصف: ${product.description}\n`;
        if (product.price) context += `السعر: ${product.price} ج.م\n`;
        if (product.sale_price) context += `السعر بعد الخصم: ${product.sale_price} ج.م\n`;
        if (product.category?.name) context += `الفئة: ${product.category.name}\n`;
      });
      context += '\n';
    }

    context += `تعليمات الرد:
- كن ودوداً واستخدم اللهجة المصرية.
- **مهم جدًا: اجعل ردودك مختصرة جدًا ومباشرة. قدم المعلومة الأساسية فقط.**
- **شجع العميل على طرح المزيد من الأسئلة إذا أراد تفاصيل إضافية بقول "لو حابب تفاصيل أكتر، أنا موجود يا فندم."**
- عند اقتراح منتج، اذكر اسمه مع نبذة خفيفة جدًا، وأرفق رابطه باستخدام تنسيق Markdown هكذا: [اسم المنتج](رابط المنتج). **يجب أن يكون الرابط في نهاية النبذة المختصرة.**
- **مهم جدًا: لا تستخدم الجداول (Markdown tables) نهائيًا لعرض المنتجات. اعرض كل منتج في فقرة منفصلة.**
- إذا لم تجد المنتج، اقترح منتجًا مشابهًا بشكل مباشر.
- لا تذكر رقم الواتساب أو معلومات تواصل، فقط زر الواتساب موجود إذا احتاجه العميل.`;

    return context;
  };

  const sendToAI = async (message: string): Promise<string> => {
    try {
      const storeContext = generateStoreContext();
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'system', content: storeContext }, { role: 'user', content: message }],
          temperature: 0.7,
          max_tokens: 1024,
        })
      });

      if (!response.ok) throw new Error('فشل في الاتصال بالخدمة');
      const data: any = await response.json();
      return data?.choices?.[0]?.message?.content?.trim() || 'عذراً، لم أتمكن من فهم سؤالك.';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return `⚠️ حدث خطأ تقني.`;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), text: inputText.trim(), isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await sendToAI(userMessage.text);
      setTimeout(() => {
        const botMessage: Message = { id: (Date.now() + 1).toString(), text: aiResponse, isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), text: '⚠️ عذراً، حدث خطأ.', isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  return (
    <>
      <motion.button onClick={() => setIsOpen(true)} className="fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 z-50 group" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} className="fixed bottom-24 left-6 w-80 h-96 bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-green-600/20 to-emerald-600/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div>
                <div>
                  <h3 className="text-white font-semibold text-sm">مساعد {storeData.storeSettings?.store_name || 'سفير العطور'}</h3>
                  <p className="text-green-400 text-xs">متصل الآن</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors p-1"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
              {messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[95%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${message.isUser ? 'bg-gradient-to-r from-green-600 to-emerald-700' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
                      {message.isUser ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-white" />}
                    </div>
                    <div className={`flex flex-col gap-1 ${message.isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-3 py-2 text-xs flex flex-col ${message.isUser ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white' : 'bg-white/10 text-white border border-white/20'}`}>
                        <RenderMessageWithLinks text={message.text} />
                        {!message.isUser && message.id !== '1' && (
                          <a href="https://wa.me/201027381559" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 text-xs bg-green-600/30 hover:bg-green-600/50 text-white font-semibold py-1.5 px-3 rounded-lg transition-all border border-green-500/50">
                            <MessageSquare className="w-3 h-3"/> تواصل واتساب مع البائع
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 opacity-80 px-1">
                        {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"><Bot className="h-3 w-3 text-white" /></div>
                    <div className="bg-white/10 rounded-2xl px-3 py-2 border border-white/20">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/20 bg-black/50">
              <div className="flex gap-2">
                <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} placeholder="اسأل عن أي عطر..." disabled={isLoading} className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border border-white/20 disabled:opacity-50" />
                <button onClick={handleSendMessage} disabled={!inputText.trim() || isLoading} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}