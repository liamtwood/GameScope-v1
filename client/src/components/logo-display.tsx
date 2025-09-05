import { useState } from "react";
import { cn } from "@/lib/utils";

interface LogoDisplayProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  noBorder?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm', 
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg'
};

export function LogoDisplay({ 
  src, 
  alt, 
  fallbackText, 
  size = 'md', 
  className,
  noBorder = false
}: LogoDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Generate fallback text from alt if not provided
  const fallback = fallbackText || alt
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold",
        !noBorder && "border border-gray-200",
        sizeClasses[size],
        className
      )}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {imageLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 font-semibold",
          !noBorder && "border border-gray-200",
          sizeClasses[size]
        )}>
          {fallback}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          "w-full h-full object-contain rounded-lg bg-white",
          !noBorder && "border border-gray-200",
          imageLoading ? "opacity-0" : "opacity-100",
          "transition-opacity duration-200"
        )}
      />
    </div>
  );
}