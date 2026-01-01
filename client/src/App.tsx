import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import Intercom from '@intercom/messenger-js-sdk';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "next-themes";
import { AuthProvider } from "@/hooks/use-user";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Plans from "@/pages/plans";
import Coverage from "@/pages/coverage";
import Support from "@/pages/support";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cis from "@/pages/cis";
import Modems from "@/pages/modems";
import Nbn2000 from "@/pages/nbn-2000";
import ComingSoon from "@/pages/coming-soon";
import Abuse from "@/pages/abuse";
import SignupWizard from "@/pages/signup-wizard";
import Mobile from "@/pages/mobile";
import SpeedTest from "@/pages/speed-test";

function TimeBasedThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    const checkTimeAndSetTheme = () => {
      // Only auto-switch if user hasn't explicitly chosen light/dark
      const storedPreference = localStorage.getItem('theme-preference');
      if (storedPreference === 'auto' || !storedPreference) {
        const hour = new Date().getHours();
        // Day time: 6 AM to 6 PM (light mode)
        // Night time: 6 PM to 6 AM (dark mode)
        if (hour >= 6 && hour < 18) {
          setTheme('light');
        } else {
          setTheme('dark');
        }
      }
    };
    
    // Check immediately on mount
    checkTimeAndSetTheme();
    
    // Check every minute
    const interval = setInterval(checkTimeAndSetTheme, 60000);
    
    return () => clearInterval(interval);
  }, [setTheme]);
  
  return null;
}

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <Layout>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={ComingSoon} />
        <Route path="/home" component={Home} />
        <Route path="/plans" component={Plans} />
        <Route path="/mobile" component={Mobile} />
        <Route path="/speed-test" component={SpeedTest} />
        <Route path="/coverage" component={Coverage} />
        <Route path="/modems" component={Modems} />
        <Route path="/nbn-2000" component={Nbn2000} />
        <Route path="/support" component={Support} />
        <Route path="/auth" component={Auth} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin" component={Admin} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/cis" component={Cis} />
        <Route path="/abuse" component={Abuse} />
        <Route path="/signup" component={SignupWizard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Initialize Intercom with identity verification
    async function initIntercom() {
      try {
        const response = await fetch('/api/intercom/token', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.user_hash && data.user_id) {
            // Authenticated user with HMAC verification
            Intercom({
              app_id: 'wj8o6t7c',
              user_id: data.user_id,
              user_hash: data.user_hash,
              email: data.email,
              name: data.name,
              created_at: data.created_at,
            });
          } else {
            // Anonymous visitor
            Intercom({
              app_id: 'wj8o6t7c',
            });
          }
        } else {
          Intercom({
            app_id: 'wj8o6t7c',
          });
        }
      } catch (error) {
        console.error('Failed to initialize Intercom:', error);
        Intercom({
          app_id: 'wj8o6t7c',
        });
      }
    }
    initIntercom();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TimeBasedThemeSwitcher />
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
