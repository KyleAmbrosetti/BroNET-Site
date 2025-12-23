import { PlanCard } from "@/components/plan-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Plans() {
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

  return (
    <div className="container py-16 px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing</h1>
        <p className="text-muted-foreground text-lg">
          No hidden fees, no lock-in contracts. Just fast internet at a fair price.
          Change your plan anytime in the portal.
        </p>
      </div>

      {/* Fibre/Cable Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-center">NBN Fibre & Cable Plans</h2>
        <p className="text-muted-foreground text-center mb-8">For FTTP, FTTC, FTTB, FTTN & HFC connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-24">
        {plans.map((plan) => (
          <PlanCard
            key={plan.name}
            name={plan.name}
            speed={plan.speed}
            upload={plan.upload}
            price={plan.price}
            typicalSpeed={plan.typical}
            isPopular={plan.popular}
          />
        ))}
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
        {fixedWirelessPlans.map((plan) => (
          <PlanCard
            key={plan.name}
            name={plan.name}
            speed={plan.speed}
            upload={plan.upload}
            price={plan.price}
            typicalSpeed={plan.typical}
            isPopular={plan.popular}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">Plan Comparison</h2>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">Feature</TableHead>
                <TableHead className="text-center">NBN 50</TableHead>
                <TableHead className="text-center">NBN 100</TableHead>
                <TableHead className="text-center">NBN 250+</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Unlimited Data</TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Typical Evening Speed</TableCell>
                <TableCell className="text-center">50 Mbps</TableCell>
                <TableCell className="text-center">98 Mbps</TableCell>
                <TableCell className="text-center">245 - 850 Mbps</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Australian Support</TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Static IP Included</TableCell>
                <TableCell className="text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></TableCell>
                <TableCell className="text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Priority Support</TableCell>
                <TableCell className="text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></TableCell>
                <TableCell className="text-center"><X className="h-4 w-4 mx-auto text-muted-foreground" /></TableCell>
                <TableCell className="text-center"><Check className="h-4 w-4 mx-auto text-green-500" /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-6 text-center">
          * Typical evening speeds are based on average throughput during peak hours (7pm-11pm). 
          Actual speeds may vary due to NBN technology type, equipment, and network congestion.
          Pricing is subject to change.
        </p>
      </div>
    </div>
  );
}