import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function Auth() {
  const { login, signup, user, isLoading } = useUser();
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse query params for plan selection
  const searchParams = new URLSearchParams(window.location.search);
  const planId = searchParams.get('plan');

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      await login(email, password);
    } catch (error) {
      // Toast handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    
    try {
      await signup({
        firstName: (form.elements.namedItem('first-name') as HTMLInputElement).value,
        lastName: (form.elements.namedItem('last-name') as HTMLInputElement).value,
        email: (form.elements.namedItem('signup-email') as HTMLInputElement).value,
        password: (form.elements.namedItem('signup-password') as HTMLInputElement).value,
        planId: planId || 'nbn100' // Default to NBN100 if none selected
      });
    } catch (error) {
      // Toast handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/20">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-brand p-2 rounded-xl text-white mb-4">
            <Zap className="h-8 w-8 fill-current" />
          </div>
          <h1 className="text-3xl font-bold">BroNET Portal</h1>
          <p className="text-muted-foreground mt-2 text-center">Manage your plan, check usage, and get support.</p>
        </div>

        <Tabs defaultValue={planId ? "signup" : "login"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full bg-gradient-brand" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                  <Button variant="link" type="button" className="text-xs text-muted-foreground">Forgot your password?</Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>New Connection</CardTitle>
                <CardDescription>Join the fastest growing ISP in Australia.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  {planId && (
                    <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm font-medium flex items-center justify-center">
                      Selected Plan: {planId.toUpperCase()}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input id="first-name" name="first-name" placeholder="Gary" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input id="last-name" name="last-name" placeholder="Glitter" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="signup-email" type="email" placeholder="gary@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="signup-password" type="password" required minLength={8} />
                    <p className="text-[0.8rem] text-muted-foreground">Must be at least 8 characters</p>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 flex gap-2 text-xs text-yellow-800 dark:text-yellow-300 items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Demo mode: This form creates a persistent local session.</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gradient-brand" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}