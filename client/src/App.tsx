import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
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

function Router() {
  return (
    <Layout>
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
