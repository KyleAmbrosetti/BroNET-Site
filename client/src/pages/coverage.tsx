import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AddressSearch } from "@/components/address-search";
import { MapPin, CheckCircle2, AlertCircle, Info, History, Database, Cloud } from "lucide-react";
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
    
    // Read address from URL query parameter
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
    <div className="container py-16 px-4 md:px-6">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-title">Check Availability</h1>
        <p className="text-muted-foreground">
          Enter your address to check NBN availability at your premises.
        </p>
        
        {status && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-muted/50 border">
            {status.mode !== 'none' && getModeIcon(status.mode)}
            <span className="text-muted-foreground">
              Mode: <span className="font-semibold text-foreground">{getModeLabel(status.mode)}</span>
            </span>
            {status.mode === 'dataset' && (
              <span className="text-muted-foreground">
                • {status.datasetRecords} records
              </span>
            )}
          </div>
        )}
      </div>

      <Card className="max-w-xl mx-auto border-2 shadow-lg mb-12">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Enter your address</Label>
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
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Address Card */}
          <Card className="mb-6 border-2" data-testid="card-address">
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
            <Card className={`mb-8 border-2 ${
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
                      <div className="font-bold text-lg flex items-center gap-2" data-testid="text-technology">
                        {result.technology}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {result.technology.includes('Fibre to the Premises') && 'Direct fibre connection to your home - the fastest NBN technology.'}
                        {result.technology.includes('Fibre to the Building') && 'Fibre to your building with existing copper to your unit.'}
                        {result.technology.includes('Fibre to the Curb') && 'Fibre to your street with short copper run to your home.'}
                        {result.technology.includes('Fibre to the Node') && 'Fibre to nearby node with copper to your premises.'}
                        {result.technology.includes('Hybrid Fibre Coaxial') && 'High-speed coaxial cable network - supports up to 1000 Mbps.'}
                        {result.technology.includes('Fixed Wireless') && 'Wireless connection from nearby NBN tower.'}
                        {result.technology.includes('Satellite') && 'Sky Muster satellite connection for remote areas.'}
                      </p>
                    </div>
                  )}
                  {result.maxTier && (
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Maximum Speed Available</span>
                      <div className="font-bold text-lg text-primary" data-testid="text-max-speed">
                        Up to {result.maxTier}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Download speeds. Actual speeds may vary based on network conditions.
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs mt-6 text-muted-foreground border-t pt-4">
                  Note: Final service qualification depends on NBN and wholesale provider checks at time of order.
                </p>
              </CardContent>
            </Card>
          )}

          {result.available && result.source !== 'address_only' && (
            <>
              <h3 className="text-2xl font-bold mb-6 text-center">Recommended Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-xl p-6 bg-card relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    BEST VALUE
                  </div>
                  <h4 className="font-bold text-lg">NBN 100</h4>
                  <div className="text-3xl font-bold my-2">$89<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Perfect for 3-4 people streaming in 4K.</p>
                  <Button className="w-full" asChild data-testid="button-select-nbn100">
                    <Link href="/auth?plan=nbn100">Select Plan</Link>
                  </Button>
                </div>

                <div className="border rounded-xl p-6 bg-card relative overflow-hidden border-purple-500/50">
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    FASTEST
                  </div>
                  <h4 className="font-bold text-lg">NBN 1000</h4>
                  <div className="text-3xl font-bold my-2">$139<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <p className="text-sm text-muted-foreground mb-4">Ultimate speed for gamers and heavy downloaders.</p>
                  <Button className="w-full bg-gradient-brand" asChild data-testid="button-select-nbn1000">
                    <Link href="/auth?plan=nbn1000">Select Plan</Link>
                  </Button>
                </div>
              </div>
            </>
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
                        {check.technology || 'N/A'} • {check.maxTier || 'N/A'} • {getModeLabel(check.source)} • {format(new Date(check.createdAt), 'PPp')}
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
          <AlertTitle>Important Disclaimer</AlertTitle>
          <AlertDescription className="text-sm">
            Coverage information is provided as a guide only. Final service qualification and availability
            is subject to NBN Co and wholesale provider verification at the time of order. Technology type
            and maximum speeds may vary based on infrastructure and location.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
