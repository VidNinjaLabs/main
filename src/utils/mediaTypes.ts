export interface MediaItem {
  id: string;
  title: string;
  year?: number;
  release_date?: Date;
  poster?: string;
  backdrop?: string;
  logoUrl?: string; // Content logo URL
  badge?: string; // Trending/Featured badge text
  type: "show" | "movie";
  onHoverInfoEnter?: () => void;
  onHoverInfoLeave?: () => void;
}
