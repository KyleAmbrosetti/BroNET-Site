import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Wifi } from "lucide-react";
import { Link } from "wouter";

interface PlanProps {
  name: string;
  speed: number;
  upload: number;
  price: number;
  typicalSpeed: string;
  isPopular?: boolean;
  priceId?: string;
  disabled?: boolean;
  showSignup?: boolean;
}

function getDownloadTime(speedMbps: number): string {
  const fileSizeGB = 4;
  const fileSizeMb = fileSizeGB * 8 * 1024;
  const seconds = fileSizeMb / speedMbps;
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
}

function getSpeedPercentage(speed: number): number {
  const maxSpeed = 2000;
  return Math.min((speed / maxSpeed) * 100, 100);
}

export function PlanCard({ name, speed, upload, price, typicalSpeed, isPopular, disabled, showSignup }: PlanProps) {
  const downloadTime = getDownloadTime(speed);
  const speedPercentage = getSpeedPercentage(speed);
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
        
        <div className="px-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">4GB Ultra HD video</span>
            <span className="text-sm font-bold text-primary">{downloadTime}</span>
          </div>
          <div className="speed-bar">
            <div 
              className="speed-bar-fill" 
              style={{ width: `${speedPercentage}%` }}
            >
              <div className="speed-bar-flame" />
            </div>
          </div>
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
        {disabled ? (
          <Button 
            className="w-full" 
            size="lg" 
            disabled
            variant="secondary"
            data-testid={`button-unavailable-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            Not Available
          </Button>
        ) : showSignup ? (
          <Button 
            className={`w-full ${isPopular ? 'bg-gradient-brand border-0' : ''}`} 
            size="lg" 
            asChild
            data-testid={`button-signup-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Link href={`/signup?plan=${encodeURIComponent(name)}`}>
              Sign Up Now
            </Link>
          </Button>
        ) : (
          <Button 
            className="w-full" 
            size="lg" 
            variant="outline"
            asChild
            data-testid={`button-check-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Link href="/signup">
              Check Address First
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}