import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MessageSquare, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { db } from "@/lib/mock-db";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function Support() {
  const [status, setStatus] = useState<"operational" | "incident">("operational");
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    // Poll for incidents
    const updateStatus = () => {
      const allIncidents = db.getIncidents();
      const active = allIncidents.filter(i => i.status !== 'resolved');
      setIncidents(active);
      setStatus(active.length > 0 ? "incident" : "operational");
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Live update
    return () => clearInterval(interval);
  }, []);

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
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  alert("Please sign in to the portal to submit support tickets.");
                }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input id="topic" placeholder="Sales, Support, Billing..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="How can we help?" className="min-h-[120px]" />
                  </div>
                  <Button className="w-full bg-gradient-brand">Send Message</Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}