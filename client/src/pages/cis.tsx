import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function CIS() {
  return (
    <div className="container py-16 px-4 md:px-6 max-w-5xl">
      <Alert className="mb-8 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-200">
          <strong>Demo Notice:</strong> This Critical Information Summary is for demonstration purposes only. All information is indicative and does not represent actual service offerings.
        </AlertDescription>
      </Alert>

      <h1 className="text-4xl font-bold tracking-tight mb-4">Critical Information Summary</h1>
      <p className="text-muted-foreground mb-8">BroNET NBN Internet Plans - Updated December 2025</p>

      <div className="space-y-8">
        {/* Provider Information */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Provider Name</p>
                <p className="text-muted-foreground">BroNET Pty Ltd</p>
              </div>
              <div>
                <p className="text-sm font-medium">ABN</p>
                <p className="text-muted-foreground">12 345 678 901</p>
              </div>
              <div>
                <p className="text-sm font-medium">Customer Service</p>
                <p className="text-muted-foreground">1300 BRO NET (1300 276 638)</p>
              </div>
              <div>
                <p className="text-sm font-medium">Support Hours</p>
                <p className="text-muted-foreground">8am - 8pm AEDT, 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* NBN 100 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                NBN 100
                <Badge variant="outline">Popular</Badge>
              </CardTitle>
              <CardDescription>Fast speeds for streaming and gaming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">$89<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Download Speed</p>
                  <p className="text-muted-foreground">Up to 100 Mbps</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Speed</p>
                  <p className="text-muted-foreground">Up to 20 Mbps</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Typical Evening Speed</p>
                  <p className="text-muted-foreground">85-95 Mbps (7pm-11pm)*</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data Allowance</p>
                  <p className="text-muted-foreground">Unlimited</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NBN 250 */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                NBN 250
                <Badge className="bg-gradient-brand text-white border-0">Best Value</Badge>
              </CardTitle>
              <CardDescription>Superfast for multiple users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">$109<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Download Speed</p>
                  <p className="text-muted-foreground">Up to 250 Mbps</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Speed</p>
                  <p className="text-muted-foreground">Up to 25 Mbps</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Typical Evening Speed</p>
                  <p className="text-muted-foreground">200-230 Mbps (7pm-11pm)*</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data Allowance</p>
                  <p className="text-muted-foreground">Unlimited</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NBN 1000 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                NBN 1000
                <Badge variant="secondary">Ultra</Badge>
              </CardTitle>
              <CardDescription>Maximum performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">$139<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Download Speed</p>
                  <p className="text-muted-foreground">Up to 1000 Mbps</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Speed</p>
                  <p className="text-muted-foreground">Up to 50 Mbps</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Typical Evening Speed</p>
                  <p className="text-muted-foreground">700-900 Mbps (7pm-11pm)*</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data Allowance</p>
                  <p className="text-muted-foreground">Unlimited</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract and Fees */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Terms and Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Minimum Contract Term</p>
                  <p className="text-muted-foreground">No lock-in (month-to-month)</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Early Termination Fee</p>
                  <p className="text-muted-foreground">None (standard plans)</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Connection Fee</p>
                  <p className="text-muted-foreground">$0 (waived on all plans)</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Notice Period for Cancellation</p>
                  <p className="text-muted-foreground">30 days</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Late Payment Fee</p>
                  <p className="text-muted-foreground">$15 per occurrence</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Billing Frequency</p>
                  <p className="text-muted-foreground">Monthly in advance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Requirements and Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">NBN Technology Types Supported</p>
              <p className="text-muted-foreground">FTTP, FTTC, FTTN, HFC, Fixed Wireless (speeds vary by technology)</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Modem/Router</p>
              <p className="text-muted-foreground mb-2">Not included. Bring Your Own (BYO) compatible modem or purchase eero 6+ router for $199.</p>
              <p className="text-sm text-muted-foreground">Required: VDSL2-compatible modem for FTTN/FTTC, standard router with WAN port for FTTP/HFC</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">IPv6 Support</p>
              <p className="text-muted-foreground">Available on all plans</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Static IP Address</p>
              <p className="text-muted-foreground">Available for $10/month additional</p>
            </div>
          </CardContent>
        </Card>

        {/* Support and Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Support and Complaints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Technical Support</p>
                <p className="text-muted-foreground">Phone: 1300 BRO NET, Email: support@brointernet.com</p>
                <p className="text-sm text-muted-foreground">Available 8am-8pm AEDT, 7 days per week</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fault Reporting</p>
                <p className="text-muted-foreground">Through customer portal or phone support</p>
                <p className="text-sm text-muted-foreground">Target response: Within 24 hours</p>
              </div>
              <div>
                <p className="text-sm font-medium">Complaints Handling</p>
                <p className="text-muted-foreground">Email: complaints@brointernet.com</p>
                <p className="text-sm text-muted-foreground">We aim to resolve complaints within 15 business days</p>
              </div>
              <div>
                <p className="text-sm font-medium">Telecommunications Industry Ombudsman (TIO)</p>
                <p className="text-muted-foreground">If you are not satisfied with our response, contact TIO:</p>
                <p className="text-sm text-muted-foreground">Phone: 1800 062 058 | Web: www.tio.com.au</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-900 dark:text-orange-200">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-900 dark:text-orange-200 space-y-3">
            <p className="text-sm">
              <strong>*Typical Evening Speeds:</strong> Based on download speeds between 7pm-11pm. Actual speeds may vary depending on your NBN technology type, network congestion, and home setup.
            </p>
            <p className="text-sm">
              <strong>Service Availability:</strong> Subject to NBN infrastructure at your address. Check coverage at bronet.com.au/coverage
            </p>
            <p className="text-sm">
              <strong>Network Management:</strong> We may implement traffic management during peak periods to ensure fair access for all customers.
            </p>
            <p className="text-sm">
              <strong>Price Changes:</strong> We will provide 30 days' written notice of any price increases.
            </p>
            <p className="text-sm">
              <strong>Australian Consumer Law:</strong> Our services come with guarantees that cannot be excluded under Australian Consumer Law.
            </p>
            <p className="text-sm">
              <strong>Full Terms:</strong> Complete Terms of Service available at bronet.com.au/terms
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>This Critical Information Summary was prepared in accordance with the Telecommunications Consumer Protections Code.</p>
          <p className="mt-2">BroNET Pty Ltd | ABN 12 345 678 901 | Version 1.0 | December 2025</p>
        </div>
      </div>
    </div>
  );
}
