import type { Category } from '@/types'

export const categories: Category[] = [
  { slug: 'loans', name: 'Small Loans', description: 'Short-term and personal loan apps. Compare terms before you borrow.', icon: 'wallet', colors: ['#10B981', '#047857'] },
  { slug: 'betting', name: 'Betting & Casino', description: 'Sportsbooks and casinos. 18+ only — gambling can be addictive.', icon: 'trophy', colors: ['#F59E0B', '#B45309'] },
  { slug: 'trading', name: 'Trading', description: 'Forex, CFD and multi-asset trading platforms. Trading carries a risk of loss.', icon: 'line-chart', colors: ['#3B82F6', '#1D4ED8'] },
  { slug: 'crypto', name: 'Crypto', description: 'Buy, sell and hold cryptocurrency.', icon: 'layers', colors: ['#8B5CF6', '#5B21B6'] },
  { slug: 'banking', name: 'Banking', description: 'Digital and mobile banking.', icon: 'credit-card', colors: ['#0EA5E9', '#1E40AF'] },
  { slug: 'insurance', name: 'Insurance', description: 'Compare and buy insurance plans.', icon: 'shield-check', colors: ['#22C55E', '#15803D'] },
  { slug: 'shopping', name: 'Shopping', description: 'Online stores and marketplaces.', icon: 'shopping-bag', colors: ['#F472B6', '#DB2777'] },
  { slug: 'food', name: 'Food', description: 'Groceries and food delivery.', icon: 'chef-hat', colors: ['#FB923C', '#C2410C'] },
  { slug: 'entertainment', name: 'Entertainment', description: 'Streaming, news, music and games.', icon: 'clapperboard', colors: ['#EF4444', '#991B1B'] },
  { slug: 'social', name: 'Social', description: 'Meet people, chat and hang out.', icon: 'message-square', colors: ['#A78BFA', '#6D28D9'] },
  { slug: 'lifestyle', name: 'Lifestyle', description: 'Greetings, gifts and everyday extras.', icon: 'gift', colors: ['#F97316', '#9A3412'] },
  { slug: 'mobility', name: 'Mobility', description: 'Rides, delivery and getting around.', icon: 'car', colors: ['#14B8A6', '#0F766E'] },
]

export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c])) as Record<
  Category['slug'],
  Category
>
