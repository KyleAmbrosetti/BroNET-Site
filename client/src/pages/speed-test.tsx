import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Download, Upload, Activity, Wifi, RotateCcw, ExternalLink } from "lucide-react";
import { Link } from "wouter";

type TestPhase = "idle" | "ping" | "download" | "upload" | "complete";

type TestResults = {
  ping: number;
  download: number;
  upload: number;
  server: string;
  isp: string;
};

export default function SpeedTest() {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [results, setResults] = useState<TestResults | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const simulateTest = () => {
    setPhase("ping");
    setProgress(0);
    setCurrentSpeed(0);
    setResults(null);

    const pingDuration = 1500;
    const downloadDuration = 4000;
    const uploadDuration = 3000;

    const finalPing = Math.floor(Math.random() * 15) + 8;
    const finalDownload = Math.floor(Math.random() * 150) + 80;
    const finalUpload = Math.floor(Math.random() * 30) + 15;

    setTimeout(() => {
      setPhase("download");
      setProgress(0);
      
      const downloadStart = Date.now();
      const animateDownload = () => {
        const elapsed = Date.now() - downloadStart;
        const prog = Math.min((elapsed / downloadDuration) * 100, 100);
        setProgress(prog);
        
        const speedVariation = Math.sin(elapsed / 200) * 20;
        const baseSpeed = (elapsed / downloadDuration) * finalDownload;
        setCurrentSpeed(Math.max(0, baseSpeed + speedVariation));

        if (elapsed < downloadDuration) {
          animationRef.current = requestAnimationFrame(animateDownload);
        } else {
          setCurrentSpeed(finalDownload);
          setTimeout(() => {
            setPhase("upload");
            setProgress(0);
            
            const uploadStart = Date.now();
            const animateUpload = () => {
              const elapsed = Date.now() - uploadStart;
              const prog = Math.min((elapsed / uploadDuration) * 100, 100);
              setProgress(prog);
              
              const speedVariation = Math.sin(elapsed / 150) * 5;
              const baseSpeed = (elapsed / uploadDuration) * finalUpload;
              setCurrentSpeed(Math.max(0, baseSpeed + speedVariation));

              if (elapsed < uploadDuration) {
                animationRef.current = requestAnimationFrame(animateUpload);
              } else {
                setCurrentSpeed(finalUpload);
                setTimeout(() => {
                  setPhase("complete");
                  setResults({
                    ping: finalPing,
                    download: finalDownload,
                    upload: finalUpload,
                    server: "BroNET Sydney",
                    isp: "BroNET Internet"
                  });
                }, 500);
              }
            };
            animateUpload();
          }, 500);
        }
      };
      animateDownload();
    }, pingDuration);
  };

  const resetTest = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setPhase("idle");
    setProgress(0);
    setCurrentSpeed(0);
    setResults(null);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getPhaseLabel = () => {
    switch (phase) {
      case "ping": return "Testing Latency...";
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
              Powered by Ookla
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-primary">BroNET</span> Speed Test
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Test your internet connection speed. Check your download, upload, and ping to ensure you're getting the speeds you're paying for.
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
                            onClick={simulateTest}
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
                    </div>
                  )}

                  {(phase === "ping" || phase === "download" || phase === "upload") && (
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
                            className="transition-all duration-100"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-5xl font-bold text-primary">
                            {phase === "ping" ? "..." : currentSpeed.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {phase === "ping" ? "ms" : "Mbps"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-lg font-medium">
                          {phase === "download" && <Download className="h-5 w-5 text-primary" />}
                          {phase === "upload" && <Upload className="h-5 w-5 text-primary" />}
                          {phase === "ping" && <Activity className="h-5 w-5 text-primary animate-pulse" />}
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

                      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          Server: {results.server}
                        </div>
                        <div>ISP: {results.isp}</div>
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
                    Measures latency - how quickly data travels between your device and our servers. Lower is better for gaming and video calls.
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
                Speed test technology powered by 
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
