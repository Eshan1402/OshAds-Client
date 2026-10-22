import {
  Activity, Award, BadgeCheck, BarChart3, BatteryCharging, Bell, BookOpen, Box, Brain, Briefcase, Calculator, Calendar,
  Camera, Car, ChefHat, CheckSquare, Clapperboard, Clock, Cloud, CreditCard, Crown, Download, Eraser, Feather, FileText,
  Film, Gamepad2, Gauge, Ghost, Gift, Globe, GraduationCap, HeartPulse, Image, Keyboard, Languages, Layers, LayoutGrid,
  Leaf, LineChart, Link, ListChecks, ListOrdered, Lock, Luggage, Mail, Map, MapPin, MessageSquare, Mic, Moon, Music,
  NotebookPen, Palette, PenTool, PiggyBank, Plane, Puzzle, Receipt, Refrigerator, RefreshCw, Repeat, ScanLine, Search,
  Shirt, ShieldCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, Sofa, Sparkles, Store, Swords, Tag, Target, TextCursor,
  Ticket, Timer, TrendingUp, Trophy, Truck, Tv, Type, Users, Wallet, Wand, Watch, Waves, WifiOff, Wind, Wrench, Zap, Sigma,
  type LucideIcon, type LucideProps,
} from 'lucide-react'

/** String → icon map so data (and a future CMS/API) can reference icons by name. */
export const iconRegistry: Record<string, LucideIcon> = {
  activity: Activity, award: Award, 'badge-check': BadgeCheck, 'bar-chart': BarChart3, 'battery-charging': BatteryCharging,
  bell: Bell, 'book-open': BookOpen, box: Box, brain: Brain, briefcase: Briefcase, calculator: Calculator, calendar: Calendar,
  camera: Camera, car: Car, 'chef-hat': ChefHat, 'check-square': CheckSquare, clapperboard: Clapperboard, clock: Clock,
  cloud: Cloud, 'credit-card': CreditCard, crown: Crown, download: Download, eraser: Eraser, feather: Feather,
  'file-text': FileText, film: Film, gamepad: Gamepad2, gauge: Gauge, ghost: Ghost, gift: Gift, globe: Globe,
  'graduation-cap': GraduationCap, 'heart-pulse': HeartPulse, image: Image, keyboard: Keyboard, languages: Languages,
  layers: Layers, 'layout-grid': LayoutGrid, leaf: Leaf, 'line-chart': LineChart, link: Link, 'list-checks': ListChecks,
  'list-ordered': ListOrdered, lock: Lock, luggage: Luggage, mail: Mail, map: Map, 'map-pin': MapPin,
  'message-square': MessageSquare, mic: Mic, moon: Moon, music: Music, 'notebook-pen': NotebookPen, palette: Palette,
  'pen-tool': PenTool, 'piggy-bank': PiggyBank, plane: Plane, puzzle: Puzzle, receipt: Receipt, refrigerator: Refrigerator,
  'refresh-cw': RefreshCw, repeat: Repeat, 'scan-line': ScanLine, search: Search, shirt: Shirt, 'shield-check': ShieldCheck,
  'shopping-bag': ShoppingBag, 'shopping-cart': ShoppingCart, 'sliders-horizontal': SlidersHorizontal, sofa: Sofa,
  sparkles: Sparkles, store: Store, swords: Swords, tag: Tag, target: Target, 'text-cursor': TextCursor, ticket: Ticket,
  timer: Timer, 'trending-up': TrendingUp, trophy: Trophy, truck: Truck, tv: Tv, type: Type, users: Users, wallet: Wallet,
  wand: Wand, watch: Watch, waves: Waves, 'wifi-off': WifiOff, wind: Wind, wrench: Wrench, zap: Zap, sigma: Sigma,
}

export const iconNames = Object.keys(iconRegistry)

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = iconRegistry[name] ?? Sparkles
  return <Icon aria-hidden {...props} />
}
