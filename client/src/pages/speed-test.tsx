import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function SpeedTest() {
  const [testStarted, setTestStarted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">
              <Activity className="h-3 w-3 mr-1" />
              Internet Speed Test
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">BroNET</span> Speed Test
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test your internet connection speed. Check your download, upload, and ping to ensure you're getting the speeds you're paying for.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 overflow-hidden">
              <CardContent className="p-0">
                {!testStarted ? (
                  <div className="flex flex-col items-center justify-center py-20 px-8">
                    <div className="w-48 h-48 rounded-full border-8 border-primary/20 flex items-center justify-center mb-8">
                      <Button 
                        size="lg" 
                        className="rounded-full w-36 h-36 text-xl bg-gradient-brand hover:opacity-90"
                        onClick={() => setTestStarted(true)}
                        data-testid="button-start-test"
                      >
                        <span className="flex flex-col items-center">
                          <Activity className="h-10 w-10 mb-2" />
                          START
                        </span>
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-center max-w-md">
                      Click START to measure your internet connection speed. The test typically takes 30-60 seconds.
                    </p>
                  </div>
                ) : (
                  <iframe 
                    src="https://openspeedtest.com/Get-widget.php" 
                    width="100%" 
                    height="600" 
                    frameBorder="0"
                    className="w-full"
                    title="BroNET Speed Test"
                    data-testid="speedtest-iframe"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  />
                )}
              </CardContent>
            </Card>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Ping / Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Measures how quickly data travels between your device and the server. Lower is better for gaming and video calls.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Speed
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
                    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Speed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    How fast you can send data to the internet. Essential for video conferencing, cloud backups, and streaming.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
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
                  href="https://openspeedtest.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  OpenSpeedTest
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
