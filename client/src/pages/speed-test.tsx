import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Download, Upload, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function SpeedTest() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-6">
            <Badge variant="outline" className="mb-4">
              <Activity className="h-3 w-3 mr-1" />
              Powered by Ookla
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">BroNET</span> Speed Test
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test your internet connection speed. Check your download, upload, and ping to ensure you're getting the speeds you're paying for.
            </p>
          </div>

          <div className="w-full">
            <div className="bg-black py-8 -mx-4 md:-mx-6 px-4 md:px-6">
              <div className="max-w-5xl mx-auto">
                <iframe 
                  width="100%" 
                  height="650" 
                  frameBorder="0" 
                  src="https://brointernet.speedtestcustom.com"
                  title="BroNET Speed Test powered by Ookla"
                  data-testid="speedtest-iframe"
                  className="w-full"
                  style={{ minHeight: "650px", border: "none" }}
                />
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Speed test not loading? Open it directly:
              </p>
              <Button variant="outline" asChild>
                <a 
                  href="https://brointernet.speedtestcustom.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  Open Speed Test
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Ping
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Measures latency - how quickly data travels between your device and the server. Lower is better for gaming and video calls.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Download
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    How fast you can pull data from the internet. Important for streaming, downloading files, and browsing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    How fast you can send data to the internet. Essential for video conferencing, cloud backups, and streaming content.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Not getting the speeds you expected?</h3>
                    <p className="text-muted-foreground">
                      Check out our plans or contact support if you need help optimizing your connection.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" asChild>
                      <Link href="/support">Get Help</Link>
                    </Button>
                    <Button className="bg-gradient-brand" asChild>
                      <Link href="/plans">View Plans</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-1">
                Speed test powered by 
                <a 
                  href="https://www.speedtest.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Ookla Speedtest
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
