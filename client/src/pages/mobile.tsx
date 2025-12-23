import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Smartphone, Phone, MessageSquare, Globe, Zap, Shield, Users, Wifi } from "lucide-react";

type MobilePlan = {
  name: string;
  data: string;
  price: number;
  calls: string;
  sms: string;
  popular?: boolean;
  badge?: string;
  features: string[];
};

const simOnlyPlans: MobilePlan[] = [
  {
    name: "Starter",
    data: "10GB",
    price: 15,
    calls: "Unlimited",
    sms: "Unlimited",
    features: ["5G Network Access", "Data Banking", "No Lock-in Contract"],
  },
  {
    name: "Essential",
    data: "30GB",
    price: 25,
    calls: "Unlimited",
    sms: "Unlimited",
    features: ["5G Network Access", "Data Banking", "International Calls 10 countries", "No Lock-in Contract"],
  },
  {
    name: "Plus",
    data: "60GB",
    price: 35,
    calls: "Unlimited",
    sms: "Unlimited",
    popular: true,
    features: ["5G Network Access", "Data Banking", "International Calls 20 countries", "Data Gifting", "No Lock-in Contract"],
  },
  {
    name: "Premium",
    data: "120GB",
    price: 45,
    calls: "Unlimited",
    sms: "Unlimited",
    features: ["5G Network Access", "Unlimited Data Banking", "International Calls 35 countries", "Data Gifting", "Roaming Included", "No Lock-in Contract"],
  },
  {
    name: "Unlimited",
    data: "Unlimited",
    price: 55,
    calls: "Unlimited",
    sms: "Unlimited",
    badge: "Best Value",
    features: ["5G Network Access", "Truly Unlimited Data", "International Calls 35 countries", "Data Gifting", "Roaming Included", "Priority Support", "No Lock-in Contract"],
  },
];

const devicePlans: MobilePlan[] = [
  {
    name: "Device Basic",
    data: "20GB",
    price: 45,
    calls: "Unlimited",
    sms: "Unlimited",
    features: ["5G Network Access", "24-month plan", "Latest smartphones available"],
  },
  {
    name: "Device Plus",
    data: "60GB",
    price: 65,
    calls: "Unlimited",
    sms: "Unlimited",
    popular: true,
    features: ["5G Network Access", "24-month plan", "Latest smartphones available", "International Calls 20 countries"],
  },
  {
    name: "Device Premium",
    data: "120GB",
    price: 85,
    calls: "Unlimited",
    sms: "Unlimited",
    features: ["5G Network Access", "24-month plan", "Premium smartphones", "International Calls 35 countries", "Roaming Included"],
  },
  {
    name: "Device Unlimited",
    data: "Unlimited",
    price: 99,
    calls: "Unlimited",
    sms: "Unlimited",
    badge: "Premium",
    features: ["5G Network Access", "24-month plan", "Any smartphone", "Truly Unlimited Data", "International Calls 35 countries", "Roaming Included", "Priority Support"],
  },
];

function PlanCard({ plan, type }: { plan: MobilePlan; type: "sim" | "device" }) {
  return (
    <Card className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`} data-testid={`card-mobile-plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      {plan.badge && !plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary">{plan.badge}</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{type === "sim" ? "SIM Only" : "With Device"}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-center space-y-4">
        <div>
          <div className="text-4xl font-bold text-primary">${plan.price}</div>
          <div className="text-sm text-muted-foreground">/month</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{plan.data}</span>
          </div>
          <div className="text-sm text-muted-foreground">Data</div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-center gap-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{plan.calls}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>{plan.sms}</span>
          </div>
        </div>
        <ul className="text-sm text-left space-y-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={plan.popular ? "default" : "outline"} data-testid={`button-select-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}>
          {type === "sim" ? "Get Started" : "Choose Device"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Mobile() {
  const [activeTab, setActiveTab] = useState("sim");

  return (
    <div className="min-h-screen">
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4" variant="outline">
              <Smartphone className="h-3 w-3 mr-1" />
              Mobile Plans
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Stay Connected with <span className="text-primary">BroNET Mobile</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Australia's fastest 5G network. No lock-in contracts on SIM-only plans. 
              Bundle with your NBN for extra savings.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-brand" data-testid="button-view-plans">
                View Plans
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-bring-number">
                <Link href="/coverage">Bring Your Number</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">5G Network</h3>
              <p className="text-sm text-muted-foreground">Ultra-fast speeds nationwide</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">No Lock-in</h3>
              <p className="text-sm text-muted-foreground">Cancel anytime on SIM plans</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Data Sharing</h3>
              <p className="text-sm text-muted-foreground">Share data with family</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">NBN Bundle</h3>
              <p className="text-sm text-muted-foreground">Save $10/mo when bundled</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Mobile Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're bringing your own device or looking for the latest smartphone, 
              we have a plan that's right for you.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="sim" data-testid="tab-sim-only">SIM Only</TabsTrigger>
              <TabsTrigger value="device" data-testid="tab-with-device">With Device</TabsTrigger>
            </TabsList>

            <TabsContent value="sim">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {simOnlyPlans.map((plan) => (
                  <PlanCard key={plan.name} plan={plan} type="sim" />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="device">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {devicePlans.map((plan) => (
                  <PlanCard key={plan.name} plan={plan} type="device" />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Plan Comparison</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="sim">SIM Only</TabsTrigger>
              <TabsTrigger value="device">With Device</TabsTrigger>
            </TabsList>

            <TabsContent value="sim">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      {simOnlyPlans.map(plan => (
                        <TableHead key={plan.name} className="text-center">{plan.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Monthly Price</TableCell>
                      {simOnlyPlans.map(plan => (
                        <TableCell key={plan.name} className="text-center font-bold">${plan.price}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data</TableCell>
                      {simOnlyPlans.map(plan => (
                        <TableCell key={plan.name} className="text-center">{plan.data}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Calls & SMS</TableCell>
                      {simOnlyPlans.map(plan => (
                        <TableCell key={plan.name} className="text-center">Unlimited</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">5G Access</TableCell>
                      {simOnlyPlans.map(plan => (
                        <TableCell key={plan.name} className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data Banking</TableCell>
                      {simOnlyPlans.map(plan => (
                        <TableCell key={plan.name} className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">International Calls</TableCell>
                      {simOnlyPlans.map((plan, i) => (
                        <TableCell key={plan.name} className="text-center">
                          {i === 0 ? <X className="h-5 w-5 text-muted-foreground mx-auto" /> : 
                           i === 1 ? "10 countries" :
                           i === 2 ? "20 countries" : "35 countries"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Roaming Included</TableCell>
                      {simOnlyPlans.map((plan, i) => (
                        <TableCell key={plan.name} className="text-center">
                          {i >= 3 ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="device">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      {devicePlans.map(plan => (
                        <TableHead key={plan.name} className="text-center">{plan.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Monthly Price</TableCell>
                      {devicePlans.map(plan => (
                        <TableCell key={plan.name} className="text-center font-bold">${plan.price}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data</TableCell>
                      {devicePlans.map(plan => (
                        <TableCell key={plan.name} className="text-center">{plan.data}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Contract Length</TableCell>
                      {devicePlans.map(plan => (
                        <TableCell key={plan.name} className="text-center">24 months</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">5G Access</TableCell>
                      {devicePlans.map(plan => (
                        <TableCell key={plan.name} className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">International Calls</TableCell>
                      {devicePlans.map((plan, i) => (
                        <TableCell key={plan.name} className="text-center">
                          {i === 0 ? <X className="h-5 w-5 text-muted-foreground mx-auto" /> : 
                           i === 1 ? "20 countries" : "35 countries"}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Roaming Included</TableCell>
                      {devicePlans.map((plan, i) => (
                        <TableCell key={plan.name} className="text-center">
                          {i >= 2 ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4 md:px-6">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bundle & Save</h3>
                  <p className="text-muted-foreground max-w-xl">
                    Already have BroNET broadband? Add a mobile plan and save $10/month on your mobile bill. 
                    The more lines you add, the more you save!
                  </p>
                </div>
                <Button size="lg" className="bg-gradient-brand shrink-0" asChild data-testid="button-bundle-save">
                  <Link href="/plans">View NBN Plans</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Switch?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Switching to BroNET Mobile is easy. Keep your existing number and we'll handle the rest. 
            Most transfers complete within 2-4 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-gradient-brand" data-testid="button-get-started">
              Get Started
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-contact-us">
              <Link href="/support">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
