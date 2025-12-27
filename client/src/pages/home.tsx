import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/plan-card";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap,
  Lock, 
  Laptop,
  Headphones,
  Home as HomeIcon,
  Building2,
  Wifi,
  Smartphone,
  Gauge,
  ArrowRight,
  Check
} from "lucide-react";
import fiberBg from "@assets/generated_images/abstract_blue-purple_fiber_optic_waves_background.png";
import promoBanner from "@assets/generated_images/internet_speed_promo_banner.png";
import familyImage from "@assets/generated_images/family_enjoying_home_internet.png";

function SpeedCard({ speed, time, label }: { speed: number; time: string; label: string }) {
  return (
    <div className="flex-shrink-0 w-[180px] bg-card rounded-2xl border p-5 text-center hover:shadow-lg transition-shadow">
      <p className="text-3xl font-bold text-primary mb-1">{speed}<span className="text-base">Mbps</span></p>
      <p className="text-xs text-muted-foreground mb-3">Approx. {time}</p>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-brand rounded-full transition-all duration-500"
          style={{ width: `${Math.min((speed / 2000) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs font-medium mt-2">{label}</p>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, description, href }: { icon: any; title: string; description: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full border-2 hover:border-primary/50">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Fiber Background */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-30"
          style={{ backgroundImage: `url(${fiberBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Zap className="h-3 w-3 mr-1" />
                Australia's fastest growing ISP
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Upgrade your<br />
                internet<span className="text-primary">_</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                Super speedy NBN with award-winning service. No lock-in contracts, unlimited data, and 100% Aussie support.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Button size="lg" className="h-12 px-8 bg-gradient-brand hover:opacity-90 border-0 rounded-lg" asChild>
                  <Link href="/plans">
                    View Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-lg" asChild>
                  <Link href="/coverage">Check Address</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Unlimited data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>No lock-in contract</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Free modem on 36mo</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src={familyImage} 
                alt="Family enjoying fast internet at home" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-8 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="relative rounded-2xl overflow-hidden">
            <img 
              src={promoBanner} 
              alt="Fast internet promotion" 
              className="w-full h-48 md:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-purple-600/90 flex items-center">
              <div className="container px-8 md:px-12">
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">NBN 2000 is here</h2>
                <p className="text-white/80 mb-4 max-w-lg">Experience ultra-fast speeds up to 2 Gbps. Perfect for large households and power users.</p>
                <Button variant="secondary" asChild>
                  <Link href="/nbn-2000">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid - Superloop Style */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The new standard of internet<span className="text-primary">_</span></h2>
            <p className="text-muted-foreground text-lg">Make BroNET the benchmark for speed, service and value.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ServiceCard
              icon={HomeIcon}
              title="Home Internet"
              description="No lock-in NBN plans with unlimited data"
              href="/plans"
            />
            <ServiceCard
              icon={Building2}
              title="Business NBN"
              description="Fast and reliable connection for your business"
              href="/plans"
            />
            <ServiceCard
              icon={Wifi}
              title="WiFi Routers"
              description="eero mesh systems for whole-home coverage"
              href="/modems"
            />
            <ServiceCard
              icon={Smartphone}
              title="Mobile Plans"
              description="SIM-only 4G and 5G plans coming soon"
              href="/mobile"
            />
          </div>
        </div>
      </section>

      {/* Speed Comparison */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              New 2 Gbps plans powered by BroNET<span className="text-primary">_</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Download a 4GB Ultra HD video in seconds. Choose the speed that fits your lifestyle.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
            <SpeedCard speed={100} time="5m 20s" label="NBN 100" />
            <SpeedCard speed={250} time="2m 8s" label="NBN 250" />
            <SpeedCard speed={500} time="1m 4s" label="NBN 500" />
            <SpeedCard speed={1000} time="32s" label="NBN 1000" />
            <SpeedCard speed={2000} time="16s" label="NBN 2000" />
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button className="bg-gradient-brand hover:opacity-90 border-0" asChild>
              <Link href="/plans">
                View All Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Plans */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Plans<span className="text-primary">_</span></h2>
              <p className="text-muted-foreground text-lg">Choose the speed that fits your lifestyle.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/plans">
                View All Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PlanCard 
              name="NBN 50" 
              speed={50} 
              upload={20} 
              price={69} 
              typicalSpeed="50 Mbps"
              tier="basic"
            />
            <PlanCard 
              name="NBN 100" 
              speed={100} 
              upload={20} 
              price={89} 
              typicalSpeed="98 Mbps" 
              tier="basic"
              isPopular={true}
            />
            <PlanCard 
              name="NBN 250" 
              speed={250} 
              upload={25} 
              price={109} 
              typicalSpeed="245 Mbps"
              tier="power"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why we're the best for internet<span className="text-primary">_</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Gauge className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Unlimited data</h3>
              <p className="text-muted-foreground text-sm">
                We spell 'unlimited' the correct way, without an asterisk. No data limits or excess usage charges.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">No lock-in plans</h3>
              <p className="text-muted-foreground text-sm">
                With month-to-month plans you'll never be tied down. Leave when you want—we'll miss you, but we get it.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Laptop className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">One account for everything</h3>
              <p className="text-muted-foreground text-sm">
                Simplify things by managing all your services, payments, and plan changes from one account.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Easy setup. Quick support.</h3>
              <p className="text-muted-foreground text-sm">
                Pre-configured for easy setup, our routers allow for remote diagnosis and support.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">We call Australia home</h3>
              <p className="text-muted-foreground text-sm">
                Being Australian owned means we're continually investing in giving local homes the internet they deserve.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Aussie support</h3>
              <p className="text-muted-foreground text-sm">
                Talk to real people based in Australia. No offshore call centres, just friendly local support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-brand text-white">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to upgrade your internet?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Check if BroNET is available at your address and join thousands of happy customers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="h-12 px-8" asChild>
              <Link href="/coverage">Check Your Address</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 border-white text-white hover:bg-white/10" asChild>
              <Link href="/plans">View Plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
