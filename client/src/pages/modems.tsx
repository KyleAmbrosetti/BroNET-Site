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
import { Zap, Home, Building2, Check, AlertCircle } from "lucide-react";
import eero7Image from "@assets/eero_7_1766456146814.png";
import eeroPro7Image from "@assets/eero_pro_7_1766456340140.jpg";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

const products = [
  {
    id: "eero-7",
    name: "eero 7",
    subtitle: "Tri-band Wi-Fi 7 mesh router",
    price: "$299",
    priceNote: "Starting from",
    description: "Perfect for small to medium homes. Fast, reliable Wi-Fi 7 with seamless mesh coverage.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Tri-band (2.4GHz, 5GHz, 6GHz)",
      "Up to 2.1 Gbps speeds",
      "Covers up to 200 sqm",
      "Supports NBN 1000 plans",
      "Easy mesh expansion",
      "Built-in security",
      "Works with Alexa",
    ],
    ideal: "Small to medium homes (2-4 bedrooms)",
    maxSpeed: "NBN 1000 (Home Fast)",
    badge: "Popular",
    badgeVariant: "default" as const,
    image: eero7Image,
  },
  {
    id: "eero-pro-7",
    name: "eero Pro 7",
    subtitle: "Premium tri-band Wi-Fi 7 mesh router",
    price: "$599",
    priceNote: "Starting from",
    description: "For power users and large homes. Maximum performance with support for NBN's fastest plans.",
    features: [
      "Wi-Fi 7 (802.11be)",
      "Tri-band (2.4GHz, 5GHz, 6GHz)",
      "Up to 4.3 Gbps speeds",
      "Covers up to 300 sqm",
      "Supports NBN 2000 plans",
      "2.5 GbE ethernet port",
      "Advanced mesh networking",
      "Premium support included",
    ],
    ideal: "Large homes & power users (4+ bedrooms)",
    maxSpeed: "NBN 2000 (Home Ultrafast)",
    badge: "Best Performance",
    badgeVariant: "secondary" as const,
    image: eeroPro7Image,
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
    <div className="min-h-screen bg-background">
      <div className="container py-12 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 font-heading">
            Premium Mesh Routers
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upgrade your home network with eero Wi-Fi 7 mesh routers. Perfect for NBN plans up to 2000 Mbps.
          </p>
        </div>

        <Alert className="mb-8 border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> eero is a third-party product. Availability and pricing may change. 
            Contact us for current stock and delivery information.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {products.map((product) => (
            <Card key={product.id} className="relative" data-testid={`card-product-${product.id}`}>
              {product.badge && (
                <Badge 
                  variant={product.badgeVariant} 
                  className="absolute top-4 right-4"
                  data-testid={`badge-${product.id}`}
                >
                  {product.badge}
                </Badge>
              )}
              
              <CardHeader>
                <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-full w-full object-cover"
                    data-testid={`image-${product.id}`}
                  />
                </div>
                <CardTitle className="text-2xl font-heading" data-testid={`title-${product.id}`}>
                  {product.name}
                </CardTitle>
                <CardDescription data-testid={`subtitle-${product.id}`}>
                  {product.subtitle}
                </CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-bold" data-testid={`price-${product.id}`}>
                    {product.price}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">{product.priceNote}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-muted-foreground" data-testid={`description-${product.id}`}>
                  {product.description}
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Key Features
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2" data-testid={`feature-${product.id}-${idx}`}>
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 space-y-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`ideal-${product.id}`}>{product.ideal}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`speed-${product.id}`}>Compatible with {product.maxSpeed}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleEnquire(product.id)}
                  data-testid={`button-enquire-${product.id}`}
                >
                  Enquire Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 text-center font-heading">
            Compare Models
          </h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Feature</TableHead>
                  <TableHead className="text-center">eero 7</TableHead>
                  <TableHead className="text-center">eero Pro 7</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Wi-Fi Standard</TableCell>
                  <TableCell className="text-center" data-testid="compare-wifi-eero-7">Wi-Fi 7</TableCell>
                  <TableCell className="text-center" data-testid="compare-wifi-eero-pro-7">Wi-Fi 7</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Maximum Speed</TableCell>
                  <TableCell className="text-center" data-testid="compare-maxspeed-eero-7">2.1 Gbps</TableCell>
                  <TableCell className="text-center" data-testid="compare-maxspeed-eero-pro-7">4.3 Gbps</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Coverage Area</TableCell>
                  <TableCell className="text-center" data-testid="compare-coverage-eero-7">Up to 200 sqm</TableCell>
                  <TableCell className="text-center" data-testid="compare-coverage-eero-pro-7">Up to 300 sqm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">NBN Plan Support</TableCell>
                  <TableCell className="text-center" data-testid="compare-nbn-eero-7">Up to NBN 1000</TableCell>
                  <TableCell className="text-center" data-testid="compare-nbn-eero-pro-7">Up to NBN 2000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ethernet Ports</TableCell>
                  <TableCell className="text-center" data-testid="compare-ethernet-eero-7">Dual GbE</TableCell>
                  <TableCell className="text-center" data-testid="compare-ethernet-eero-pro-7">2.5 GbE + GbE</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Ideal For</TableCell>
                  <TableCell className="text-center" data-testid="compare-ideal-eero-7">2-4 bedrooms</TableCell>
                  <TableCell className="text-center" data-testid="compare-ideal-eero-pro-7">4+ bedrooms</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Starting Price</TableCell>
                  <TableCell className="text-center font-bold" data-testid="compare-price-eero-7">$299</TableCell>
                  <TableCell className="text-center font-bold" data-testid="compare-price-eero-pro-7">$599</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="font-heading">Why Choose eero with BroNET?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Optimized for NBN</h4>
                <p className="text-sm text-muted-foreground">
                  Tested and verified to work perfectly with BroNET's NBN plans
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Easy Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Simple mobile app setup gets you online in minutes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Expandable Coverage</h4>
                <p className="text-sm text-muted-foreground">
                  Add more units anytime to extend your mesh network
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Automatic Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Firmware updates automatically to keep your network secure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEnquiryDialog} onOpenChange={setShowEnquiryDialog}>
        <DialogContent data-testid="dialog-enquiry">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">
              Product Enquiry
            </DialogTitle>
            <DialogDescription data-testid="dialog-description">
              {selectedProduct && products.find(p => p.id === selectedProduct)?.name}
              {" - "}
              Fill in your details and we'll get back to you soon.
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
