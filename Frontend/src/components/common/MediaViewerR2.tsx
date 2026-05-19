import React, { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface MediaViewerR2Props {
  url: string;
  alt?: string;
  className?: string; // Para clases de Tailwind pasadas por el padre
  objectFit?: 'cover' | 'contain';
}

const MediaViewerR2: React.FC<MediaViewerR2Props> = ({ 
  url, 
  alt = 'Media', 
  className = '',
  objectFit = 'cover'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!url) return <Placeholder error={false} className={className} />;
  
  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('/videos/');

  const handleMediaLoad = () => setIsLoading(false);
  const handleMediaError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div className={`relative h-full w-full max-w-full overflow-hidden ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 flex-col">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}
      
      {hasError ? (
        <Placeholder error={true} className="w-full h-full" />
      ) : isVideo ? (
        <video 
          src={url} 
          className={`block h-full w-full max-w-full ${fitClass}`} 
          autoPlay 
          loop 
          muted 
          playsInline
          onLoadedData={handleMediaLoad}
          onError={handleMediaError}
        />
      ) : (
        <img 
          src={url} 
          alt={alt} 
          className={`block h-full w-full max-w-full ${fitClass} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity'}`}
          onLoad={handleMediaLoad}
          onError={handleMediaError}
          loading="lazy"
        />
      )}
    </div>
  );
};

const Placeholder = ({ error, className }: { error: boolean; className: string }) => (
  <div className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 w-full h-full ${className}`}>
    <ImageOff className="w-8 h-8 opacity-40 mb-2" />
    <span className="text-xs font-medium">{error ? 'Error al cargar' : 'Sin imagen'}</span>
  </div>
);

export default MediaViewerR2;
