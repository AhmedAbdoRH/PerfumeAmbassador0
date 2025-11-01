import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, StoreSettings, Service } from '../types/database';

interface HeaderProps {
  storeSettings?: StoreSettings | null;
}

export default function Header({ storeSettings }: HeaderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Toggle mobile search and focus the input when opened
  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    if (!isMobileSearchOpen && searchInputRef.current) {
      // Small delay to ensure the input is visible before focusing
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data || []);
  };

  const handleCategoryClick = (categoryId: string) => {
    setIsDropdownOpen(false);
    navigate(`/category/${categoryId}`);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search in both name and description using ilike for case-insensitive partial matching
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:categories(*),
          product_images(image_url)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (servicesError) throw servicesError;
      
      if (!services) {
        setSearchResults([]);
        return;
      }
      
      // Transform the data to handle images properly
      const formattedServices = services.map(service => ({
        ...service,
        // Use the first product image if available, otherwise fallback to the main image_url
        displayImage: service.product_images?.[0]?.image_url || service.image_url || '/placeholder-product.jpg'
      }));
      
      setSearchResults(formattedServices);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      // Skip if it's a touch event on mobile
      if ('touches' in event) {
        const target = event.target as HTMLElement;
        // Only handle touch events for the search input
        if (searchInputRef.current && searchInputRef.current.contains(target)) {
          return;
        }
      } else {
        const target = event.target as HTMLElement;
        
        // Close desktop search dropdown
        if (searchRef.current && !searchRef.current.contains(target)) {
          setIsSearchFocused(false);
        }
        
        // Close mobile search when clicking outside
        if (isMobileSearchOpen && !target.closest('.mobile-search-container')) {
          const isSearchIcon = target.closest('button[aria-label="بحث"]');
          const isSearchInput = target.closest('input[type="text"]');
          
          if (!isSearchIcon && !isSearchInput) {
            setIsMobileSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }
        }
      }
    }

    // Add both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      // Small timeout to ensure the input is visible before focusing
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // For mobile devices, we need to explicitly open the keyboard
          if ('virtualKeyboard' in navigator) {
            // @ts-ignore - VirtualKeyboard API is experimental
            navigator.virtualKeyboard.show();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobileSearchOpen]);

  return (
    <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/">
            <img 
              src={storeSettings?.logo_url || '/logo.png'}
              alt={storeSettings?.store_name || 'الشعار'} 
              className="h-20 w-auto"
            />
          </Link>
        </div>
        
        {/* Desktop Search Bar - Hidden on mobile */}
        <div className="hidden md:block relative flex-1 max-w-xl mx-8" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
              placeholder="ابحث عن منتج..."
              className="w-full bg-white/10 text-white placeholder-white/50 rounded-full py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {isSearchFocused && (searchResults.length > 0 || (searchQuery.length >= 2 && searchResults.length === 0)) && (
            <div className="absolute mt-2 w-full bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
              {searchResults.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex items-center p-3 hover:bg-white/10 transition-colors duration-200 border-b border-white/5 last:border-0"
                  onClick={clearSearch}
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-white/5 flex items-center justify-center">
                    <img 
                      src={product.displayImage} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                  <div className="flex-1 text-right pr-2">
                    <h4 className="text-white font-medium">{product.title}</h4>
                    <p className="text-xs text-white/60">
                      {product.category?.name || ''}
                    </p>
                  </div>
                </Link>
              ))}
              
              {searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-center text-white/70">
                  لا توجد نتائج لـ "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Mobile Search Toggle Button */}
          <button 
            onClick={() => {
              const wasOpen = isMobileSearchOpen;
              setIsMobileSearchOpen(!wasOpen);
              // If we're opening the search, focus will be handled by the effect
              // If we're closing it, blur any active element
              if (wasOpen && document.activeElement) {
                (document.activeElement as HTMLElement).blur();
              }
            }}
            className="md:hidden p-2 text-white hover:text-[#FFD700] transition-colors"
            aria-label="بحث"
          >
            <Search className="h-6 w-6" />
          </button>
          
          <nav>
            <ul className="flex gap-4 md:gap-6 items-center">
              <li className="hidden md:block">
                <Link to="/" className="text-white hover:text-[#FFD700] transition-colors duration-300">
                  الرئيسية
                </Link>
              </li>
              <li className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 text-white hover:text-[#FFD700] transition-colors duration-300"
                >
                  الأقسام
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 z-50">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="block w-full text-right px-4 py-2 text-white hover:bg-white/10 transition-colors duration-300"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </li>
              <li>
                <a href="#contact" className="text-white hover:text-[#FFD700] transition-colors duration-300">
                  تواصل معنا
                </a>
              </li>
              </ul>
            </nav>
          </div>
          
          {/* Mobile Search Bar - Only shown when toggled */}
          {isMobileSearchOpen && (
            <div className="fixed top-20 left-0 right-0 bg-black/90 backdrop-blur-md p-4 z-40 border-b border-white/10 md:hidden">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-full py-3 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {/* Mobile Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 bg-black/90 rounded-lg shadow-xl border border-white/10 overflow-hidden z-50 max-h-80 overflow-y-auto">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex items-center p-3 hover:bg-white/10 transition-colors duration-200 border-b border-white/5 last:border-0"
                        onClick={() => {
                          clearSearch();
                          setIsMobileSearchOpen(false);
                        }}
                      >
                        <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-white/5 flex items-center justify-center">
                          <img 
                            src={product.displayImage} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="flex-1 text-right pr-2">
                          <h4 className="text-white font-medium text-sm">{product.title}</h4>
                          {product.category?.name && (
                            <p className="text-xs text-white/60">{product.category.name}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </header>
  );
}
