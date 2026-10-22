import type { AppNotification, SavedReport } from '@/types'

// Notifications are created by the system as real events happen.
export const notifications: AppNotification[] = []

// Saved reports start empty; staff save their own from Dashboard → Reports.
export const savedReports: SavedReport[] = []
