export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const GRAPHQL_URI = process.env.EXPO_PUBLIC_GRAPHQL_URI ?? 'http://localhost:4000/graphql'

export const STORAGE_KEY_TOKEN = 'auth_token'
export const STORAGE_KEY_USER_ID = 'user_id'

export const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  secondary: '#EC4899',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const
