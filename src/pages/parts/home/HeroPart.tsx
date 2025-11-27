export interface HeroPartProps {
  setIsSticky: (val: boolean) => void;
  searchParams: ReturnType<any>; // Changed to any as useSearchQuery is removed
  showTitle?: boolean;
  isInFeatured?: boolean;
}

export function HeroPart() {
  // HeroPart no longer needs search functionality - it's in Navigation now
  return null;
}
