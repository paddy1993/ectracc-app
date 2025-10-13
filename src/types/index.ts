// User types for Phase 2 Authentication
export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export interface UserProfile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  sustainability_goal?: string;
  created_at: string;
  updated_at: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  isOnline: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation item type
export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType;
}

// PWA install prompt
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Authentication types
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ user: User | null; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signInWithGoogle: () => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileSetupForm {
  display_name: string;
  country: string;
  sustainability_goal: string;
}

// Product types for Phase 3
export interface Product {
  id: string;
  _id?: string; // Keep for backward compatibility
  code: string;
  product_name: string;
  brands: string[];
  categories: string[];
  categories_hierarchy?: string[];
  ecoscore_grade?: string;
  environmental_score_grade?: string;
  nutriscore_grade?: string;
  nutrition_info?: NutritionInfo;
  ingredients_text?: string;
  ingredients_count?: number;
  labels?: string;
  carbon_footprint?: number;
  carbon_footprint_details?: {
    total: number;
    agriculture?: number;
    processing?: number;
    transportation?: number;
    packaging?: number;
    distribution?: number;
  };
  product_type?: string;
  source_database?: string;
  last_updated: string;
  image_url?: string;
  packaging?: string;
  countries?: string[];
  manufacturing_places?: string;
  score?: number; // text search relevance score
}

export interface NutritionInfo {
  energy_100g?: number;
  fat_100g?: number;
  saturated_fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

export interface ProductSearchParams {
  q?: string;
  category?: string | string[];
  brand?: string | string[];
  minCarbon?: number;
  maxCarbon?: number;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'carbon_asc' | 'carbon_desc' | 'name_asc';
}

export interface ProductSearchResult {
  data: Product[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
      totalPages: number;
    };
    query: ProductSearchParams;
  };
}

export interface ProductStats {
  totalProducts: number;
  ecoScoreDistribution: { _id: string; count: number }[];
  topCategories: { _id: string; count: number }[];
  carbonFootprintStats: {
    avg: number;
    min: number;
    max: number;
    count: number;
  };
}

// Carbon footprint tracking types for Phase 4
export interface FootprintEntry {
  id: string;
  user_id: string;
  product_barcode?: string;
  manual_item?: string;
  amount: number;
  carbon_total: number;
  category: 'food' | 'transport' | 'energy' | 'shopping' | 'misc';
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrackFootprintForm {
  product_barcode?: string;
  manual_item?: string;
  amount: number | string;
  carbon_total: number | string;
  category: 'food' | 'transport' | 'energy' | 'shopping' | 'misc';
  unit?: string;
  brand?: string;
  logged_at?: string;
}

export interface FootprintHistory {
  period: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  aggregated: AggregatedFootprint[];
  raw_data: FootprintEntry[];
}

export interface AggregatedFootprint {
  period: string;
  total_carbon: number;
  count: number;
  categories: Record<string, number>;
}

export interface CategoryBreakdown {
  period: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  categories: CategoryData[];
  total_carbon: number;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

export interface Goal {
  id: string;
  user_id: string;
  target_value: number;
  timeframe: 'weekly' | 'monthly';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalForm {
  target_value: number;
  timeframe: 'weekly' | 'monthly';
  description?: string;
}

export interface DashboardStats {
  currentTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  recentEntries: FootprintEntry[];
  weeklyGoal?: Goal;
  monthlyGoal?: Goal;
}
