import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu, Zap, User, Moon, Sun, LayoutDashboard, Phone, ChevronRight, Download } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useUser();

  const isPortal = location.startsWith("/dashboard");

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-foreground"}`}>
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Navbar - Superloop Style */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <a 
              href="/favicon.png" 
              download="bronet-logo.png"
              className="group relative bg-primary p-1.5 rounded-lg text-white hover:scale-105 transition-transform"
              title="Download BroNET Logo"
            >
              <Zap className="h-5 w-5 fill-current group-hover:opacity-0 transition-opacity" />
              <Download className="h-5 w-5 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <Link href="/">
              <span className="font-heading font-bold text-xl tracking-tight">BroNET</span>
            </Link>
          </div>
          {/* BroNET logo links to coming soon page (/) */}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/home">Home</NavLink>
            <NavLink href="/plans">nbn plans</NavLink>
            <NavLink href="/mobile">Mobile</NavLink>
            <NavLink href="/modems">Modems</NavLink>
            <NavLink href="/coverage">Check address</NavLink>
            <NavLink href="/speed-test">Speed test</NavLink>
            <NavLink href="/support">Support</NavLink>
            {user?.isAdmin && <NavLink href="/admin">Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
               <Button variant="outline" size="sm" asChild>
                 <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    My Account
                 </Link>
               </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth">
                    Log in
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col gap-1 mt-8">
                    <Link href="/home" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      Home <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/plans" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      nbn plans <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/mobile" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      Mobile <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/modems" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      Modems <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/coverage" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      Check address <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/speed-test" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      Speed test <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <Link href="/support" className="flex items-center justify-between py-3 px-2 text-lg font-medium hover:bg-muted rounded-lg">
                      Support <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div className="border-t my-4" />
                    {user ? (
                      <>
                        <Link href="/dashboard" className="flex items-center justify-between py-3 px-2 text-lg font-medium text-primary hover:bg-muted rounded-lg">
                          My Account <ChevronRight className="h-5 w-5" />
                        </Link>
                        <button onClick={logout} className="flex items-center py-3 px-2 text-lg font-medium text-muted-foreground hover:bg-muted rounded-lg text-left">
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <Link href="/auth" className="flex items-center justify-between py-3 px-2 text-lg font-medium text-primary hover:bg-muted rounded-lg">
                        Log in <ChevronRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Superloop Style */}
      {!isPortal && (
        <footer className="border-t bg-muted/30">
          {/* CTA Banner */}
          <div className="bg-gradient-brand py-12">
            <div className="container px-4 md:px-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Upgrade your internet</h2>
              <p className="text-white/80 mb-6">Or, contact our call centre on <a href="tel:1300123456" className="underline font-medium">1300 123 456</a></p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/plans">View Plans</Link>
              </Button>
            </div>
          </div>
          
          <div className="container px-4 md:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Residential
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/plans" className="hover:text-foreground">nbn plans</Link></li>
                  <li><Link href="/nbn-2000" className="hover:text-foreground">nbn 2000 plans</Link></li>
                  <li><Link href="/modems" className="hover:text-foreground">Modems</Link></li>
                  <li><Link href="/mobile" className="hover:text-foreground">Mobile SIM</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
                  <li><Link href="/support" className="hover:text-foreground">Network Status</Link></li>
                  <li><a href="tel:1300123456" className="hover:text-foreground">1300 123 456</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about" className="hover:text-foreground">About BroNET</Link></li>
                  <li><Link href="/support" className="hover:text-foreground">Careers</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/terms" className="hover:text-foreground">Terms & Conditions</Link></li>
                  <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                  <li><Link href="/cis" className="hover:text-foreground">Critical Info Summary</Link></li>
                  <li><Link href="/abuse" className="hover:text-foreground">Report Abuse</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/support" className="hover:text-foreground">Help Centre</Link></li>
                  <li><Link href="/coverage" className="hover:text-foreground">Check Coverage</Link></li>
                  <li><Link href="/speed-test" className="hover:text-foreground">Speed Test</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2025 BroNET Pty Ltd. ABN 43 150 753 265. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
      
    </div>
  );
}
