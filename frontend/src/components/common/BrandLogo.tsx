const LOGO_SRC = "/images/lamb.webp";

interface BrandLogoProps {
  /** Tailwind size classes, e.g. "size-7", "h-8" */
  className?: string;
  alt?: string;
}

/**
 * Reusable app logo (<img>) for avatars and sidebar icons.
 * No skeleton wrapper — the image is tiny and static.
 */
export function BrandLogo({ className, alt = "" }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      referrerPolicy="no-referrer"
      className={`rounded-full object-contain ${className ?? ""}`}
    />
  );
}
