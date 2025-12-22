import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Plans from "@/pages/plans";
import Coverage from "@/pages/coverage";
import Support from "@/pages/support";
import Auth from "@/pages/auth";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/plans" component={Plans} />
        <Route path="/coverage" component={Coverage} />
        <Route path="/support" component={Support} />
        <Route path="/auth" component={Auth} />
        {/* Placeholder for dashboard - redirecting to auth for now if accessed directly */}
        <Route path="/dashboard" component={() => (
          <div className="container py-12 text-center">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-muted-foreground">This is where the user dashboard would be.</p>
          </div>
        )} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;