import { lazy, Suspense, useEffect } from 'react';
import { applyStoredUserSettings } from './components/applyUserSettings.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "./components/ui/Toaster";
import { GlassFilter } from "./components/ui/GlassLayer";
import { Toaster as Sonner } from "./components/ui/Sonner";
import { TooltipProvider } from "./components/ui/Tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider, useLanguage } from "./components/LanguageContext.jsx";
import { FavoritesProvider } from './components/FavoritesSystem';
import { AuthProvider } from './contexts/authContext';
import { ShopifyCartProvider } from './contexts/Shopifycartcontext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const Index = lazy(() => import('./components/pages/Index'));
const NotFound = lazy(() => import("./components/pages/NotFound"));
const ArtistPage = lazy(() => import('./components/ArtistPage'));
const AlbumPage = lazy(() => import('./components/AlbumPage'));
const FavoritesPage = lazy(() => import('./components/FavoritesPage'));
const AccessoriesPage = lazy(() => import('./components/pages/AccessoriesPage'));
const Collections = lazy(() => import('./components/Collections').then(m => ({ default: m.Collections })));
const MerchCollectionsPage = lazy(() => import('./components/MerchCollectionsPage').then(m => ({ default: m.MerchCollectionsPage })));
const MerchPage = lazy(() => import('./components/MerchPage').then(m => ({ default: m.MerchPage })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./components/SignUp').then(m => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('./components/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const SearchPage = lazy(() => import('./components/SearchPage').then(m => ({ default: m.SearchPage })));
const CartPage = lazy(() => import('./components/CartPage'));
const AccountPage = lazy(() => import('./components/AccountPage'));
const InfoPage = lazy(() => import('./components/pages/InfoPage'));

const queryClient = new QueryClient();

const PageLoader = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background px-6 pt-24" aria-label={t.loading} role="status">
      <div className="container mx-auto max-w-4xl space-y-6 animate-pulse">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-10 w-2/3 rounded-lg bg-muted" />
        <div className="h-64 rounded-2xl bg-muted" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted hidden md:block" />
          <div className="h-32 rounded-xl bg-muted hidden md:block" />
        </div>
      </div>
    </div>
  );
};

function App() {
  // Saved theme/display settings apply on every page load, not just pages
  // that render the navbar's Settings panel
  useEffect(() => {
    applyStoredUserSettings();
  }, []);

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <FavoritesProvider>
              <ShopifyCartProvider>
                <GlassFilter />
                <Toaster />
                <Sonner />
                <Router>
                  <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/" element={<Index />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/collections" element={<Collections />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                      <Route path="/artist/:artistName" element={<ArtistPage />} />
                      <Route path="/album/:albumId" element={<AlbumPage />} />
                      <Route path="/merch" element={<MerchCollectionsPage />} />
                      <Route path="/merch/:merchId" element={<MerchPage />} />
                      <Route path="/accessories" element={<AccessoriesPage />} />
                      <Route path="/accessories/:accessoriesId" element={<AccessoriesPage />} />
                      <Route path="/info/:topic" element={<InfoPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  </ErrorBoundary>
                </Router>
              </ShopifyCartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
