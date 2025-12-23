import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Mail, AlertTriangle, FileText } from "lucide-react";

export default function Abuse() {
  return (
    <div className="container py-16 px-4 md:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-title">Report Abuse</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          BroNET is committed to maintaining a safe and lawful internet environment. 
          Use this page to report network abuse, spam, or other violations.
        </p>
      </div>

      <Alert className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Emergency Situations</AlertTitle>
        <AlertDescription>
          If you believe a crime is being committed or there is immediate danger, please contact 
          the police on <strong>000</strong> or Crime Stoppers on <strong>1800 333 000</strong>.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              How to Report Abuse
            </CardTitle>
            <CardDescription>
              Send your report to our abuse team for investigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Email</p>
              <p className="text-lg font-bold text-primary">abuse@brointernet.com</p>
            </div>
            <p className="text-muted-foreground">
              Please include as much detail as possible in your report:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Date and time of the incident (including timezone)</li>
              <li>IP address(es) involved</li>
              <li>Description of the abuse or violation</li>
              <li>Any relevant logs, headers, or evidence</li>
              <li>Your contact information for follow-up</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Types of Abuse We Handle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-medium">Network Abuse</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Denial of Service (DoS/DDoS) attacks</li>
                  <li>• Port scanning and network intrusion</li>
                  <li>• Unauthorized access attempts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Email Abuse</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Spam or unsolicited bulk email</li>
                  <li>• Phishing attempts</li>
                  <li>• Email header forgery</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Content Violations</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Copyright infringement (DMCA)</li>
                  <li>• Illegal content hosting</li>
                  <li>• Terms of Service violations</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Other Issues</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Malware distribution</li>
                  <li>• Botnet activity</li>
                  <li>• Fraudulent activity</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              We take all abuse reports seriously and aim to respond within:
            </p>
            <ul className="space-y-2">
              <li><strong>Critical issues</strong> (active attacks, illegal content): Within 4 hours</li>
              <li><strong>High priority</strong> (spam, phishing): Within 24 hours</li>
              <li><strong>Standard reports</strong> (general violations): Within 72 hours</li>
            </ul>
            <p className="text-sm mt-4">
              Please note that we may not be able to disclose the specific actions taken due to 
              privacy and legal considerations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal Requests</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3">
            <p>
              Law enforcement agencies and legal representatives should direct formal requests to:
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Legal Department</p>
              <p className="font-bold">legal@brointernet.com</p>
              <p className="text-sm mt-2">
                BroNET Pty Ltd<br />
                PO Box 12345<br />
                Sydney NSW 2000
              </p>
            </div>
            <p className="text-sm">
              We comply with all valid Australian legal processes and cooperate with law enforcement 
              agencies in accordance with the Telecommunications Act 1997.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
