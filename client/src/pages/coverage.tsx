import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Coverage() {
  const [address, setAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<null | "available" | "unavailable">(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    
    setIsChecking(true);
    setResult(null);
    
    // Mock network request
    setTimeout(() => {
      setIsChecking(false);
      // Randomly succeed for demo purposes
      setResult("available");
    }, 1500);
  };

  return (
    <div className="container py-16 px-4 md:px-6">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Check Availability</h1>
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
                  placeholder="e.g. 42 Wallaby Way, Sydney" 
                  className="pl-10 h-12 text-lg"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Household Size (Optional)</Label>
              <Select>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 People (Light usage)</SelectItem>
                  <SelectItem value="3-4">3-4 People (Streaming/Gaming)</SelectItem>
                  <SelectItem value="5+">5+ People (Heavy usage)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="lg" className="w-full h-12 text-lg bg-gradient-brand" disabled={isChecking}>
              {isChecking ? "Checking NBN Database..." : "Check Availability"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result === "available" && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8 flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg text-green-800 dark:text-green-300">Great news! You're connected.</h3>
              <p className="text-green-700 dark:text-green-400 mt-1">
                Your premises at <span className="font-semibold">{address}</span> is ready for <strong>NBN FTTP</strong> (Fibre to the Premises).
                You can access speeds up to 2000Mbps!
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-6 text-center">Recommended for you</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="border rounded-xl p-6 bg-card relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                 BEST VALUE
               </div>
               <h4 className="font-bold text-lg">NBN 100</h4>
               <div className="text-3xl font-bold my-2">$89<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
               <p className="text-sm text-muted-foreground mb-4">Perfect for 3-4 people streaming in 4K.</p>
               <Button className="w-full" asChild>
                 <Link href="/auth?plan=nbn100">Select Plan</Link>
               </Button>
             </div>
             
             <div className="border rounded-xl p-6 bg-card relative overflow-hidden border-purple-500/50">
               <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                 FASTEST
               </div>
               <h4 className="font-bold text-lg">NBN 1000</h4>
               <div className="text-3xl font-bold my-2">$129<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
               <p className="text-sm text-muted-foreground mb-4">Ultimate speed for gamers and heavy downloaders.</p>
               <Button className="w-full bg-gradient-brand" asChild>
                 <Link href="/auth?plan=nbn1000">Select Plan</Link>
               </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}