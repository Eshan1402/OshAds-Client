import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RouteError } from './RouteError'
import { ProtectedRoute } from './ProtectedRoute'

// Public
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ExplorePage = lazy(() => import('@/pages/public/ExplorePage'))
const TrendingPage = lazy(() => import('@/pages/public/TrendingPage'))
const CategoriesPage = lazy(() => import('@/pages/public/CategoriesPage'))
const AppDetailPage = lazy(() => import('@/pages/public/AppDetailPage'))
const SearchPage = lazy(() => import('@/pages/public/SearchPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const BlogPage = lazy(() => import('@/pages/public/BlogPage'))
const BlogPostPage = lazy(() => import('@/pages/public/BlogPostPage'))
const RewardsPage = lazy(() => import('@/pages/public/RewardsPage'))
const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'))

// Dashboard
const OverviewPage = lazy(() => import('@/pages/dashboard/OverviewPage'))
const CampaignsPage = lazy(() => import('@/pages/dashboard/CampaignsPage'))
const CampaignWizardPage = lazy(() => import('@/pages/dashboard/CampaignWizardPage'))
const CampaignDetailPage = lazy(() => import('@/pages/dashboard/CampaignDetailPage'))
const AppsPage = lazy(() => import('@/pages/dashboard/AppsPage'))
const AppFormPage = lazy(() => import('@/pages/dashboard/AppFormPage'))
const AppManagePage = lazy(() => import('@/pages/dashboard/AppManagePage'))
const ClientsPage = lazy(() => import('@/pages/dashboard/ClientsPage'))
const ClientFormPage = lazy(() => import('@/pages/dashboard/ClientFormPage'))
const ClientDetailPage = lazy(() => import('@/pages/dashboard/ClientDetailPage'))
const AnalyticsPage = lazy(() => import('@/pages/dashboard/AnalyticsPage'))
const TrafficPage = lazy(() => import('@/pages/dashboard/TrafficPage'))
const ReportsPage = lazy(() => import('@/pages/dashboard/ReportsPage'))
const NotificationsPage = lazy(() => import('@/pages/dashboard/NotificationsPage'))
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'))
const RewardsReviewPage = lazy(() => import('@/pages/dashboard/RewardsReviewPage'))

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/trending', element: <TrendingPage /> },
      { path: '/categories', element: <CategoriesPage /> },
      { path: '/categories/:slug', element: <CategoriesPage /> },
      { path: '/app/:slug', element: <AppDetailPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/rewards', element: <RewardsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'campaigns/new', element: <ProtectedRoute permission="campaigns:write"><CampaignWizardPage /></ProtectedRoute> },
      { path: 'campaigns/:id', element: <CampaignDetailPage /> },
      { path: 'apps', element: <AppsPage /> },
      { path: 'apps/new', element: <ProtectedRoute permission="apps:write"><AppFormPage /></ProtectedRoute> },
      { path: 'apps/:id', element: <AppManagePage /> },
      { path: 'apps/:id/edit', element: <ProtectedRoute permission="apps:write"><AppFormPage /></ProtectedRoute> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/new', element: <ProtectedRoute permission="clients:write"><ClientFormPage /></ProtectedRoute> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'clients/:id/edit', element: <ProtectedRoute permission="clients:write"><ClientFormPage /></ProtectedRoute> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'traffic', element: <TrafficPage /> },
      { path: 'reports', element: <ProtectedRoute permission="reports:export"><ReportsPage /></ProtectedRoute> },
      { path: 'rewards', element: <RewardsReviewPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage title="Page not found" message="This dashboard page doesn’t exist." /> },
    ],
  },
])
