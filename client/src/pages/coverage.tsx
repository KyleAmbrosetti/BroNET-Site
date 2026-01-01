import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddressSearch } from "@/components/address-search";
import { MapPin, CheckCircle2, AlertCircle, Info, History, Database, Cloud, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";

type CoverageResult = {
  normalizedAddress: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  technology?: string;
  maxTier?: string;
  available?: boolean;
  source: 'wholesale_api' | 'dataset' | 'address_only' | 'rapidapi' | 'nbn_public_api';
};

type CoverageStatus = {
  mode: 'wholesale_api' | 'dataset' | 'none' | 'rapidapi' | 'nbn_public_api';
  wholesaleConfigured: boolean;
  datasetRecords: number;
  addressValidationEnabled: boolean;
};

type CoverageCheck = {
  id: string;
  inputAddress: string;
  normalizedAddress: string;
  technology: string | null;
  maxTier: string | null;
  available: number | null;
  source: string;
  createdAt: string;
};

export default function Coverage() {
  const [address, setAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [status, setStatus] = useState<CoverageStatus | null>(null);
  const [history, setHistory] = useState<CoverageCheck[]>([]);
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    loadStatus();

    if (user) {
      loadHistory();
    }
    
    const params = new URLSearchParams(window.location.search);
    const addressParam = params.get('address');
    if (addressParam) {
      setAddress(addressParam);
    }
  }, [user]);

  const loadStatus = async () => {
    const { data } = await api.getCoverageStatus();
    if (data) {
      setStatus(data);
    }
  };

  const loadHistory = async () => {
    const { data } = await api.getCoverageHistory();
    if (data) {
      setHistory(data.checks);
    }
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || address.trim().length < 5) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Australian address",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    setResult(null);

    const { data, error } = await api.checkCoverage(address);

    setIsChecking(false);

    if (error || !data?.success) {
      toast({
        title: "Check failed",
        description: error || data?.message || "Failed to validate address",
        variant: "destructive"
      });
      return;
    }

    if (data.result) {
      setResult(data.result);
      if (user) {
        loadHistory();
      }
      toast({ title: "Coverage check complete" });
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'wholesale_api': return 'Wholesale API';
      case 'rapidapi': return 'NBN Live Lookup';
      case 'nbn_public_api': return 'NBN Public API';
      case 'dataset': return 'Admin Dataset';
      case 'address_only': return 'Address Validation';
      case 'none': return 'Address Only';
      default: return mode;
    }
  };

  const getModeIcon = (mode: string) => {
    if (mode === 'wholesale_api' || mode === 'rapidapi' || mode === 'nbn_public_api') {
      return <Cloud className="h-4 w-4" />;
    }
    return <Database className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Superloop Style */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-background dark:from-primary/30 dark:via-purple-600/20 dark:to-background" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Check your<br />address<span className="text-primary">_</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Enter your address to check NBN availability and find the best plans for your home.
            </p>
            
            {status && (
              <div className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-muted border mb-8">
                {status.mode !== 'none' && getModeIcon(status.mode)}
                <span className="text-muted-foreground">
                  Mode: <span className="font-semibold text-foreground">{getModeLabel(status.mode)}</span>
                </span>
              </div>
            )}

            <Card className="max-w-xl mx-auto border-2">
              <CardContent className="pt-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-medium">Enter your address</span>
                  </div>
                  <AddressSearch
                    value={address}
                    onChange={setAddress}
                    onSearch={() => handleCheck({ preventDefault: () => {} } as React.FormEvent)}
                    isSearching={isChecking}
                    buttonText="Check Availability"
                    placeholder="Start typing an Australian address..."
                    inputId="address"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 pb-16">
        {result && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Address Card */}
            <Card className="mb-6" data-testid="card-address">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Address Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="font-semibold text-lg">{result.normalizedAddress}</div>
                {(result.suburb || result.state || result.postcode) && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {result.suburb && (
                      <div>
                        <span className="text-muted-foreground block">Suburb</span>
                        <span className="font-medium">{result.suburb}</span>
                      </div>
                    )}
                    {result.state && (
                      <div>
                        <span className="text-muted-foreground block">State</span>
                        <span className="font-medium">{result.state}</span>
                      </div>
                    )}
                    {result.postcode && (
                      <div>
                        <span className="text-muted-foreground block">Postcode</span>
                        <span className="font-medium">{result.postcode}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  {getModeIcon(result.source)}
                  <span>Data Source: {getModeLabel(result.source)}</span>
                </div>
              </CardContent>
            </Card>

            {result.source === 'address_only' ? (
              <Alert className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Address Validation Only</AlertTitle>
                <AlertDescription>
                  We've validated your address, but NBN service qualification data is not currently available.
                  Please contact us directly for availability information at this address.
                </AlertDescription>
              </Alert>
            ) : (
              <Card className={`mb-8 ${
                result.available
                  ? 'border-green-300 dark:border-green-700'
                  : 'border-orange-300 dark:border-orange-700'
              }`} data-testid="card-result">
                <CardHeader className={`pb-3 ${
                  result.available
                    ? 'bg-green-50 dark:bg-green-900/30'
                    : 'bg-orange-50 dark:bg-orange-900/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.available ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    )}
                    <div>
                      <CardTitle className={`text-xl ${
                        result.available
                          ? 'text-green-800 dark:text-green-300'
                          : 'text-orange-800 dark:text-orange-300'
                      }`} data-testid="text-result-title">
                        {result.available ? "NBN Service Available" : "Limited Availability"}
                      </CardTitle>
                      <CardDescription>
                        {result.available 
                          ? "Great news! NBN services are available at this address."
                          : "NBN may have limited availability at this location."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.technology && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Connection Technology</span>
                        <div className="font-bold text-lg" data-testid="text-technology">
                          {result.technology}
                        </div>
                      </div>
                    )}
                    {result.maxTier && (
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">Maximum Speed Available</span>
                        <div className="font-bold text-lg text-primary" data-testid="text-max-speed">
                          Up to {result.maxTier}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.available && result.source !== 'address_only' && (
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">Ready to get connected?</h3>
                <Button size="lg" className="bg-gradient-brand" asChild>
                  <Link href="/plans">
                    View Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {user && history.length > 0 && (
          <div className="max-w-3xl mx-auto mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Checks
                </CardTitle>
                <CardDescription>Your coverage check history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                      data-testid={`history-${check.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{check.normalizedAddress}</p>
                        <p className="text-xs text-muted-foreground">
                          {check.technology || 'N/A'} • {check.maxTier || 'N/A'} • {format(new Date(check.createdAt), 'PPp')}
                        </p>
                      </div>
                      <div>
                        {check.available === 1 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : check.available === 0 ? (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="max-w-3xl mx-auto mt-12">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription className="text-sm">
              Coverage information is provided as a guide only. Final service qualification and availability
              is subject to NBN Co verification at the time of order.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
