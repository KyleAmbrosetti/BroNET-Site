import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, MapPin, CheckCircle2, AlertCircle, Info, History, Database, Cloud } from "lucide-react";
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
  source: 'wholesale_api' | 'dataset' | 'address_only';
};

type CoverageStatus = {
  mode: 'wholesale_api' | 'dataset' | 'none';
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
      case 'dataset': return 'Admin Dataset';
      case 'none': return 'Address Only';
      default: return 'Unknown';
    }
  };

  const getModeIcon = (mode: string) => {
    return mode === 'wholesale_api' ? <Cloud className="h-4 w-4" /> : <Database className="h-4 w-4" />;
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
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Enter your address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="e.g. 42 Wallaby Way, Sydney NSW 2000"
                  className="pl-10 h-12 text-lg"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  data-testid="input-address"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-lg bg-gradient-brand"
              disabled={isChecking}
              data-testid="button-check"
            >
              {isChecking ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  Validating Address...
                </>
              ) : (
                "Check Availability"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Address Validated</AlertTitle>
            <AlertDescription>
              <div className="font-semibold mt-1">{result.normalizedAddress}</div>
              {result.suburb && result.state && (
                <div className="text-sm mt-1">
                  {result.suburb}, {result.state} {result.postcode}
                </div>
              )}
              <div className="text-xs mt-2 text-muted-foreground">
                Source: {getModeLabel(result.source)}
              </div>
            </AlertDescription>
          </Alert>

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
            <div className={`${
              result.available
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            } border rounded-xl p-6 mb-8 flex items-start gap-4`} data-testid="card-result">
              {result.available ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  result.available
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-orange-800 dark:text-orange-300'
                }`} data-testid="text-result-title">
                  {result.available ? "NBN Service Available" : "Limited Availability"}
                </h3>
                <div className={`mt-2 space-y-1 ${
                  result.available
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  {result.technology && (
                    <p className="text-sm">
                      <span className="font-semibold">Technology:</span> {result.technology}
                    </p>
                  )}
                  {result.maxTier && (
                    <p className="text-sm">
                      <span className="font-semibold">Maximum Tier:</span> {result.maxTier}
                    </p>
                  )}
                </div>
                <p className="text-xs mt-3 opacity-80">
                  Note: Final service qualification depends on NBN and wholesale provider checks at time of order.
                </p>
              </div>
            </div>
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
