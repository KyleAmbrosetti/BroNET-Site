import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Phone, MessageSquare, Globe, Zap, Shield, Users, Wifi, ArrowRight } from "lucide-react";

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

function PlanCard({ plan }: { plan: MobilePlan }) {
  return (
    <Card className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`} data-testid={`card-mobile-plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}>
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
        <CardDescription>SIM Only</CardDescription>
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
          {plan.features.slice(0, 4).map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="secondary" disabled data-testid={`button-coming-soon-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}>
          Coming Soon
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Mobile() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Superloop Style */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-background dark:from-primary/30 dark:via-purple-600/20 dark:to-background" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4" variant="outline">Coming Soon</Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              No lock-in<br />mobile plans<span className="text-primary">_</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Australia's fastest 5G network. No lock-in contracts. Bring your own device and save.
              Bundle with your NBN for extra savings.
            </p>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="py-8 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">5G Network</h3>
              <p className="text-sm text-muted-foreground">Ultra-fast speeds</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">No Lock-in</h3>
              <p className="text-sm text-muted-foreground">Cancel anytime</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Data Sharing</h3>
              <p className="text-sm text-muted-foreground">Share with family</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">NBN Bundle</h3>
              <p className="text-sm text-muted-foreground">Save $10/mo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Choose Your Mobile Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bring your own device and enjoy our competitive SIM-only plans. No contracts, no hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {simOnlyPlans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Plan Comparison</h2>
          
          <div className="overflow-x-auto max-w-5xl mx-auto">
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
                  <TableCell className="font-medium">5G Access</TableCell>
                  {simOnlyPlans.map(plan => (
                    <TableCell key={plan.name} className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">International Calls</TableCell>
                  {simOnlyPlans.map((plan, i) => (
                    <TableCell key={plan.name} className="text-center">
                      {i === 0 ? <X className="h-5 w-5 text-muted-foreground mx-auto" /> : 
                       i === 1 ? "10" :
                       i === 2 ? "20" : "35"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Roaming</TableCell>
                  {simOnlyPlans.map((plan, i) => (
                    <TableCell key={plan.name} className="text-center">
                      {i >= 3 ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Bundle CTA */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bundle & Save</h3>
                  <p className="text-muted-foreground max-w-xl">
                    Already have BroNET broadband? Add a mobile plan and save $10/month on your mobile bill.
                  </p>
                </div>
                <Button size="lg" className="shrink-0" asChild data-testid="button-bundle-save">
                  <Link href="/plans">
                    View NBN Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
