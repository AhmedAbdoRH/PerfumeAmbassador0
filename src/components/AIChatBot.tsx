import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// =====================
// إعدادات Groq API
// =====================
const GROQ_API_KEY = "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"; // ⚠️ يفضّل عدم وضع المفتاح في الواجهة في الإنتاج
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

// معلومات المتجر للتغذية
const STORE_CONTEXT = `
أنت مساعد ذكي لمتجر "سفير العطور" - متجر عطور فاخر يقدم أفضل أنواع العطور الغربيه الشرقيه وعطور النيش. 

معلومات المتجر:
- اسم المتجر: سفير العطور
- التخصص: عطور غربيه وشرقية وعطور 
- نقدم عطور محاكاه لعطور الاورجنال بأسعار تنافسية
- لدينا تشكيلة واسعة من العطور الرجالية والنسائية وعطور الأطفال 
- نوفر خدمة التوصيل لحد باب البيت 
- يمكن للعملاء طلب المنتجات عبر الواتساب

تعليمات الرد:
- كن مهذباً ومفيداً 
- اتكلم بالمصري والرد بكلمة يا فندم
- إذا سُئلت عن الأسعار، اذكر أن الأسعار تنافسية
- كن إيجابياً وودوداً في ردودك
- إذا لم تعرف إجابة محددة، وجه العميل للتواصل المباشر مع البائع 

المنتجات التوفرة:

العطور الرجالي
سوفاج
فوياج
شامبيون دافيدوف
بوص ذا سنت
سلفر سنت
اديدس بلو
`;

// استخراج رقم الواتساب من السياق
const WHATSAPP_NUMBER = STORE_CONTEXT.match(/رقم الواتساب: (\d+)/)?.[1];
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;


export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'مرحباً بك في سفير العطور! 🌹 كيف يمكنني مساعدتك اليوم؟',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendToAI = async (message: string): Promise<string> => {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: STORE_CONTEXT },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error:', errorText);
        throw new Error('فشل في الاتصال بالخدمة');
      }

      const data: any = await response.json();
      const botText = data?.choices?.[0]?.message?.content?.trim();
      return botText || 'عذراً، لم أتمكن من فهم سؤالك. يرجى المحاولة مرة أخرى.';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      return `⚠️ حدث خطأ تقني. يمكنك التواصل معنا مباشرة عبر الواتساب: ${WHATSAPP_NUMBER}`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await sendToAI(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '⚠️ عذراً، حدث خطأ. يرجى المحاولة مرة أخرى أو التواصل عبر الواتساب.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* زر فتح الشات */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 p-4 rounded-full shadow-lg transition-all
                   text-white bg-gradient-to-r from-green-500 to-emerald-600
                   hover:from-green-600 hover:to-emerald-700
                   z-50 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
      </motion.button>

      {/* نافذة الشات */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 left-6 w-80 h-96 bg-black/90 backdrop-blur-xl 
                       rounded-2xl shadow-2xl border border-white/20 z-50 flex flex-col
                       overflow-hidden"
          >
            {/* رأس النافذة */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-green-600/20 to-emerald-600/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">مساعد سفير العطور</h3>
                  <p className="text-green-400 text-xs">متصل الآن</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* منطقة الرسائل */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isUser 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500' // تركنا لون المستخدم أزرق للتمييز
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}>
                      {message.isUser ? <User className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-white" />}
                    </div>
                    <div className={`rounded-2xl px-3 py-2 text-sm flex flex-col ${
                      message.isUser
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' // تركنا لون المستخدم أزرق للتمييز
                        : 'bg-white/10 text-white border border-white/20'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <p className={`text-xs mt-1 opacity-70 ${message.isUser ? 'text-white' : 'text-gray-300'}`}>
                        {message.timestamp.toLocaleTimeString('ar-EG', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>

                      {!message.isUser && message.id !== '1' && (
                        <a
                          href={WHATSAPP_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-2 text-xs 
                                     bg-green-600/30 hover:bg-green-600/50 
                                     text-white font-semibold py-1.5 px-3 
                                     rounded-lg transition-all border border-green-500/50"
                        >
                          <MessageSquare className="w-3 h-3"/>
                          تواصل واتساب مع البائع
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* مؤشر الكتابة */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
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

            {/* منطقة الإدخال */}
            <div className="p-4 border-t border-white/20 bg-black/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك هنا..."
                  disabled={isLoading}
                  className="flex-1 bg-white/10 text-white placeholder-white/50 rounded-full 
                           px-4 py-2 text-sm focus:outline-none focus:ring-2 
                           focus:ring-green-500 border border-white/20
                           disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 
                           hover:from-green-600 hover:to-emerald-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           text-white p-2 rounded-full transition-all
                           flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* خلفية شفافة عند فتح الشات على الموبايل */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}