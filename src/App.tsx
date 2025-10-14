import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { useBackHandler } from "@/hooks/use-back-handler";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { AppLayout } from "@/components/layout/app-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { ProfileViewLayout } from "@/components/layout/profile-view-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import ResetPassword from "./pages/ResetPassword";
import ProfileView from "./pages/ProfileView";
import FindGift from "./pages/FindGift";
import AuthCallback from "./pages/AuthCallback";
import { ContactsAuditScreen } from "./components/debug/contacts-audit-screen";
import Carte from "./pages/Carte";
import OffrirType from "./pages/OffrirType";
import DiagAdmin from "./pages/DiagAdmin";
import Diagnostic from "./pages/Diagnostic";
import { LegacyProfileRedirect } from "./components/screens/legacy-profile-redirect";
import GlobalOfferKillSwitch from "@/components/GlobalOfferKillSwitch";
import GlobalOfferClick from "@/components/GlobalOfferClick";
import GlobalOfferCapture from "@/components/GlobalOfferCapture";
import { DebugGrid } from "@/components/debug/DebugGrid";
import ScrollToTop from "@/components/ui/ScrollToTop";
import NotFound from "./pages/NotFound";
import { AdminModeIndicator } from "@/components/admin/AdminModeIndicator";
import { BulkRegenBar } from "@/components/admin/BulkRegenBar";
import { PushNotificationPrompt } from "@/components/push/push-notification-prompt";
import { initPushNotifications } from "@/lib/push-notifications";
import { useAuth } from "@/hooks/use-auth";

function BackHandlerWrapper({ children }: { children: React.ReactNode }) {
  useBackHandler();
  useScrollToTop();
  const { user } = useAuth();

  // Initialiser les push notifications quand l'utilisateur est connecté
  useEffect(() => {
    if (user?.id) {
      initPushNotifications(user.id);
    }
  }, [user?.id]);

  return <>{children}</>;
}


const queryClient = new QueryClient();

// Lazy load pages
const Splash = lazy(() => import("./pages/Splash"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const Requests = lazy(() => import("./pages/Requests"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop />
        <div id="pliiiz-frame">
          <div id="pliiiz-app" className="app-shell">
            <main className="app-scroll">
              <BackHandlerWrapper>
          <Routes>
            {/* Root redirect to splash */}
            <Route path="/" element={<Navigate to="/splash" replace />} />
            
            {/* Public routes (no header/tab bar) */}
            <Route element={<PublicLayout />}>
              <Route
                path="/splash"
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                    <Splash />
                  </Suspense>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                    <Onboarding />
                  </Suspense>
                }
              />
              <Route
                path="/login"
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                    <Login />
                  </Suspense>
                }
              />
              <Route
                path="/register"
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                    <Register />
                  </Suspense>
                }
              />
            </Route>

              <Route element={<ProfileViewLayout />}>
                <Route path="p/:slug" element={<ProfileView />} />
              </Route>
            
            {/* Legacy profile URL redirects - preserves UTM parameters */}
            <Route path="/profil/:id" element={<LegacyProfileRedirect />} />

            {/* Protected routes (with header/tab bar) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route
                  path="/home"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                      <Home />
                    </Suspense>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                      <Requests />
                    </Suspense>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                      <Contacts />
                    </Suspense>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                      <Notifications />
                    </Suspense>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>}>
                      <Profile />
                    </Suspense>
                  }
                />
                <Route path="/offrir-a/:userId" element={<FindGift />} />
                <Route path="/carte" element={<Carte />} />
                <Route path="/offrir/:type" element={<OffrirType />} />
              </Route>
            </Route>
            
            {/* Other routes */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ResetPassword />} />
            
            {/* Admin route unifiée (fullscreen, outside AppLayout) */}
            <Route path="/diag-admin" element={<DiagAdmin />} />
            
            {/* Diagnostic RLS route (protected) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/diag" element={<Diagnostic />} />
            </Route>
            <Route path="/admin/partners" element={<Navigate to="/diag-admin?tab=partners" replace />} />
            <Route path="/admin/slug-migration" element={<Navigate to="/diag-admin?tab=slugs" replace />} />
            <Route path="/admin/gift-regen" element={<Navigate to="/diag-admin?tab=gifts" replace />} />
            <Route path="/admin/feedback-design" element={<Navigate to="/diag-admin?tab=feedback" replace />} />
            <Route path="/admin/populate-images" element={<Navigate to="/diag-admin?tab=populate" replace />} />
            <Route path="/admin/unsplash-regenerate" element={<Navigate to="/diag-admin?tab=unsplash" replace />} />
            
            <Route path="/debug/contacts-audit" element={<ContactsAuditScreen />} />
            
            {/* 404 route */}
            <Route path="/404" element={<NotFound />} />
            
            {/* Catch-all: redirect to 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
              </BackHandlerWrapper>
            </main>
            <AdminModeIndicator />
            <BulkRegenBar />
            <DebugGrid />
            <GlobalOfferCapture />
            <GlobalOfferKillSwitch defaultNear="75011 Paris" />
            <PushNotificationPrompt />
          </div>
        </div>
        </BrowserRouter>
      </AdminModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
