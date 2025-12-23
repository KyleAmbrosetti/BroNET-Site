import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Wifi, Mail, ArrowRight, Clock, Zap, Bell } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "coming-soon" }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: data.alreadySubscribed ? "Already subscribed!" : "You're on the list!",
          description: data.alreadySubscribed 
            ? "This email is already registered for updates."
            : "We'll notify you when we launch.",
        });
        setEmail("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="container relative px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8" data-testid="badge-coming-soon">
            <Clock className="h-4 w-4" />
            Coming Soon
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl">
              <Wifi className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" data-testid="heading-coming-soon">
            Something <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Amazing</span> is Coming
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-lg mx-auto" data-testid="text-description">
            We're working hard to bring you the best internet experience in Australia. Be the first to know when we launch.
          </p>
          
          <Card className="border-0 shadow-2xl max-w-md mx-auto mb-12">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 justify-center mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-semibold">Get Notified</span>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                  data-testid="input-email-notify"
                />
                <Button 
                  type="submit" 
                  className="bg-gradient-brand border-0"
                  disabled={isSubmitting}
                  data-testid="button-notify-me"
                >
                  {isSubmitting ? "Joining..." : "Notify Me"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-xl mx-auto">
            <div className="text-center" data-testid="feature-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold mb-1">Ultra Fast</div>
              <div className="text-sm text-muted-foreground">Up to 2000 Mbps</div>
            </div>
            <div className="text-center" data-testid="feature-2">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold mb-1">Reliable</div>
              <div className="text-sm text-muted-foreground">99.9% Uptime</div>
            </div>
            <div className="text-center" data-testid="feature-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="font-semibold mb-1">Support</div>
              <div className="text-sm text-muted-foreground">Aussie Team</div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth" className="text-primary hover:underline font-medium" data-testid="link-login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
