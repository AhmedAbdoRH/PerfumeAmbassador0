import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase'; // تأكد من أن مسار supabase صحيح
import type { Service, Category, StoreSettings } from '../types/database'; // تأكد من أن مسار الأنواع صحيح

interface Message {أ
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

// =====================
// إعدادات Gemini API
// =====================
const GEMINI_API_KEY = "AIzaSyAeMLURr9rdBxyc3ny2fE5p3RebkJDUCds"; // المفتاح الذي أدخلته
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_MODEL = "gemini-2.5-flash";

const RenderMessageWithLinks = ({ text }: { text: string }) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkRegex);

    return (
        <div className="whitespace-pre-wrap font-medium">
            {parts.map((part, i) => {
                if (i % 3 === 1) {
                    const url = parts[i + 1];
                    return (
                        <React.Fragment key={i}>
                            <span>{part}</span>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 mb-2 flex items-center justify-center gap-2 text-center bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-semibold py-1.5 px-3 rounded-lg transition-all border border-emerald-500/50"
                            >
                                <ExternalLink className="w-3 h-3" />
                                عرض المنتج
                            </a>
                        </React.Fragment>
                    );
                }
                if (i % 3 === 2) {
                    return null;
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
};

export default function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'أهلاً بيك في سفير العطور 🌹\nازاي أقدر أساعدك؟',
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

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && storeData.products.length === 0) {
            fetchStoreData();
        }
    }, [isOpen]);

    const fetchStoreData = async () => {
        try {
            const { data: products, error: productsError } = await supabase.from('services').select('*, category:categories(*)').order('created_at', { ascending: false });
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
                const productUrl = `https://perfume-ambassador.com/product/${product.id}`;
                context += `\n--- ${product.title} ---\n`;
                context += `الوصف: ${product.description || 'لا يوجد وصف متاح'}\n`;
                if (product.price) context += `السعر: ${product.price} ج.م\n`;
                if (product.sale_price) context += `السعر بعد الخصم: ${product.sale_price} ج.م\n`;
                if (product.category?.name) context += `الفئة: ${product.category.name}\n`;
                // إضافة الرابط في البيانات التي سيراها النموذج ليستخدمها
                context += `الرابط للاستخدام في الرد: ${productUrl}\n`;
            });
            context += '\n';
        }

        context += `تعليمات الرد:
1.  كن ودود وتحدث باللهجة المصرية العامية.
2.  اجعل ردودك مختصرة ومباشرة قدر الإمكان.
3.  عند اقتراح أي منتج، يجب أن تذكر نبذة قصيرة عنه ثم تضع رابطه مباشرةً باستخدام تنسيق الماركدون هكذا: [النبذة المختصرة عن المنتج واسمه](رابط المنتج الذي تم تزويدك به).
4.  مهم جداً: لا تعرض المنتجات في جداول أبداً. كل منتج يجب أن يكون في فقرة خاصة به مع زر "عرض المنتج" تحته.
5.  شجع العميل على طرح المزيد من الأسئلة بقول "لو حابب تفاصيل أكتر، أنا موجود يا فندم." في نهاية الرد.
6.  إذا لم تجد المنتج المطلوب، اقترح أقرب منتج مشابه له.
7.  لا تذكر أي معلومات تواصل مثل رقم الواتساب
8.  لا تنادي العميل بكلمة "يا باشا" بل "يا فندم" (ومش لازم دايمًا تناديه بيها).
9.  استخدم إيموجيز بسيطة وملائمة في الردود لإضافة لمسة ودية، 
10. قبل اسم المنتج ضيف ▫️
.`;

        return context;
    };

    // ========================================================================
    // تعديل: تم تحديث الدالة بالكامل للتعامل مع Gemini API
    // ========================================================================
    const sendToAI = async (userMessage: string): Promise<string> => {
        const systemPrompt = generateStoreContext();

        // Gemini يتطلب تنسيقًا مختلفًا للرسائل
        const geminiMessages = [
            // تعليمات النظام
            {
                "role": "user",
                "parts": [{ "text": systemPrompt }]
            },
            {
                "role": "model",
                "parts": [{ "text": "تمام، أنا جاهز لمساعدة العملاء." }] // تمهيد للمحادثة
            },
            // الرسالة الفعلية من المستخدم
            {
                "role": "user",
                "parts": [{ "text": userMessage }]
            }
        ];

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: geminiMessages,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`فشل في الاتصال بالخدمة: ${errorData.error.message}`);
            }

            const data = await response.json();
            // استخلاص النص من استجابة Gemini
            const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            return textResponse?.trim() || 'عذراً، لم أتمكن من فهم سؤالك.';

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return '⚠️ حدث خطأ تقني.';
        }
    };


    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const lastMessageIsFromUser = messages[messages.length - 1]?.isUser;
        const lastElement = container.lastElementChild;

        if (lastMessageIsFromUser || isLoading) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        } else if (lastElement && lastElement instanceof HTMLElement) {
            lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, isLoading]);

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
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 z-50 group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <MessageCircle className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="fixed bottom-24 left-6 w-80 h-96 bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 flex flex-col overflow-hidden"
                    >
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
                        
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex items-start gap-2 max-w-[95%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${message.isUser ? 'bg-gradient-to-r from-green-600 to-emerald-700' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
                                            {message.isUser ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className={`flex flex-col gap-1 ${message.isUser ? 'items-end' : 'items-start'}`}>
                                            <div className={`rounded-2xl px-3 py-2 text-[13.5px] flex flex-col ${message.isUser ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white' : 'bg-white/10 text-white border border-white/20'}`}>
                                                <RenderMessageWithLinks text={message.text} />
                                                {!message.isUser && message.id !== '1' && (
                                                    <a href="https://wa.me/201027381559" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-2 text-xs bg-green-600/30 hover:bg-green-600/50 text-white font-semibold py-1.5 px-3 rounded-lg transition-all border border-green-500/50">
                                                        <MessageSquare className="w-3 h-3" /> تواصل واتساب مع البائع
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
                        </div>

                        <div className="p-4 border-t border-white/20 bg-black/50">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="اسأل عن أي عطر..."
                                    disabled={isLoading}
                                    className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border border-white/20 disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isLoading}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all flex items-center justify-center"
                                >
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
