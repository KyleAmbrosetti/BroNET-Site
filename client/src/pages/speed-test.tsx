import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Download, Upload, Gauge, BarChart3, Zap, ExternalLink, Award } from "lucide-react";
import { Link } from "wouter";

export default function SpeedTest() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Black background */}
      <div className="w-full bg-black text-white">
        <div className="container px-4 md:px-6 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-gradient-brand">BroNET</span> Speed Test
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-4">
              Check your internet speed
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              When you want to know that you're getting the broadband speeds you expect, simply run a BroNET speed test and find out in seconds!
            </p>
          </div>

          {/* Speed Test Embed */}
          <div className="max-w-4xl mx-auto">
            <iframe 
              width="100%" 
              height="650" 
              frameBorder="0" 
              src="https://brointernet.speedtestcustom.com"
              title="BroNET Speed Test powered by Ookla"
              data-testid="speedtest-iframe"
              className="w-full rounded-lg"
              style={{ minHeight: "650px", border: "none" }}
            />
            <p className="text-center text-gray-500 text-sm mt-4">
              All trademarks of Ookla, LLC, including Speedtest®, are used under license.
            </p>
          </div>

          {/* Fallback link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Speed test not loading?
            </p>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800" asChild>
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
        </div>
      </div>

      {/* Award Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <Award className="h-10 w-10 text-primary" />
            <p className="text-xl md:text-2xl font-semibold">
              <span className="text-gradient-brand">BroNET</span> - <span className="text-primary">Lightning fast</span> NBN for Aussie legends
            </p>
          </div>
        </div>
      </div>

      {/* How is a speed test measured? */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How is a speed test measured?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Download speed</h3>
                <p className="text-sm text-muted-foreground">
                  Measured in megabits per second (Mbps), download speed indicates how quickly data can be pulled from a server to your device.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Upload speed</h3>
                <p className="text-sm text-muted-foreground">
                  Upload speed is measured by how quickly data travels from your device to the internet. Important for video calls and cloud backups.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Ping</h3>
                <p className="text-sm text-muted-foreground">
                  Like a reflex test, ping checks how quickly your connection responds. Lower ping means a faster experience for gaming and video calls.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Jitter</h3>
                <p className="text-sm text-muted-foreground">
                  Jitter measures how stable your connection is. Lower jitter means a smoother connection, ideal for streaming and video calls.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gauge className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Mbps</h3>
                <p className="text-sm text-muted-foreground">
                  Mbps, or megabits per second, is the speed at which data travels to and from your device. The higher the Mbps, the better!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why is running a speed test important? */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Why is running a speed test important?
                </h2>
                <p className="text-muted-foreground mb-4">
                  Aside from glitchy video and sound, or lagging gameplay, how else will you know if you're getting the speeds you're paying for?
                </p>
                <p className="text-muted-foreground mb-6">
                  We suggest running tests at different times of the day to see if there are specific dropouts at certain times... like in the evening when everyone's streaming.
                </p>
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex gap-3">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">
                      <strong>Pro tip:</strong> The ACCC introduced 'typical evening speeds' to help customers understand real-world performance when everyone is home and using the internet.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl p-8 text-center">
                <Gauge className="h-20 w-20 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">Test regularly</h3>
                <p className="text-muted-foreground">
                  Run speed tests morning, afternoon, and evening to get a complete picture of your connection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What can affect internet speed? */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            What can affect internet speed?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            If your internet speeds aren't what you were expecting, here are some things that may be causing issues.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Connection type", desc: "Cable connections are always faster and more stable than Wi-Fi." },
              { title: "Device age", desc: "Older devices may have slower processors that can bottleneck your connection." },
              { title: "Network traffic", desc: "More devices and users on your network means slower speeds for everyone." },
              { title: "Your modem", desc: "Modem age and location can affect speeds. Newer equipment = faster connection." },
              { title: "Ethernet cables", desc: "Cat5 cables support up to 100Mbps, while Cat6 cables support up to 1Gbps+." },
              { title: "Background apps", desc: "Apps running in the background may be using bandwidth without you knowing." },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Not getting the speeds you expected?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Check out our high-speed NBN plans or contact support if you need help optimizing your connection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="border-gray-600 text-white hover:bg-gray-800" asChild>
                <Link href="/support">Get Help</Link>
              </Button>
              <Button size="lg" className="bg-gradient-brand border-0" asChild>
                <Link href="/plans">View NBN Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer attribution */}
      <div className="py-6 text-center text-sm text-muted-foreground border-t">
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
  );
}
