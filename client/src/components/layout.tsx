import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu, Zap, User, Moon, Sun, LayoutDashboard, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/hooks/use-user";
import { ChatBot } from "@/components/chatbot";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useUser();

  const isPortal = location.startsWith("/dashboard");

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href} className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-brand p-1.5 rounded-lg text-white">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">BroNET</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/home">Home</NavLink>
            <NavLink href="/plans">Plans</NavLink>
            <NavLink href="/coverage">Coverage</NavLink>
            <NavLink href="/modems">Modems</NavLink>
            <NavLink href="/support">Support</NavLink>
            {user?.isAdmin && <NavLink href="/admin">Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-4">
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
               <div className="flex items-center gap-2">
                 <Button variant="ghost" asChild>
                   <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                   </Link>
                 </Button>
               </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="hidden sm:flex" asChild>
                  <Link href="/auth">
                    <User className="mr-2 h-4 w-4" />
                    Portal
                  </Link>
                </Button>
                <Button className="bg-gradient-brand text-white border-0 hover:opacity-90 transition-opacity" asChild>
                  <Link href="/coverage">Check Address</Link>
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
                <SheetContent side="right">
                  <div className="flex flex-col gap-4 mt-8">
                    <Link href="/home" className="text-lg font-medium">Home</Link>
                    <Link href="/plans" className="text-lg font-medium">Plans</Link>
                    <Link href="/coverage" className="text-lg font-medium">Coverage</Link>
                    <Link href="/modems" className="text-lg font-medium">Modems</Link>
                    <Link href="/support" className="text-lg font-medium">Support</Link>
                    {user ? (
                      <>
                        <Link href="/dashboard" className="text-lg font-medium text-primary">My Dashboard</Link>
                        <button onClick={logout} className="text-lg font-medium text-left text-muted-foreground">Sign Out</button>
                      </>
                    ) : (
                      <Link href="/auth" className="text-lg font-medium text-primary">Customer Portal</Link>
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

      {/* Footer */}
      {!isPortal && (
        <footer className="border-t bg-muted/30 py-12">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold mb-4">BroNET</h3>
                <p className="text-sm text-muted-foreground">
                  Lightning fast NBN for Aussie legends. No BS, just speed.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-4">Plans</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/plans">NBN 100</Link></li>
                  <li><Link href="/plans">NBN 250</Link></li>
                  <li><Link href="/plans">NBN 1000</Link></li>
                  <li><Link href="/nbn-2000" className="text-primary font-medium">NBN 2000</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Products</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/modems">Modems & Routers</Link></li>
                  <li><Link href="/coverage">Check Coverage</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/support">Help Center</Link></li>
                  <li><Link href="/support">Network Status</Link></li>
                  <li><Link href="/support">Contact Us</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/terms">Terms of Service</Link></li>
                  <li><Link href="/privacy">Privacy Policy</Link></li>
                  <li><Link href="/cis">Critical Info Summary</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; 2025 BroNET Pty Ltd. ABN 12 345 678 901.</p>
            </div>
          </div>
        </footer>
      )}
      
      {/* AI Chatbot */}
      <ChatBot />
    </div>
  );
}