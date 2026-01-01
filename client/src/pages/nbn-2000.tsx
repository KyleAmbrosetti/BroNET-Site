import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Zap, 
  Rocket, 
  Gamepad2, 
  Video, 
  Users, 
  Wifi, 
  Check, 
  ArrowRight,
  Download,
  Upload,
  Clock
} from "lucide-react";

export default function Nbn2000() {
  const features = [
    {
      icon: Gamepad2,
      title: "Ultra-Low Latency Gaming",
      description: "Competitive gaming with virtually no lag. Perfect for esports and fast-paced multiplayer games."
    },
    {
      icon: Video,
      title: "8K Streaming Ready",
      description: "Stream multiple 8K videos simultaneously without buffering. The future of entertainment is here."
    },
    {
      icon: Users,
      title: "Whole-Home Coverage",
      description: "Connect 50+ devices without slowdowns. Perfect for smart homes and large families."
    },
    {
      icon: Download,
      title: "Instant Downloads",
      description: "Download a 50GB game in under 4 minutes. Large files transfer in seconds, not hours."
    },
    {
      icon: Upload,
      title: "Creator-Grade Upload",
      description: "500 Mbps upload speed for content creators, streamers, and work-from-home professionals."
    },
    {
      icon: Wifi,
      title: "Wi-Fi 7 Compatible",
      description: "Pair with our eero Max 7 mesh system for maximum wireless performance throughout your home."
    }
  ];

  const useCases = [
    { title: "Remote Work", desc: "Crystal-clear video calls while family streams 4K" },
    { title: "Content Creation", desc: "Upload videos to YouTube in minutes, not hours" },
    { title: "Cloud Gaming", desc: "Xbox Cloud, GeForce NOW, PS Remote Play with zero lag" },
    { title: "Smart Home", desc: "Connect all your IoT devices without affecting performance" },
    { title: "Home Server", desc: "Run your own media server or home automation hub" },
    { title: "Large Family", desc: "Everyone online doing their thing, no compromises" }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-purple-500/10 py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6" data-testid="badge-new-plan">
              <Zap className="h-4 w-4" />
              Australia's Fastest Home Internet
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6" data-testid="heading-nbn-2000">
              NBN <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">2000</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl" data-testid="text-tagline">
              Experience internet speeds up to 2000 Mbps. The ultimate connection for gamers, creators, and power users.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent" data-testid="text-price">
                  $155
                </div>
                <div className="text-muted-foreground font-medium">/month</div>
              </div>
              
              <div className="hidden sm:block h-20 w-px bg-border" />
              
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-bold">2000 Mbps</div>
                    <div className="text-xs text-muted-foreground">Download</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-bold">500 Mbps</div>
                    <div className="text-xs text-muted-foreground">Upload</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-bold">1800 Mbps</div>
                    <div className="text-xs text-muted-foreground">Typical Evening</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-bold">FTTP Only</div>
                    <div className="text-xs text-muted-foreground">Full Fibre</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-brand border-0 text-lg px-8" asChild data-testid="button-check-availability">
                <Link href="/coverage">
                  Check Availability
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild data-testid="button-view-all-plans">
                <Link href="/plans">Compare All Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-features">
              Why Choose NBN 2000?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The fastest residential internet available in Australia, designed for demanding users who won't settle for less.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" data-testid="heading-perfect-for">
                Perfect For Every Power User
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Whether you're a professional working from home, a content creator, or a family of heavy internet users, NBN 2000 delivers the performance you need.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-start gap-3" data-testid={`use-case-${index}`}>
                    <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30 mt-0.5">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold">{useCase.title}</div>
                      <div className="text-sm text-muted-foreground">{useCase.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                    <Zap className="h-4 w-4" />
                    Best Value
                  </div>
                  <h3 className="text-2xl font-bold mb-2">NBN 2000</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold" data-testid="text-price-card">$155</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>2000 Mbps Download Speed</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>500 Mbps Upload Speed</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Unlimited Data</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>No Lock-in Contract</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Australian Support Team</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span>Free Standard Activation</span>
                  </li>
                </ul>
                
                <Button className="w-full bg-gradient-brand border-0" size="lg" asChild data-testid="button-get-started">
                  <Link href="/coverage">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-primary to-purple-600 text-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="heading-cta">
            Ready for Australia's Fastest Internet?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Check if NBN 2000 is available at your address. FTTP connection required.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild data-testid="button-check-address">
            <Link href="/coverage">
              Check Your Address
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold mb-8 text-center" data-testid="heading-faq">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-background rounded-lg p-6 shadow-sm" data-testid="faq-1">
              <h3 className="font-semibold mb-2">What connection type do I need for NBN 2000?</h3>
              <p className="text-muted-foreground">
                NBN 2000 requires a Fibre to the Premises (FTTP) connection. This is the only NBN technology capable of delivering speeds up to 2000 Mbps. Check your address on our coverage page to see if FTTP is available.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm" data-testid="faq-2">
              <h3 className="font-semibold mb-2">Do I need a special modem?</h3>
              <p className="text-muted-foreground">
                Yes, you'll need a modem/router capable of handling 2 Gbps speeds. We recommend the eero Max 7 mesh system available on our modems page, which is fully certified for NBN 2000.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm" data-testid="faq-3">
              <h3 className="font-semibold mb-2">What's the typical evening speed?</h3>
              <p className="text-muted-foreground">
                Our typical evening speed for NBN 2000 is 1800 Mbps during the busy hours of 7pm-11pm. This is measured across our network and represents what most customers can expect.
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm" data-testid="faq-4">
              <h3 className="font-semibold mb-2">Can I upgrade from my current plan?</h3>
              <p className="text-muted-foreground">
                Absolutely! If you're an existing BroNET customer with FTTP, you can upgrade to NBN 2000 anytime through your dashboard. There are no upgrade fees and no lock-in contracts.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
