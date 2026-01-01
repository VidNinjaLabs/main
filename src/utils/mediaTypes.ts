export interface MediaItem {
  id: string;
  title: string;
  year?: number;
  release_date?: Date;
  poster?: string;
  backdrop?: string;
  type: "show" | "movie";
  onHoverInfoEnter?: () => void;
  onHoverInfoLeave?: () => void;
}
