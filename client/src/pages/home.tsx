import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/plan-card";
import { Link } from "wouter";
import { 
  Rocket, 
  ShieldCheck, 
  Clock, 
  Wifi, 
  Gamepad2, 
  Download 
} from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_blue-purple_fiber_optic_waves_background.png'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-background/30 dark:bg-background/60 z-10 backdrop-blur-[2px]"></div>
            <img 
              src={generatedImage} 
              alt="Fiber optic background" 
              className="w-full h-full object-cover opacity-60 dark:opacity-40"
            />
             <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/20 to-background z-20"></div>
        </div>

        <div className="container relative z-30 px-4 md:px-6 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Rocket className="mr-2 h-4 w-4" />
            New: 2000Mbps plans now available!
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Lightning-fast NBN <br className="hidden md:block" />
            <span className="text-gradient">made simple.</span>
          </h1>
          
          <p className="mx-auto max-w-[700px] text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Join the Aussie ISP that gamers and creators love. No lock-in contracts, local support, and blistering fast speeds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button size="xl" className="h-14 px-8 text-lg rounded-full bg-gradient-brand hover:opacity-90 shadow-lg shadow-primary/25 border-0" asChild>
              <Link href="/coverage">Check Availability</Link>
            </Button>
            <Button size="xl" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50" asChild>
              <Link href="/plans">View Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Row */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">No Lock-in Contracts</h3>
              <p className="text-sm text-muted-foreground">Stay because you want to, not because you have to.</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">100% Aussie Support</h3>
              <p className="text-sm text-muted-foreground">Talk to real people based in Melbourne & Sydney.</p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                <Rocket className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Fast Setup</h3>
              <p className="text-sm text-muted-foreground">Get connected in minutes, not days (for most premises).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plans Snippet */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Popular Plans</h2>
              <p className="text-muted-foreground text-lg">Choose the speed that fits your lifestyle.</p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/plans">View All Plans</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
             <PlanCard 
              name="NBN 50" 
              speed={50} 
              upload={20} 
              price={69} 
              typicalSpeed="50 Mbps"
            />
            <PlanCard 
              name="NBN 100" 
              speed={100} 
              upload={20} 
              price={89} 
              typicalSpeed="98 Mbps" 
              isPopular={true}
            />
            <PlanCard 
              name="Home Superfast" 
              speed={250} 
              upload={25} 
              price={109} 
              typicalSpeed="245 Mbps" 
            />
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Why choose BroNET?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">We built the ISP we wanted to use ourselves. Optimized for modern internet usage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-3xl bg-card border p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
              <Rocket className="h-10 w-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Blistering Speed</h3>
              <p className="text-muted-foreground">Consistently top-tier speeds even during peak evening hours.</p>
            </div>
            
            <div className="group relative overflow-hidden rounded-3xl bg-card border p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
              <Gamepad2 className="h-10 w-10 text-purple-600 mb-6" />
              <h3 className="text-xl font-bold mb-2">Gamer Friendly</h3>
              <p className="text-muted-foreground">Optimized routing for lower latency in competitive games.</p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-card border p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
              <Download className="h-10 w-10 text-indigo-600 mb-6" />
              <h3 className="text-xl font-bold mb-2">Unlimited Data</h3>
              <p className="text-muted-foreground">No caps, no shaping, no worries. Download as much as you want.</p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl bg-card border p-8 hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-10 group-hover:scale-150 transition-transform duration-500"></div>
              <Wifi className="h-10 w-10 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold mb-2">Premium Wi-Fi</h3>
              <p className="text-muted-foreground">Add a pre-configured eero 7 mesh router for wall-to-wall coverage.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}