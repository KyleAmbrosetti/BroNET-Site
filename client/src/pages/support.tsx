import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MessageSquare, Activity, AlertTriangle, CheckCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function Support() {
  const [status, setStatus] = useState<"operational" | "incident">("operational");
  const [incidents, setIncidents] = useState<any[]>([]);
  const { user } = useUser();
  const { toast } = useToast();
  
  // Contact Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Poll for incidents
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

  // Pre-fill form if logged in
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
    
    // Reset form if not logged in (keep name/email if logged in)
    if (!user) {
      setName("");
      setEmail("");
    }
    setTopic("");
    setMessage("");
    
    // Reset success message after 5s
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <div className="container py-16 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column - Contact & Status */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Support</h1>
            <p className="text-muted-foreground text-lg">
              We're here to help. Our Aussie team is available 8am - 8pm AEDT.
            </p>
          </div>

          <Card className={`border-l-4 ${status === 'operational' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${status === 'operational' ? 'text-green-500' : 'text-yellow-500'}`} />
                <CardTitle className="text-lg">Network Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {status === 'operational' ? (
                <>
                  <p className="text-sm font-medium">All systems operational</p>
                  <p className="text-xs text-muted-foreground mt-1">Last updated: Just now</p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Active Incidents:</p>
                  {incidents.map(inc => (
                    <div key={inc.id} className="text-xs bg-muted p-2 rounded">
                      <div className="font-bold">{inc.title}</div>
                      <div className="text-muted-foreground capitalize">{inc.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">1300 BRO NET</div>
                <div className="text-xs text-muted-foreground">Mon-Sun, 8am - 8pm</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">support@bronet.com.au</div>
                <div className="text-xs text-muted-foreground">Response within 24 hours</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold">Live Chat</div>
                <div className="text-xs text-muted-foreground">Available in Customer Portal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - FAQ & Form */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
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
                  Not necessarily! If you have a BYO modem that is NBN compatible (VDSL for FTTN, or WAN port for FTTP/HFC), you can use it. We also sell pre-configured eero 6+ routers if you want an upgrade.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What is CGNAT?</AccordionTrigger>
                <AccordionContent>
                  We use CGNAT (Carrier Grade NAT) to manage IPv4 addresses. This works fine for 99% of users. If you need port forwarding for hosting servers or specific gaming setups, you can add a Static IP for $5/mo in the portal.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Are there any cancellation fees?</AccordionTrigger>
                <AccordionContent>
                  Nope! We don't believe in locking you in. If you leave, you just pay for the remainder of your current billing month. No exit fees, ever.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            <Card>
              <CardContent className="pt-6">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-300">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-4">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Thanks for reaching out. One of our local support legends will get back to you shortly via email.
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
                    <Button className="w-full bg-gradient-brand" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                      {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}