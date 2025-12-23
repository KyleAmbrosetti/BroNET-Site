import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Wifi, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface PlanProps {
  name: string;
  speed: number;
  upload: number;
  price: number;
  typicalSpeed: string;
  isPopular?: boolean;
  priceId?: string;
  onSignup?: (priceId: string, planName: string) => Promise<void>;
}

export function PlanCard({ name, speed, upload, price, typicalSpeed, isPopular, priceId, onSignup }: PlanProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignup = async () => {
    if (!priceId || !onSignup) return;
    setIsLoading(true);
    try {
      await onSignup(priceId, name);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPopular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'}`}>
      {isPopular && (
        <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-center text-xs font-bold py-1 uppercase tracking-wider">
          Most Popular
        </div>
      )}
      <CardHeader className={`pb-4 ${isPopular ? 'pt-10' : 'pt-6'}`}>
        <CardTitle className="text-xl text-muted-foreground font-medium">{name}</CardTitle>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold font-heading">${price}</span>
          <span className="text-muted-foreground">/mo</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-3xl font-bold font-heading text-primary">{speed} Mbps</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mt-1">Download Speed</div>
        </div>
        
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <span>{upload} Mbps Upload</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <span>Unlimited Data</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <span>Typical Evening Speed: {typicalSpeed}</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <span>No Lock-in Contract</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="rounded-full bg-blue-100 p-1 dark:bg-blue-900/30">
              <Wifi className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span>BYO Modem or Add Ours</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        {priceId && onSignup ? (
          <Button 
            className={`w-full ${isPopular ? 'bg-gradient-brand border-0' : ''}`} 
            size="lg" 
            onClick={handleSignup}
            disabled={isLoading}
            data-testid={`button-signup-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Sign Up Now'
            )}
          </Button>
        ) : (
          <Button className={`w-full ${isPopular ? 'bg-gradient-brand border-0' : ''}`} size="lg" asChild>
            <Link href="/coverage">Check Availability</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}