import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const OptimizedImage = ({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: Props) => {
  const [isInView, setIsInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const generateSrcSet = (baseUrl: string) => {
    const widths = [320, 640, 768, 1024, 1440, 1920];
    return widths.map((w) => `${baseUrl}?w=${w}&fm=webp ${w}w`).join(", ");
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isInView && <div className="absolute inset-0 bg-muted animate-pulse" />}
      {isInView && (
        <picture>
          <source type="image/webp" srcSet={generateSrcSet(src)} sizes={sizes} />
          <source type="image/jpeg" srcSet={generateSrcSet(src).replace(/webp/g, "jpg")} sizes={sizes} />
          <img
            src={`${src}?w=1024&fm=webp`}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : "auto"}
            onLoad={() => setLoaded(true)}
            className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;
