import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Zap, Home, Check, ArrowRight, Wifi, Shield, Smartphone, Signal, Gift } from "lucide-react";
import eero7Image from "@assets/eero_7_1766481389429.jpg";
import eeroPro7Image from "@assets/eero_pro_7_1766472837873.jpg";
import eeroMax7Image from "@assets/eero-max-7_bc8e_1766481757902.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";

const products = [
  {
    id: "eero-7",
    name: "eero 7",
    subtitle: "Tri-band Wi-Fi 7 mesh router",
    price: 199,
    priceNote: "or FREE on 36mo plan",
    description: "Perfect for small to medium homes. Fast, reliable Wi-Fi 7 with seamless mesh coverage.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Tri-band (2.4GHz, 5GHz, 6GHz)",
      "Up to 2.1 Gbps speeds",
      "Covers up to 200 sqm",
      "Supports NBN 1000 plans",
      "Easy mesh expansion",
    ],
    specs: {
      bands: "Tri-band",
      speed: "2.1 Gbps",
      coverage: "200 sqm",
      nbn: "NBN 1000",
      ethernet: "Dual GbE",
    },
    ideal: "2-4 bedroom homes",
    badge: "Popular",
    badgeVariant: "default" as const,
    image: eero7Image,
    highlight: false,
  },
  {
    id: "eero-pro-7",
    name: "eero Pro 7",
    subtitle: "Premium tri-band Wi-Fi 7 mesh router",
    price: 299,
    priceNote: "or FREE on 36mo plan",
    description: "For power users and large homes. Maximum performance with support for NBN's fastest plans.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Up to 4.3 Gbps speeds",
      "Covers up to 300 sqm",
      "Supports NBN 2000 plans",
      "2.5 GbE ethernet port",
      "Advanced mesh networking",
    ],
    specs: {
      bands: "Tri-band",
      speed: "4.3 Gbps",
      coverage: "300 sqm",
      nbn: "NBN 2000",
      ethernet: "2.5 GbE + GbE",
    },
    ideal: "4+ bedroom homes",
    badge: "Best Value",
    badgeVariant: "secondary" as const,
    image: eeroPro7Image,
    highlight: true,
  },
  {
    id: "eero-max-7",
    name: "eero Max 7",
    subtitle: "Ultimate quad-band Wi-Fi 7 mesh router",
    price: 820,
    priceNote: "Starting from",
    description: "The ultimate mesh router for demanding users. Quad-band Wi-Fi 7 with 10 GbE support.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Quad-band technology",
      "Up to 11 Gbps aggregate speeds",
      "Covers up to 400 sqm",
      "10 GbE + 2.5 GbE ethernet",
      "Thread border router built-in",
    ],
    specs: {
      bands: "Quad-band",
      speed: "11 Gbps",
      coverage: "400 sqm",
      nbn: "NBN 2000+",
      ethernet: "10 GbE + 2.5 GbE",
    },
    ideal: "Enthusiasts & large homes",
    badge: "Ultimate",
    badgeVariant: "destructive" as const,
    image: eeroMax7Image,
    highlight: false,
  },
];

export default function ModemsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showEnquiryDialog, setShowEnquiryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    phone: "",
    quantity: "1",
    message: "",
  });

  const handleEnquire = (productId: string) => {
    setSelectedProduct(productId);
    setFormData({
      name: user ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      phone: "",
      quantity: "1",
      message: "",
    });
    setShowEnquiryDialog(true);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const result = await api.createModemEnquiry({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      product: product.name,
      quantity: parseInt(formData.quantity) || 1,
      message: formData.message || null,
    });

    setIsSubmitting(false);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Enquiry submitted",
      description: user 
        ? "We've received your request. View it in your dashboard."
        : "We've received your request. We'll contact you soon!",
    });

    setShowEnquiryDialog(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-background dark:from-primary/30 dark:via-purple-600/20 dark:to-background" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              <Wifi className="h-3 w-3 mr-1" />
              Wi-Fi 7 Technology
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Fast hardware for<br />fast internet<span className="text-primary">_</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whole-home mesh Wi-Fi coverage with the latest Wi-Fi 7 technology. 
              Get a free eero router when you stay connected for 36 months.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 bg-card border rounded-full px-4 py-2 text-sm">
                <Gift className="h-4 w-4 text-primary" />
                <span>Free on 36mo plans</span>
              </div>
              <div className="flex items-center gap-2 bg-card border rounded-full px-4 py-2 text-sm">
                <Signal className="h-4 w-4 text-primary" />
                <span>Whole-home coverage</span>
              </div>
              <div className="flex items-center gap-2 bg-card border rounded-full px-4 py-2 text-sm">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Easy app setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Modem Banner */}
      <section className="py-6 bg-primary/10 border-y">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Get your modem FREE when you stay connected for 36 months</p>
              <p className="text-sm text-muted-foreground">No upfront cost. Just reliable internet with great hardware.</p>
            </div>
            <Button className="bg-gradient-brand" asChild>
              <Link href="/plans">View Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 py-16">
        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl ${
                product.highlight ? 'border-primary border-2 shadow-lg' : 'border'
              }`}
              data-testid={`card-product-${product.id}`}
            >
              {product.badge && (
                <Badge 
                  variant={product.badgeVariant} 
                  className="absolute top-4 right-4 z-10"
                  data-testid={`badge-${product.id}`}
                >
                  {product.badge}
                </Badge>
              )}
              
              {/* Image */}
              <div className="h-48 md:h-56 bg-muted overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className={`h-full w-full object-cover ${
                    product.id === 'eero-max-7' ? 'object-[center_60%]' : 'object-center'
                  }`}
                  data-testid={`image-${product.id}`}
                />
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl" data-testid={`title-${product.id}`}>
                  {product.name}
                </CardTitle>
                <CardDescription data-testid={`subtitle-${product.id}`}>
                  {product.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4">
                {/* Price */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <span className="text-3xl md:text-4xl font-bold" data-testid={`price-${product.id}`}>
                    ${product.price}
                  </span>
                  <p className="text-sm text-primary font-medium mt-1">{product.priceNote}</p>
                </div>

                {/* Quick Specs */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{product.specs.speed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{product.specs.coverage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{product.specs.bands}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{product.specs.nbn}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 flex-1">
                  {product.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm" data-testid={`feature-${product.id}-${idx}`}>
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Ideal For */}
                <div className="pt-3 border-t mt-auto">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Ideal for:</span> {product.ideal}
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className={`w-full ${product.highlight ? 'bg-gradient-brand' : ''}`}
                  variant={product.highlight ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleEnquire(product.id)}
                  data-testid={`button-enquire-${product.id}`}
                >
                  Enquire Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare Models<span className="text-primary">_</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find the perfect router for your home. All models support the latest Wi-Fi 7 standard.
            </p>
          </div>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/4 font-bold">Feature</TableHead>
                    <TableHead className="text-center">
                      <div className="font-bold">eero 7</div>
                      <div className="text-xs font-normal text-muted-foreground">From $199</div>
                    </TableHead>
                    <TableHead className="text-center bg-primary/5">
                      <div className="font-bold text-primary">eero Pro 7</div>
                      <div className="text-xs font-normal text-muted-foreground">From $299</div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="font-bold">eero Max 7</div>
                      <div className="text-xs font-normal text-muted-foreground">From $820</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Wi-Fi Standard</TableCell>
                    <TableCell className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Frequency Bands</TableCell>
                    <TableCell className="text-center">Tri-band</TableCell>
                    <TableCell className="text-center bg-primary/5">Tri-band</TableCell>
                    <TableCell className="text-center font-medium text-primary">Quad-band</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Maximum Speed</TableCell>
                    <TableCell className="text-center">2.1 Gbps</TableCell>
                    <TableCell className="text-center bg-primary/5">4.3 Gbps</TableCell>
                    <TableCell className="text-center font-medium text-primary">11 Gbps</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Coverage Area</TableCell>
                    <TableCell className="text-center">200 sqm</TableCell>
                    <TableCell className="text-center bg-primary/5">300 sqm</TableCell>
                    <TableCell className="text-center">400 sqm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">NBN Plan Support</TableCell>
                    <TableCell className="text-center">Up to 1000</TableCell>
                    <TableCell className="text-center bg-primary/5 font-medium">Up to 2000</TableCell>
                    <TableCell className="text-center font-medium text-primary">2000+</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ethernet Ports</TableCell>
                    <TableCell className="text-center">Dual GbE</TableCell>
                    <TableCell className="text-center bg-primary/5">2.5 GbE + GbE</TableCell>
                    <TableCell className="text-center font-medium text-primary">10 GbE + 2.5 GbE</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Free on 36mo Plan</TableCell>
                    <TableCell className="text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center text-muted-foreground">—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

        {/* Why Choose Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why choose eero<span className="text-primary">_</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Industry-leading mesh technology trusted by millions of homes worldwide.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Optimized for NBN</h3>
              <p className="text-sm text-muted-foreground">
                Tested and verified to work perfectly with all BroNET NBN plans
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Easy App Setup</h3>
              <p className="text-sm text-muted-foreground">
                Simple mobile app gets you online in minutes, no tech expertise needed
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Signal className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Expandable Coverage</h3>
              <p className="text-sm text-muted-foreground">
                Add more units anytime to extend your mesh network coverage
              </p>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Auto Security</h3>
              <p className="text-sm text-muted-foreground">
                Automatic firmware updates keep your network secure 24/7
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to upgrade your Wi-Fi?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Get a free eero router when you sign up for a 36-month NBN plan. 
              Experience whole-home coverage with the latest Wi-Fi 7 technology.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-brand" asChild>
                <Link href="/plans">
                  View NBN Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/coverage">Check Address</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Enquiry Dialog */}
      <Dialog open={showEnquiryDialog} onOpenChange={setShowEnquiryDialog}>
        <DialogContent data-testid="dialog-enquiry">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              Product Enquiry
            </DialogTitle>
            <DialogDescription data-testid="dialog-description">
              {selectedProduct && products.find(p => p.id === selectedProduct)?.name}
              {" - "}Fill in your details and we'll get back to you soon.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEnquiry}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    data-testid="input-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    data-testid="input-quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  data-testid="input-message"
                  placeholder="Any questions or special requirements?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEnquiryDialog(false)}
                data-testid="button-cancel-enquiry"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-submit-enquiry"
              >
                {isSubmitting ? "Submitting..." : "Submit Enquiry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
