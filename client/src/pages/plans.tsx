import { PlanCard } from "@/components/plan-card";
import { AddressSearch } from "@/components/address-search";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Radio, MapPin, CheckCircle2, Cable, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
      tier: 'power' as const,
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
  const isFibre = coverageResult?.technology && !isFixedWireless;

  const getTechnologyIcon = () => {
    if (isFixedWireless) return <Wifi className="h-5 w-5" />;
    return <Cable className="h-5 w-5" />;
  };

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
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 via-background to-background py-16 px-4 md:px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-4">No lock-in contracts</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            High-speed NBN plans from just{" "}
            <span className="text-primary">$69/mth</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Unlimited NBN plans with no lock-in contracts for fast streaming, downloads, and online gaming.
          </p>
          
          {/* Check Availability Section */}
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur border-primary/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Check your address for available NBN plans</h3>
              </div>
              <AddressSearch
                value={address}
                onChange={setAddress}
                onSearch={handleCheckAvailability}
                isSearching={isChecking}
                buttonText="Check Availability"
                placeholder="Start typing your address..."
              />
            </CardContent>
          </Card>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>Unlimited data</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>No lock-in contract</span>
            </div>
          </div>
        </div>
      </div>

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
                      {getTechnologyIcon()}
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
                      Great! Choose your plan below and click "Sign Up Now" to get started.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Info message when not verified */}
        {!coverageVerified && !coverageResult && (
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-center text-muted-foreground text-sm">
              Enter your address above to check availability and unlock the "Sign Up Now" button.
            </p>
          </div>
        )}

        {/* Fibre/Cable Plans Section */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Cable className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">Choose the right NBN plan for you</h2>
          </div>
          <p className="text-muted-foreground text-center mb-2">
            All BroNET NBN plans come with unlimited data. Choose the plan that suits you best.
          </p>
          <p className="text-muted-foreground text-center text-sm mb-8">
            For FTTP, FTTC, FTTB, FTTN & HFC connections
          </p>
        </div>

        <div className="overflow-x-auto pb-4 mb-16 -mx-4 px-4">
          <div className="flex gap-4 min-w-max">
            {plans.map((plan) => {
              const available = isPlanAvailable(plan.speed, false);
              return (
                <div key={plan.name} className="w-[280px] flex-shrink-0">
                  <PlanCard
                    name={plan.name}
                    speed={plan.speed}
                    upload={plan.upload}
                    price={plan.price}
                    promoPrice={plan.promoPrice}
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
            <Radio className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">NBN Fixed Wireless Plans</h2>
          </div>
          <p className="text-muted-foreground text-center mb-8">For regional and rural areas with NBN Fixed Wireless coverage</p>
        </div>

        <div className="overflow-x-auto pb-4 mb-16 -mx-4 px-4">
          <div className="flex gap-4 min-w-max justify-center">
            {fixedWirelessPlans.map((plan) => {
              const available = isPlanAvailable(plan.speed, true);
              return (
                <div key={plan.name} className="w-[280px] flex-shrink-0">
                  <PlanCard
                    name={plan.name}
                    speed={plan.speed}
                    upload={plan.upload}
                    price={plan.price}
                    promoPrice={plan.promoPrice}
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

        {/* Plan Comparison Table */}
        <div className="max-w-5xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Plan Comparison</h2>
          <div className="rounded-xl border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Feature</TableHead>
                  <TableHead className="font-semibold text-center">NBN 50</TableHead>
                  <TableHead className="font-semibold text-center">NBN 100</TableHead>
                  <TableHead className="font-semibold text-center">NBN 250</TableHead>
                  <TableHead className="font-semibold text-center">NBN 1000</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Price/month</TableCell>
                  <TableCell className="text-center">$69</TableCell>
                  <TableCell className="text-center">$89</TableCell>
                  <TableCell className="text-center">$109</TableCell>
                  <TableCell className="text-center">$129</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Download Speed</TableCell>
                  <TableCell className="text-center">50 Mbps</TableCell>
                  <TableCell className="text-center">100 Mbps</TableCell>
                  <TableCell className="text-center">250 Mbps</TableCell>
                  <TableCell className="text-center">1000 Mbps</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Upload Speed</TableCell>
                  <TableCell className="text-center">20 Mbps</TableCell>
                  <TableCell className="text-center">20 Mbps</TableCell>
                  <TableCell className="text-center">25 Mbps</TableCell>
                  <TableCell className="text-center">50 Mbps</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Unlimited Data</TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">4K Streaming</TableCell>
                  <TableCell className="text-center"><X className="inline h-5 w-5 text-muted-foreground" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Best for Gaming</TableCell>
                  <TableCell className="text-center"><X className="inline h-5 w-5 text-muted-foreground" /></TableCell>
                  <TableCell className="text-center"><X className="inline h-5 w-5 text-muted-foreground" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                  <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}