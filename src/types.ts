export type TimelineItemColor = 'blue' | 'red';

export interface Category {
  id: number;
  name: string;
  label: string;
  section: 'top' | 'bottom';
  display_order: number;
  color: TimelineItemColor;
}

export interface TimelineItem {
  id: number;
  category_id: number;
  category?: Category; // Populated when fetching with join
  title: string;
  description?: string;
  // Age-based entry (used when input_mode is 'age' or undefined)
  start_age?: number;
  end_age?: number;
  use_max_age?: boolean; // When true, end_age is dynamically set to the life map's age_range
  // Date-based entry (used when input_mode is 'date')
  input_mode?: 'age' | 'date'; // Default: 'age'
  start_date?: string; // ISO date string (YYYY-MM-DD)
  end_date?: string; // ISO date string (YYYY-MM-DD)
  color: TimelineItemColor;
}

export interface LifeMap {
  title: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  age_range?: number;
  zoom?: number; // Zoom level (default 1.0, stored as multiplier)
  categories: Category[];
  items: TimelineItem[];
}

