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
import { Zap, Home, Building2, Check, ArrowRight } from "lucide-react";
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
    price: "$199",
    priceNote: "Starting from",
    description: "Perfect for small to medium homes. Fast, reliable Wi-Fi 7 with seamless mesh coverage.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Tri-band (2.4GHz, 5GHz, 6GHz)",
      "Up to 2.1 Gbps speeds",
      "Covers up to 200 sqm",
      "Supports NBN 1000 plans",
      "Easy mesh expansion",
    ],
    ideal: "Small to medium homes (2-4 bedrooms)",
    maxSpeed: "NBN 1000",
    badge: "Popular",
    badgeVariant: "default" as const,
    image: eero7Image,
  },
  {
    id: "eero-pro-7",
    name: "eero Pro 7",
    subtitle: "Premium tri-band Wi-Fi 7 mesh router",
    price: "$299",
    priceNote: "Starting from",
    description: "For power users and large homes. Maximum performance with support for NBN's fastest plans.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Up to 4.3 Gbps speeds",
      "Covers up to 300 sqm",
      "Supports NBN 2000 plans",
      "2.5 GbE ethernet port",
      "Advanced mesh networking",
    ],
    ideal: "Large homes & power users (4+ bedrooms)",
    maxSpeed: "NBN 2000",
    badge: "Best Performance",
    badgeVariant: "secondary" as const,
    image: eeroPro7Image,
  },
  {
    id: "eero-max-7",
    name: "eero Max 7",
    subtitle: "Ultimate quad-band Wi-Fi 7 mesh router",
    price: "$820",
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
    ideal: "Ultra-large homes & enthusiasts",
    maxSpeed: "NBN 2000+",
    badge: "Ultimate",
    badgeVariant: "destructive" as const,
    image: eeroMax7Image,
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
      {/* Hero Section - Superloop Style */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-background dark:from-primary/30 dark:via-purple-600/20 dark:to-background" />
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Fast hardware for<br />fast internet<span className="text-primary">_</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our plans come with a free modem when you stay connected for 36 months. 
              Choose from the Amazon eero range for whole-home Wi-Fi coverage.
            </p>
            <Button size="lg" className="bg-gradient-brand" asChild>
              <Link href="/plans">
                View Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 pb-16">
        {/* Product Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {products.map((product) => (
            <Card key={product.id} className="relative flex flex-col" data-testid={`card-product-${product.id}`}>
              {product.badge && (
                <Badge 
                  variant={product.badgeVariant} 
                  className="absolute top-4 right-4 z-10"
                  data-testid={`badge-${product.id}`}
                >
                  {product.badge}
                </Badge>
              )}
              
              <div className="h-48 bg-muted rounded-t-lg overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className={`h-full w-full object-cover ${product.id === 'eero-max-7' ? 'object-[center_60%]' : 'object-center'}`}
                  data-testid={`image-${product.id}`}
                />
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-xl" data-testid={`title-${product.id}`}>
                  {product.name}
                </CardTitle>
                <CardDescription data-testid={`subtitle-${product.id}`}>
                  {product.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div>
                  <span className="text-3xl font-bold" data-testid={`price-${product.id}`}>
                    {product.price}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">{product.priceNote}</span>
                </div>

                <p className="text-sm text-muted-foreground" data-testid={`description-${product.id}`}>
                  {product.description}
                </p>

                <ul className="space-y-1 text-sm">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2" data-testid={`feature-${product.id}-${idx}`}>
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 space-y-1 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span data-testid={`ideal-${product.id}`}>{product.ideal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span data-testid={`speed-${product.id}`}>Compatible with {product.maxSpeed}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleEnquire(product.id)}
                  data-testid={`button-enquire-${product.id}`}
                >
                  Enquire Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Compare Models</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Feature</TableHead>
                  <TableHead className="text-center">eero 7</TableHead>
                  <TableHead className="text-center">eero Pro 7</TableHead>
                  <TableHead className="text-center">eero Max 7</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Wi-Fi Standard</TableCell>
                  <TableCell className="text-center">Wi-Fi 7</TableCell>
                  <TableCell className="text-center">Wi-Fi 7</TableCell>
                  <TableCell className="text-center">Wi-Fi 7</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Bands</TableCell>
                  <TableCell className="text-center">Tri-band</TableCell>
                  <TableCell className="text-center">Tri-band</TableCell>
                  <TableCell className="text-center">Quad-band</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Maximum Speed</TableCell>
                  <TableCell className="text-center">2.1 Gbps</TableCell>
                  <TableCell className="text-center">4.3 Gbps</TableCell>
                  <TableCell className="text-center">11 Gbps</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Coverage Area</TableCell>
                  <TableCell className="text-center">Up to 200 sqm</TableCell>
                  <TableCell className="text-center">Up to 300 sqm</TableCell>
                  <TableCell className="text-center">Up to 400 sqm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">NBN Plan Support</TableCell>
                  <TableCell className="text-center">Up to NBN 1000</TableCell>
                  <TableCell className="text-center">Up to NBN 2000</TableCell>
                  <TableCell className="text-center">NBN 2000+</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Starting Price</TableCell>
                  <TableCell className="text-center font-bold">$199</TableCell>
                  <TableCell className="text-center font-bold">$299</TableCell>
                  <TableCell className="text-center font-bold">$820</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Why Choose Section */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why choose eero with BroNET?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Optimized for NBN</h3>
                <p className="text-sm text-muted-foreground">
                  Tested and verified to work perfectly with BroNET's NBN plans
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Easy Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Simple mobile app setup gets you online in minutes
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Expandable Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  Add more units anytime to extend your mesh network
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Automatic Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Firmware updates automatically to keep your network secure
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

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
