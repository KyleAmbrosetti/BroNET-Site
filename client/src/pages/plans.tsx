import { PlanCard } from "@/components/plan-card";
import { AddressSearch } from "@/components/address-search";
import { Button } from "@/components/ui/button";
import { Check, X, MapPin, CheckCircle2, Cable, Zap, Lock, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type CoverageResult = {
  normalizedAddress: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  technology?: string;
  maxTier?: string;
  available?: boolean;
  source: string;
};

export default function Plans() {
  const [address, setAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [coverageVerified, setCoverageVerified] = useState(false);
  const { toast } = useToast();

  const plans = [
    { 
      name: "NBN 50", 
      speed: 50, 
      upload: 20, 
      price: 69, 
      typical: "50 Mbps",
      typicalUpload: "17",
      tier: 'basic' as const
    },
    { 
      name: "NBN 100", 
      speed: 100, 
      upload: 20, 
      price: 89, 
      typical: "98 Mbps",
      typicalUpload: "18",
      tier: 'basic' as const,
      popular: true
    },
    { 
      name: "NBN 250", 
      speed: 250, 
      upload: 25, 
      price: 109, 
      typical: "245 Mbps",
      typicalUpload: "23",
      tier: 'power' as const
    },
    { 
      name: "NBN 500", 
      speed: 500, 
      upload: 50, 
      price: 119, 
      typical: "480 Mbps",
      typicalUpload: "45",
      tier: 'power' as const
    },
    { 
      name: "NBN 1000", 
      speed: 1000, 
      upload: 50, 
      price: 129, 
      typical: "850 Mbps",
      typicalUpload: "45",
      tier: 'ultra' as const
    },
    { 
      name: "NBN 2000", 
      speed: 2000, 
      upload: 200, 
      price: 155, 
      typical: "1800 Mbps",
      typicalUpload: "170",
      tier: 'ultra' as const,
      badge: "New"
    },
  ];

  const fixedWirelessPlans = [
    { 
      name: "Fixed Wireless 25", 
      speed: 25, 
      upload: 5, 
      price: 59, 
      typical: "25 Mbps",
      tier: 'basic' as const
    },
    { 
      name: "Fixed Wireless 50", 
      speed: 50, 
      upload: 10, 
      price: 69, 
      typical: "47 Mbps",
      tier: 'basic' as const,
      popular: true
    },
    { 
      name: "Fixed Wireless 75", 
      speed: 75, 
      upload: 10, 
      price: 79, 
      typical: "70 Mbps",
      tier: 'power' as const
    },
    { 
      name: "Fixed Wireless Plus", 
      speed: 100, 
      upload: 20, 
      price: 89, 
      typical: "90 Mbps",
      tier: 'power' as const,
      badge: "New"
    },
  ];

  const handleCheckAvailability = async () => {
    if (!address || address.trim().length < 5) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Australian address",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setCoverageResult(null);
    setCoverageVerified(false);

    try {
      const { data, error } = await api.checkCoverage(address);

      setIsChecking(false);

      if (error || !data?.success) {
        toast({
          title: "Check failed",
          description: error || data?.message || "Failed to validate address. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data.result) {
        setCoverageResult(data.result);
        setCoverageVerified(data.result.available !== false);
        toast({ 
          title: "Coverage check complete",
          description: data.result.available !== false 
            ? "NBN is available at your address!" 
            : "NBN may not be available at this address"
        });
      }
    } catch (err) {
      setIsChecking(false);
      console.error('Coverage check error:', err);
      toast({
        title: "Connection error",
        description: "Unable to check coverage. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isFixedWireless = coverageResult?.technology?.toLowerCase().includes('wireless');

  const getMaxSpeedForTechnology = () => {
    if (!coverageResult?.maxTier) return null;
    const tierMatch = coverageResult.maxTier.match(/(\d+)/);
    return tierMatch ? parseInt(tierMatch[1]) : null;
  };

  const isPlanAvailable = (planSpeed: number, isWirelessPlan: boolean) => {
    if (!coverageVerified) return false;
    
    if (isWirelessPlan && !isFixedWireless) return false;
    if (!isWirelessPlan && isFixedWireless) return false;
    
    const maxSpeed = getMaxSpeedForTechnology();
    if (maxSpeed && planSpeed > maxSpeed) return false;
    
    return true;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Superloop Style */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-background dark:from-primary/30 dark:via-purple-600/20 dark:to-background" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              No lock-in<br />nbn plans<span className="text-primary">_</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Super speedy nbn with unlimited data. Plans from just $69/mth with no lock-in contracts.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Unlimited data</span>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm">
                <Lock className="h-4 w-4 text-primary" />
                <span>No lock-in contract</span>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm">
                <Wifi className="h-4 w-4 text-primary" />
                <span>eero Wi-Fi 7 modems</span>
              </div>
            </div>

            {/* Free Modem Offer Banner */}
            <div className="from-primary/10 via-purple-500/10 to-primary/10 border border-primary/20 rounded-xl px-6 py-4 mb-10 max-w-xl mx-auto bg-[#f4f4f5]">
              <div className="flex items-center justify-center gap-3">
                <Wifi className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="font-bold text-lg">FREE* eero Wi-Fi 7 modem</p>
                  <p className="text-sm text-muted-foreground">On 500Mbps+ plans</p>
                  <p className="text-xs text-muted-foreground mt-1">*When you stay connected for 36 months. T&Cs apply.</p>
                </div>
              </div>
            </div>

            {/* Address Check */}
            <Card className="max-w-2xl mx-auto border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Check your address</h3>
                </div>
                <AddressSearch
                  value={address}
                  onChange={setAddress}
                  onSearch={handleCheckAvailability}
                  isSearching={isChecking}
                  buttonText="Check Availability"
                  placeholder="Enter your address..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <div className="container py-8 px-4 md:px-6">
        {/* Coverage Result */}
        {coverageResult && (
          <div className="max-w-2xl mx-auto mb-12">
            <Alert className={coverageResult.available !== false ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"}>
              <CheckCircle2 className={`h-5 w-5 ${coverageResult.available !== false ? "text-green-600" : "text-yellow-600"}`} />
              <AlertTitle className="flex items-center gap-2">
                {coverageResult.available !== false ? "NBN Available!" : "Limited Availability"}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Address:</span> {coverageResult.normalizedAddress}
                  </p>
                  {coverageResult.technology && (
                    <p className="text-sm flex items-center gap-2">
                      <span className="font-medium">Technology:</span> 
                      <Badge variant="secondary">{coverageResult.technology}</Badge>
                    </p>
                  )}
                  {coverageResult.maxTier && (
                    <p className="text-sm">
                      <span className="font-medium">Maximum Speed:</span> {coverageResult.maxTier}
                    </p>
                  )}
                  {coverageVerified && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-3">
                      Select your plan below to get started.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Fibre/Cable Plans Section */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Cable className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">Home nbn plans</h2>
          </div>
          <p className="text-muted-foreground text-center mb-8">
            For FTTP, FTTC, FTTB, FTTN & HFC connections
          </p>
        </div>

        <div className="overflow-x-auto pb-4 mb-16 -mx-4 px-4 pt-2">
          <div className="flex gap-4 min-w-max py-2">
            {plans.map((plan) => {
              const available = isPlanAvailable(plan.speed, false);
              return (
                <div key={plan.name} className="w-[280px] flex-shrink-0">
                  <PlanCard
                    name={plan.name}
                    speed={plan.speed}
                    upload={plan.upload}
                    price={plan.price}
                    typicalSpeed={plan.typical}
                    typicalUpload={plan.typicalUpload}
                    isPopular={plan.popular}
                    tier={plan.tier}
                    badge={plan.badge}
                    disabled={coverageVerified && !available}
                    showSignup={available}
                    address={coverageResult?.normalizedAddress}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed Wireless Plans */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Wifi className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">Fixed Wireless plans</h2>
          </div>
          <p className="text-muted-foreground text-center mb-8">For regional and rural areas</p>
        </div>

        <div className="overflow-x-auto pb-4 mb-16 -mx-4 px-4 pt-2">
          <div className="flex gap-4 min-w-max justify-center py-2">
            {fixedWirelessPlans.map((plan) => {
              const available = isPlanAvailable(plan.speed, true);
              return (
                <div key={plan.name} className="w-[280px] flex-shrink-0">
                  <PlanCard
                    name={plan.name}
                    speed={plan.speed}
                    upload={plan.upload}
                    price={plan.price}
                    typicalSpeed={plan.typical}
                    isPopular={plan.popular}
                    tier={plan.tier}
                    badge={plan.badge}
                    disabled={coverageVerified && !available}
                    showSignup={available}
                    address={coverageResult?.normalizedAddress}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Why Choose Section */}
        <section className="py-16 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Why we're the best for internet</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Unlimited data</h3>
              <p className="text-sm text-muted-foreground">
                We spell 'unlimited' the correct way. No data limits or excess usage charges.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">No lock-in plans</h3>
              <p className="text-sm text-muted-foreground">
                Month-to-month plans means you'll never be tied down. Leave when you want.
              </p>
            </div>
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Wi-Fi 7 modems</h3>
              <p className="text-sm text-muted-foreground">
                Pair your plan with our eero Wi-Fi 7 mesh routers for whole-home coverage.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <p className="text-muted-foreground mb-4">Not sure which plan is right for you?</p>
          <Button size="lg" variant="outline" asChild>
            <Link href="/support">Contact Us</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
