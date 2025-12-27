import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface PlanProps {
  name: string;
  speed: number;
  upload: number;
  price: number;
  promoPrice?: number;
  typicalSpeed: string;
  typicalUpload?: string;
  isPopular?: boolean;
  tier?: 'basic' | 'power' | 'ultra';
  badge?: string;
  priceId?: string;
  disabled?: boolean;
  showSignup?: boolean;
  address?: string;
}

function getDownloadTime(speedMbps: number): string {
  const fileSizeGB = 4;
  const fileSizeMb = fileSizeGB * 8 * 1024;
  const seconds = fileSizeMb / speedMbps;
  
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
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

function getTierColor(tier?: string): string {
  switch (tier) {
    case 'basic':
      return 'bg-green-500';
    case 'power':
      return 'bg-red-500';
    case 'ultra':
      return 'bg-purple-600';
    default:
      return 'bg-primary';
  }
}

function getTierLabel(tier?: string): string {
  switch (tier) {
    case 'basic':
      return 'BASIC';
    case 'power':
      return 'POWER';
    case 'ultra':
      return 'ULTRA';
    default:
      return '';
  }
}

export function PlanCard({ 
  name, 
  speed, 
  upload, 
  price, 
  promoPrice,
  typicalSpeed, 
  typicalUpload,
  isPopular, 
  tier,
  badge,
  disabled, 
  showSignup,
  address
}: PlanProps) {
  const downloadTime = getDownloadTime(speed);
  const speedPercentage = getSpeedPercentage(speed);
  const hasPromo = promoPrice && promoPrice < price;
  const savings = hasPromo ? (price - promoPrice) * 6 : 0;

  const signupUrl = address 
    ? `/signup?plan=${encodeURIComponent(name)}&speed=${speed}&price=${price}&address=${encodeURIComponent(address)}`
    : `/signup?plan=${encodeURIComponent(name)}&speed=${speed}&price=${price}`;

  return (
    <Card className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary hover:border-2 border-border`}>
      {(tier || badge || isPopular) && (
        <div className={`flex items-center justify-between px-3 py-1.5 ${getTierColor(tier)} text-white text-xs font-bold uppercase tracking-wider`}>
          <span>{getTierLabel(tier)}</span>
          {(badge || isPopular) && (
            <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
              {badge || 'Most Popular'}
            </span>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2 pt-4">
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {speed <= 50 ? 'Light browsing and streaming' : 
           speed <= 100 ? 'Great for families and streaming' :
           speed <= 250 ? 'Multiple devices, gaming, 4K' :
           speed <= 1000 ? 'Heavy use, fast cloud access' :
           'Ultra-connected smart homes'}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pt-0">
        <div className="flex items-center gap-3 py-3 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Download</span>
            </div>
            <div className="text-2xl font-bold">{speed} <span className="text-sm font-normal text-muted-foreground">Mbps</span></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-[315deg]" />
              <span className="text-sm font-medium text-muted-foreground">Upload</span>
            </div>
            <div className="text-2xl font-bold">{upload} <span className="text-sm font-normal text-muted-foreground">Mbps</span></div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          {hasPromo ? (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">${promoPrice}</span>
                <span className="text-muted-foreground">/mth</span>
              </div>
              <p className="text-xs text-muted-foreground">
                For first 6 months then ${price}/mth ongoing
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Save ${savings} over 6 months
              </p>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">${price}</span>
              <span className="text-muted-foreground">/mth</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Typical evening speed</span>
            <span className="font-semibold">{typicalSpeed}{typicalUpload ? `/${typicalUpload}` : ''}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">4GB Ultra HD video</span>
            </div>
            <span className="font-semibold text-primary">{downloadTime}</span>
          </div>

          <div className="speed-bar mt-2">
            <div 
              className="speed-bar-fill" 
              style={{ width: `${speedPercentage}%` }}
            >
              <div className="speed-bar-flame" />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Featured inclusions</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>Unlimited Data</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>No Lock-in Contract</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span>BYO or add eero WiFi</span>
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
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
            className="w-full bg-gradient-brand border-0 hover:opacity-90" 
            size="lg" 
            asChild
            data-testid={`button-signup-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Link href={signupUrl}>
              Sign Up Now
              <ArrowRight className="ml-2 h-4 w-4" />
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
            <Link href="/plans">
              Check Address
            </Link>
          </Button>
        )}
      </CardFooter>
      
    </Card>
  );
}