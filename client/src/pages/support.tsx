import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MessageSquare, Activity, CheckCircle, Send, Headphones, ArrowRight, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Link } from "wouter";

export default function Support() {
  const [status, setStatus] = useState<"operational" | "incident">("operational");
  const [incidents, setIncidents] = useState<any[]>([]);
  const { user } = useUser();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const { data } = await api.getIncidents();
      if (data) {
        const active = data.incidents.filter((i: any) => i.status !== 'resolved');
        setIncidents(active);
        setStatus(active.length > 0 ? "incident" : "operational");
      }
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.firstName + ' ' + user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const { data, error } = await api.createMessage({
      name,
      email,
      topic: topic || "General Inquiry",
      message
    });
    
    setIsSubmitting(false);
    
    if (error) {
      toast({ title: "Failed to send message", description: error, variant: "destructive" });
      return;
    }
    
    setIsSuccess(true);
    toast({ title: "Message sent!", description: "We'll get back to you shortly." });
    
    if (!user) {
      setName("");
      setEmail("");
    }
    setTopic("");
    setMessage("");
    
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Superloop Style */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Get help and<br />support<span className="text-primary">_</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're here for you. Our Aussie team is available to help with any questions about your internet service.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a href="tel:1300123456" className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg" data-testid="link-call">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Call Us</h3>
                    <p className="text-sm text-muted-foreground">1300 123 456</p>
                  </div>
                </CardContent>
              </Card>
            </a>
            <a href="mailto:support@brointernet.com" className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg" data-testid="link-email">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email Us</h3>
                    <p className="text-sm text-muted-foreground">support@brointernet.com</p>
                  </div>
                </CardContent>
              </Card>
            </a>
            <Link href="/dashboard" className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg" data-testid="link-chat">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Chat</h3>
                    <p className="text-sm text-muted-foreground">In customer portal</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className={`${status === 'operational' ? 'border-green-300' : 'border-yellow-300'}`} role="status" aria-live="polite">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${status === 'operational' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                  <Activity className={`h-6 w-6 ${status === 'operational' ? 'text-green-600' : 'text-yellow-600'}`} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold">Network Status</h3>
                  <p className={`text-sm ${status === 'operational' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {status === 'operational' ? 'All systems operational' : `${incidents.length} active incident(s)`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="container py-16 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How long does it take to switch?</AccordionTrigger>
                <AccordionContent>
                  Most switches can be completed within 15-60 minutes if you have an existing NBN connection. For new connections, it usually takes 1-3 business days depending on NBN Co technician availability.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Do I need a new modem?</AccordionTrigger>
                <AccordionContent>
                  Not necessarily! If you have a BYO modem that is NBN compatible, you can use it. We also offer free eero 7 routers when you stay connected for 36 months.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What is CGNAT?</AccordionTrigger>
                <AccordionContent>
                  We use CGNAT (Carrier Grade NAT) to manage IPv4 addresses. This works fine for 99% of users. If you need port forwarding, you can add a Static IP for $5/mo in the portal.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Are there any cancellation fees?</AccordionTrigger>
                <AccordionContent>
                  Nope! We don't believe in locking you in. If you leave, you just pay for the remainder of your current billing month. No exit fees, ever.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What speeds can I get?</AccordionTrigger>
                <AccordionContent>
                  This depends on your connection type and location. Check your address on our coverage page to see what speeds are available. We offer plans from 50 Mbps up to 2000 Mbps.
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-8">
              <Button variant="outline" asChild>
                <Link href="/coverage">
                  Check your address
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Headphones className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Send us a message</h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-4">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Thanks for reaching out. One of our team will get back to you shortly.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => setIsSuccess(false)}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          placeholder="Your name" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@example.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input 
                        id="topic" 
                        placeholder="Sales, Support, Billing..." 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="How can we help?" 
                        className="min-h-[120px]" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                    <Button className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                      {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
