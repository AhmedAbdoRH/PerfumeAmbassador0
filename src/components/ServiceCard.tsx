import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles } from 'lucide-react';

interface ProductCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  salePrice?: string | null;
  id: string | number;
}

// Define the light gold color using the hex code from the Hero component
const lightGold = '#FFD700'; // This is standard gold color

export default function ProductCard({ title, description, imageUrl, price, salePrice, id }: ProductCardProps) {
  /**
   * Handles the click event for the "Contact Now" button.
   * Prevents the default link behavior and opens a WhatsApp chat
   * with a pre-filled message including product details.
   * @param e - The mouse event.
   */
  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the default link behavior
    // Construct the URL for the specific product page
    const productUrl = `${window.location.origin}/product/${id}`;;
    // Create the pre-filled message for WhatsApp
    const message = `استفسار عن المنتج: ${title}
رابط المنتج: ${productUrl}`;
    // Open the WhatsApp chat link in a new tab
    window.open(`https://wa.me/201027381559?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    // Main container for the product card.
    // Uses secondary color with transparency for background and border.
    // Applies backdrop blur for a glassmorphism effect.
    // Includes transition for hover effects (scale and background change).
    <div className="group relative bg-secondary/5 backdrop-blur-md rounded-xl border border-secondary/20 overflow-hidden transition-all duration-150 hover:scale-105 hover:bg-secondary/10">
      {/* Link wraps the card content, navigating to the product details page */}
      <Link to={`/product/${id}`}>
        <div className="relative aspect-[4/3] w-full">
          {/* Product image */}
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay gradient for hover effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </div>
        {/* Card content area */}
        <div className="p-6">
          {/* Product title with Sparkles icon */}
          {/* Sparkles icon color is set using the light gold hex code */}
          <h3 className="text-xl font-bold mb-2 text-secondary flex items-center gap-2">
            {title}
            {/* Apply light gold text color using arbitrary value syntax */}
            <Sparkles className={`h-4 w-4 text-[${lightGold}]`} />
          </h3>
          {/* Product description - show only the first line */}
          {/* Text color is secondary with 70% opacity */}
          <p className="text-secondary/70 mb-4">
            {description.split(/\r?\n/)[0]}
          </p>
          {/* Price and Contact button container */}
          <div className="flex justify-between items-center">
            {/* Product price with sale price support */}
            <div className="flex flex-col items-end">
              {salePrice ? (
                <>
                  <span className={`font-bold text-lg text-[${lightGold}]`}>{salePrice} ج</span>
                  <span className="text-sm text-gray-400 line-through">{price} ج</span>
                </>
              ) : (
                <span className={`font-bold text-lg text-[${lightGold}]`}>{price} ج</span>
              )}
            </div>
            {/* "Contact Now" button */}
            {/* Background color is light gold with 80% opacity using arbitrary value */}
            {/* On hover, background changes to a slightly darker gold (yellow-500), matching Hero component */}
            {/* Text color is secondary */}
            {/* Includes MessageCircle icon and text */}
            <button
              onClick={handleContactClick}
              // Apply light gold background with opacity using arbitrary value
              // Use yellow-500 for hover, matching the Hero component's button hover
              className={`bg-[${lightGold}]/100 hover:bg-yellow-500
                          text-secondary
                          px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 backdrop-blur-sm`}
            >
              <MessageCircle className="h-5 w-5" /> {/* Message icon */}
              اطلب الآن {/* Button text */}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}