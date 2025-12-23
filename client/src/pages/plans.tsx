import { PlanCard } from "@/components/plan-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Radio, MapPin, Loader2, CheckCircle2, Wifi, Cable } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type StripeProduct = {
  id: string;
  name: string;
  description: string;
  metadata: any;
  prices: { id: string; unit_amount: number; currency: string; }[];
};

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
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);
  const [address, setAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [coverageVerified, setCoverageVerified] = useState(false);
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const plans = [
    { name: "NBN 50", speed: 50, upload: 20, price: 69, typical: "50 Mbps" },
    { name: "NBN 100", speed: 100, upload: 20, price: 89, typical: "98 Mbps", popular: true },
    { name: "NBN 250", speed: 250, upload: 25, price: 109, typical: "245 Mbps" },
    { name: "NBN 1000", speed: 1000, upload: 50, price: 129, typical: "850 Mbps" },
    { name: "NBN 2000", speed: 2000, upload: 500, price: 155, typical: "1800 Mbps", badge: "New" },
  ];

  const fixedWirelessPlans = [
    { name: "Fixed Wireless 25", speed: 25, upload: 5, price: 59, typical: "25 Mbps" },
    { name: "Fixed Wireless 50", speed: 50, upload: 10, price: 69, typical: "47 Mbps", popular: true },
    { name: "Fixed Wireless 75", speed: 75, upload: 10, price: 79, typical: "70 Mbps" },
    { name: "Fixed Wireless Plus", speed: 100, upload: 20, price: 89, typical: "90 Mbps", badge: "New" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await api.getStripeProducts();
      if (data?.products) {
        setStripeProducts(data.products);
      }
    };
    fetchProducts();
  }, []);

  const getPriceId = (planName: string) => {
    const product = stripeProducts.find(p => p.name === planName);
    return product?.prices?.[0]?.id;
  };

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

  const handleSignup = async (priceId: string, planName: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in or create an account to sign up for a plan.",
      });
      setLocation("/auth");
      return;
    }

    const { data, error } = await api.createCheckoutSession(priceId, planName);
    if (error) {
      toast({
        title: "Checkout Error",
        description: error,
        variant: "destructive",
      });
      return;
    }
    
    if (data?.url) {
      window.location.href = data.url;
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
    <div className="container py-16 px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
        <p className="text-muted-foreground text-lg">
          No hidden fees, no lock-in contracts. Just fast internet at a fair price.
          Change your plan anytime in the portal.
        </p>
      </div>

      {/* Check Availability Section */}
      <Card className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Check your address first</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Enter your address to see which plans are available at your location and unlock sign up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Enter your street address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckAvailability()}
              className="flex-1"
              disabled={isChecking}
              data-testid="input-check-address"
            />
            <Button 
              onClick={handleCheckAvailability}
              className="bg-gradient-brand border-0"
              disabled={isChecking}
              data-testid="button-check-availability"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Result */}
      {coverageResult && (
        <div className="max-w-2xl mx-auto mb-16">
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
                    You can now sign up for {isFixedWireless ? "Fixed Wireless" : "NBN Fibre/Cable"} plans below.
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Info message when not verified */}
      {!coverageVerified && (
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-center text-muted-foreground text-sm">
            Check your address above to unlock plan sign up options.
          </p>
        </div>
      )}

      {/* Fibre/Cable Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-center">NBN Fibre & Cable Plans</h2>
        <p className="text-muted-foreground text-center mb-8">For FTTP, FTTC, FTTB, FTTN & HFC connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-24">
        {plans.map((plan) => {
          const available = isPlanAvailable(plan.speed, false);
          return (
            <PlanCard
              key={plan.name}
              name={plan.name}
              speed={plan.speed}
              upload={plan.upload}
              price={plan.price}
              typicalSpeed={plan.typical}
              isPopular={plan.popular}
              priceId={available ? getPriceId(plan.name) : undefined}
              onSignup={available ? handleSignup : undefined}
              disabled={coverageVerified && !available}
            />
          );
        })}
      </div>

      {/* Fixed Wireless Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Radio className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-center">NBN Fixed Wireless Plans</h2>
        </div>
        <p className="text-muted-foreground text-center mb-8">For regional and rural areas with NBN Fixed Wireless coverage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
        {fixedWirelessPlans.map((plan) => {
          const available = isPlanAvailable(plan.speed, true);
          return (
            <PlanCard
              key={plan.name}
              name={plan.name}
              speed={plan.speed}
              upload={plan.upload}
              price={plan.price}
              typicalSpeed={plan.typical}
              isPopular={plan.popular}
              priceId={available ? getPriceId(plan.name) : undefined}
              onSignup={available ? handleSignup : undefined}
              disabled={coverageVerified && !available}
            />
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Plan Comparison</h2>
        <div className="rounded-xl border overflow-hidden">
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
                <TableCell className="font-medium">No Lock-in Contract</TableCell>
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
                <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
                <TableCell className="text-center"><Check className="inline h-5 w-5 text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Large File Downloads</TableCell>
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
  );
}
