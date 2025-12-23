import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Download, Upload, Activity, Wifi, RotateCcw, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import SpeedTest from "@cloudflare/speedtest";

type TestPhase = "idle" | "latency" | "download" | "upload" | "complete";

type TestResults = {
  ping: number;
  download: number;
  upload: number;
  jitter: number;
};

export default function SpeedTestPage() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentPing, setCurrentPing] = useState(0);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const speedTestRef = useRef<SpeedTest | null>(null);

  const startTest = useCallback(() => {
    setPhase("latency");
    setProgress(0);
    setCurrentSpeed(0);
    setCurrentPing(0);
    setResults(null);
    setError(null);

    try {
      const test = new SpeedTest({
        autoStart: true,
      });

      speedTestRef.current = test;

      test.onResultsChange = ({ type }: { type: string }) => {
        if (type === "latency") {
          setPhase("latency");
          const latency = test.results.getUnloadedLatency();
          if (latency) {
            setCurrentPing(latency);
          }
          setProgress(20);
        } else if (type === "download") {
          setPhase("download");
          const bandwidth = test.results.getDownloadBandwidth();
          if (bandwidth) {
            setCurrentSpeed(bandwidth / 1000000);
          }
          setProgress((prev) => Math.min(prev + 5, 60));
        } else if (type === "upload") {
          setPhase("upload");
          const bandwidth = test.results.getUploadBandwidth();
          if (bandwidth) {
            setCurrentSpeed(bandwidth / 1000000);
          }
          setProgress((prev) => Math.min(prev + 5, 95));
        }
      };

      test.onFinish = (results: any) => {
        const summary = results.getSummary();
        setPhase("complete");
        setProgress(100);
        const downloadMbps = typeof summary.download === 'number' 
          ? (summary.download > 10000 ? Math.round(summary.download / 1000000) : Math.round(summary.download))
          : 0;
        const uploadMbps = typeof summary.upload === 'number'
          ? (summary.upload > 10000 ? Math.round(summary.upload / 1000000) : Math.round(summary.upload))
          : 0;
        setResults({
          ping: Math.round(summary.latency || 0),
          download: downloadMbps,
          upload: uploadMbps,
          jitter: summary.jitter || 0,
        });
      };

      test.onError = (err: string) => {
        console.error("Speed test error:", err);
        setError("Speed test failed. Please try again.");
        setPhase("idle");
      };
    } catch (err) {
      console.error("Failed to start speed test:", err);
      setError("Failed to start speed test. Please try again.");
      setPhase("idle");
    }
  }, []);

  const resetTest = useCallback(() => {
    if (speedTestRef.current) {
      try {
        speedTestRef.current.pause();
      } catch (e) {}
      speedTestRef.current = null;
    }
    setPhase("idle");
    setProgress(0);
    setCurrentSpeed(0);
    setCurrentPing(0);
    setResults(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (speedTestRef.current) {
        try {
          speedTestRef.current.pause();
        } catch (e) {}
      }
    };
  }, []);

  const getPhaseLabel = () => {
    switch (phase) {
      case "latency": return "Testing Latency...";
      case "download": return "Testing Download Speed...";
      case "upload": return "Testing Upload Speed...";
      case "complete": return "Test Complete";
      default: return "Ready to Test";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Activity className="h-3 w-3 mr-1" />
              Powered by Cloudflare
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">BroNET</span> Speed Test
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test your internet connection speed against Cloudflare's global network. Check your download, upload, and latency.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-2">
              <CardContent className="p-8 md:p-12">
                <div className="text-center">
                  {phase === "idle" && (
                    <div className="space-y-8">
                      <div className="relative w-64 h-64 mx-auto">
                        <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button 
                            size="lg" 
                            className="rounded-full w-32 h-32 text-lg bg-gradient-brand hover:opacity-90"
                            onClick={startTest}
                            data-testid="button-start-test"
                          >
                            <span className="flex flex-col items-center">
                              <Zap className="h-8 w-8 mb-1" />
                              GO
                            </span>
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground">Click to start your speed test</p>
                      {error && (
                        <p className="text-destructive text-sm">{error}</p>
                      )}
                    </div>
                  )}

                  {(phase === "latency" || phase === "download" || phase === "upload") && (
                    <div className="space-y-8">
                      <div className="relative w-64 h-64 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${progress * 2.83} 283`}
                            className="transition-all duration-300"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" />
                              <stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-5xl font-bold text-primary">
                            {phase === "latency" 
                              ? (currentPing > 0 ? currentPing.toFixed(0) : "...") 
                              : currentSpeed.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {phase === "latency" ? "ms" : "Mbps"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-lg font-medium">
                          {phase === "download" && <Download className="h-5 w-5 text-primary" />}
                          {phase === "upload" && <Upload className="h-5 w-5 text-primary" />}
                          {phase === "latency" && <Activity className="h-5 w-5 text-primary animate-pulse" />}
                          {getPhaseLabel()}
                        </div>
                        <Progress value={progress} className="h-2 max-w-xs mx-auto" />
                      </div>
                    </div>
                  )}

                  {phase === "complete" && results && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-3 gap-4 md:gap-8">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                            <Activity className="h-4 w-4" />
                            PING
                          </div>
                          <div className="text-4xl md:text-5xl font-bold" data-testid="result-ping">
                            {results.ping}
                          </div>
                          <div className="text-sm text-muted-foreground">ms</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                            <Download className="h-4 w-4" />
                            DOWNLOAD
                          </div>
                          <div className="text-4xl md:text-5xl font-bold text-primary" data-testid="result-download">
                            {results.download}
                          </div>
                          <div className="text-sm text-muted-foreground">Mbps</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                            <Upload className="h-4 w-4" />
                            UPLOAD
                          </div>
                          <div className="text-4xl md:text-5xl font-bold" data-testid="result-upload">
                            {results.upload}
                          </div>
                          <div className="text-sm text-muted-foreground">Mbps</div>
                        </div>
                      </div>

                      {results.jitter > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Jitter: {results.jitter.toFixed(1)} ms
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          Tested against Cloudflare's global network
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={resetTest}
                        className="gap-2"
                        data-testid="button-test-again"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Test Again
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
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

            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-orange-500/10 border-primary/20">
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
                  href="https://speed.cloudflare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Cloudflare
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
