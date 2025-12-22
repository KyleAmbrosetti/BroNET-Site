import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, MapPin, CheckCircle2, AlertCircle, Settings, Info, History } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";

type CoverageResult = {
  address: string;
  technology: string;
  maxSpeed: string;
  available: boolean;
};

type CoverageCheck = {
  id: string;
  address: string;
  technology: string | null;
  maxSpeed: string | null;
  available: number;
  createdAt: string;
};

export default function Coverage() {
  const [address, setAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [history, setHistory] = useState<CoverageCheck[]>([]);
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    // Check if API is configured
    const checkStatus = async () => {
      const { data } = await api.getCoverageStatus();
      if (data) {
        setIsConfigured(data.configured);
      }
    };
    checkStatus();

    // Load history if logged in
    if (user) {
      loadHistory();
    }
  }, [user]);

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
        description: "Please enter a valid address",
        variant: "destructive" 
      });
      return;
    }

    setIsChecking(true);
    setResult(null);

    const { data, error } = await api.checkCoverage(address);

    setIsChecking(false);

    if (error) {
      toast({ 
        title: "Check failed", 
        description: error,
        variant: "destructive" 
      });
      return;
    }

    if (data && data.success) {
      setResult(data.result);
      if (user) {
        loadHistory();
      }
      toast({ title: "Coverage check complete" });
    }
  };

  if (isConfigured === false) {
    return (
      <div className="container py-16 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 mb-8">
            <Settings className="h-4 w-4" />
            <AlertTitle>Coverage API Not Configured</AlertTitle>
            <AlertDescription>
              The live coverage checker requires API credentials to be configured.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>
                To enable real-time address and coverage checking, configure the following environment variables in your Replit project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Required Environment Variables</h3>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex items-start gap-2">
                      <div className="bg-background px-2 py-1 rounded flex-shrink-0">
                        <code className="text-primary">COVERAGE_API_URL</code>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        The endpoint URL for your coverage/address validation API
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="bg-background px-2 py-1 rounded flex-shrink-0">
                        <code className="text-primary">COVERAGE_API_KEY</code>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        Your API key or bearer token for authentication
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-4 rounded">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to Set in Replit
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Open the <strong>Secrets</strong> tab in the Tools panel (left sidebar)</li>
                    <li>Click <strong>+ New Secret</strong></li>
                    <li>Add <code className="bg-muted px-1 rounded">COVERAGE_API_URL</code> with your API endpoint</li>
                    <li>Add <code className="bg-muted px-1 rounded">COVERAGE_API_KEY</code> with your API key</li>
                    <li>The app will automatically restart and detect the configuration</li>
                  </ol>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2 text-sm">Expected API Format</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your API should accept POST requests with this format:
                  </p>
                  <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`POST {COVERAGE_API_URL}
Headers:
  Content-Type: application/json
  Authorization: Bearer {COVERAGE_API_KEY}

Body:
{
  "address": "42 Wallaby Way, Sydney NSW 2000"
}

Response:
{
  "standardizedAddress": "42 Wallaby Way, Sydney NSW 2000",
  "technology": "FTTP",
  "maxSpeed": "1000Mbps",
  "available": true
}`}
                  </pre>
                </div>
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
                data-testid="button-refresh"
              >
                Refresh Page After Configuration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 px-4 md:px-6">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-title">Check Availability</h1>
        <p className="text-muted-foreground">
          See what technology is available at your premises and get the best plan recommendations.
        </p>
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
                  Checking Coverage...
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
            <div>
              <h3 className={`font-bold text-lg ${
                result.available 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-orange-800 dark:text-orange-300'
              }`} data-testid="text-result-title">
                {result.available ? "Great news! NBN is available." : "Limited availability"}
              </h3>
              <p className={`mt-1 ${
                result.available 
                  ? 'text-green-700 dark:text-green-400' 
                  : 'text-orange-700 dark:text-orange-400'
              }`} data-testid="text-result-description">
                Your premises at <span className="font-semibold">{result.address}</span> has{' '}
                <strong>{result.technology}</strong> technology available.
                {result.maxSpeed && ` Maximum speed: ${result.maxSpeed}.`}
              </p>
            </div>
          </div>

          {result.available && (
            <>
              <h3 className="text-2xl font-bold mb-6 text-center">Recommended for you</h3>
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
                      <p className="font-medium text-sm">{check.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {check.technology || 'Unknown'} • {check.maxSpeed || 'Unknown speed'} • {format(new Date(check.createdAt), 'PPp')}
                      </p>
                    </div>
                    <div>
                      {check.available === 1 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
