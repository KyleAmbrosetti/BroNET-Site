import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronDown, Wifi, Home, Signal, Zap, Shield, Check } from "lucide-react";
import eero7Image from "@assets/eero_7_1766456146814.png";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";

const products = [
  {
    id: "eero-pro-7",
    name: "Amazon eero Pro 7",
    subtitle: "Wi-Fi 7 mesh modem",
    price: 299,
    features: [
      { title: "Blazing-fast performance", description: "With support for internet plans up to 5 Gbps and wireless speeds up to 3.9 Gbps, eero Pro 7 powers through bandwidth-heavy tasks with ease." },
      { title: "Smarter Wi-Fi that follows you", description: "Thanks to TrueMesh, TrueRoam, and TrueChannel, your signal sticks with you. Room to room, floor to floor." },
      { title: "Next-gen power, old-gen love", description: "Built on Wi-Fi 7, eero Pro 7 plays nice with previous eero systems — because even the future has a soft spot for legacy." },
    ],
    specs: {
      type: "Modem",
      priceText: "$299 outright",
      priceNote: "or pay in 12/24 months",
      bands: "Tri-band, Wi-Fi 7",
      speed: "Up to 5 Gbps (up to 4.7 Gbps wired or up to 3.9 Gbps wireless)",
      voip: "—",
      coverage: "Covers up to 190 m²",
      security: "eero Secure",
    },
    image: eeroPro7Image,
    imagePosition: "right",
  },
  {
    id: "eero-7",
    name: "Amazon eero 7",
    subtitle: "Wi-Fi 7 mesh modem",
    price: 199,
    features: [
      { title: "Multi-gig speed for multitasking", description: "Bring Wi-Fi 7 speed to your day-to-day devices and enjoy HD streaming and gaming with low latency." },
      { title: "Say goodbye to dead spots", description: "eero 7 helps minimise network disruptions to ensure you have fast, reliable Wi-Fi in every room of your home." },
      { title: "Boosted performance", description: "eero 7 helps reduce buffering and delays for smooth performance, even when using multiple devices simultaneously." },
    ],
    specs: {
      type: "Modem",
      priceText: "$199 outright",
      priceNote: "or pay in 12/24 months",
      bands: "Dual-band, Wi-Fi 7",
      speed: "Up to 2.5 Gbps (up to 2.3 Gbps wired or up to 1.8 Gbps wireless)",
      voip: "—",
      coverage: "Covers up to 190 m²",
      security: "eero Secure",
    },
    image: eero7Image,
    imagePosition: "left",
  },
  {
    id: "eero-max-7",
    name: "Amazon eero Max 7",
    subtitle: "Ultimate Wi-Fi 7 mesh modem",
    price: 820,
    features: [
      { title: "Quad-band technology", description: "Experience the ultimate in wireless performance with quad-band Wi-Fi 7, delivering up to 11 Gbps aggregate speeds." },
      { title: "10 GbE connectivity", description: "Future-proof your home with 10 GbE ethernet for blazing-fast wired connections to your most demanding devices." },
      { title: "Thread border router", description: "Built-in Thread border router support for seamless smart home integration and IoT device connectivity." },
    ],
    specs: {
      type: "Modem",
      priceText: "$820 outright",
      priceNote: "or pay in 12/24 months",
      bands: "Quad-band, Wi-Fi 7",
      speed: "Up to 11 Gbps aggregate (10 GbE + 2.5 GbE wired)",
      voip: "—",
      coverage: "Covers up to 400 m²",
      security: "eero Secure",
    },
    image: eeroMax7Image,
    imagePosition: "right",
  },
];

const faqs = [
  {
    question: "What is Wi-Fi 7?",
    answer: "Wi-Fi 7 is the next-generation wireless standard (802.11be), offering faster speeds, lower latency, and better performance in crowded networks. It supports up to 46 Gbps, wider 320 MHz channels, and advanced tech like Multi-Link Operation (MLO) for smoother, more reliable connections."
  },
  {
    question: "What is a mesh router?",
    answer: "A mesh router system uses multiple units (a main router and satellites) to provide seamless Wi-Fi coverage throughout your home. Unlike a traditional router, it reduces dead zones by letting devices automatically connect to the strongest signal as you move around."
  },
  {
    question: "Can I buy a modem from BroNET?",
    answer: "Yes! You can purchase any of our eero modems outright or pay them off over 12 or 24 months. Simply enquire about your preferred modem and we'll help you get set up."
  },
  {
    question: "Which modem is best for my nbn plan?",
    answer: "The best modem depends on your nbn type and usage. For fast plans (e.g. nbn 100+), a Wi-Fi 6 or Wi-Fi 7 router is ideal. For large homes, a mesh system is best."
  },
  {
    question: "Do I need a new modem for nbn?",
    answer: "You may need a new router if your current one doesn't support your nbn technology (e.g., FTTP, HFC) or can't handle your desired speed. Upgrading to a newer modem can also improve speed, coverage, and device support."
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              BroNET's ultrafast next-gen modems<span className="text-primary">_</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience seamless connectivity and reliable performance with our next-gen modems for every home and business.
            </p>
          </div>
        </div>
      </section>

      {/* Product Sections - Alternating Layout */}
      {products.map((product, index) => (
        <section 
          key={product.id} 
          className={`py-16 md:py-24 ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
        >
          <div className="container px-4 md:px-6">
            <div className={`grid md:grid-cols-2 gap-8 md:gap-16 items-center ${
              product.imagePosition === 'left' ? 'md:flex-row-reverse' : ''
            }`}>
              {/* Image */}
              <div className={`${product.imagePosition === 'left' ? 'md:order-2' : 'md:order-1'}`}>
                <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-full w-full object-cover"
                    data-testid={`image-${product.id}`}
                  />
                </div>
              </div>

              {/* Content */}
              <div className={`${product.imagePosition === 'left' ? 'md:order-1' : 'md:order-2'}`}>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h2>
                <p className="text-muted-foreground mb-8">{product.subtitle}</p>

                <ul className="space-y-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="mt-8 group"
                  variant="link"
                  onClick={() => handleEnquire(product.id)}
                  data-testid={`button-learn-${product.id}`}
                >
                  Enquire about {product.name.split(' ').slice(-2).join(' ')}
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Compare All Modems */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Compare all modems<span className="text-primary">_</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden" data-testid={`compare-card-${product.id}`}>
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 m-4">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{product.name.replace('Amazon ', '')}</h3>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary group mb-4"
                    onClick={() => handleEnquire(product.id)}
                  >
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>

                  <div className="border-t pt-4 space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">{product.specs.type}</span>
                    </div>
                    <div>
                      <span className="font-bold">{product.specs.priceText}</span>
                      <p className="text-muted-foreground text-xs">{product.specs.priceNote}</p>
                    </div>
                    <div className="text-muted-foreground">{product.specs.bands}</div>
                    <div className="text-muted-foreground text-xs">{product.specs.speed}</div>
                    <div className="text-muted-foreground">{product.specs.voip}</div>
                    <div className="text-muted-foreground">{product.specs.coverage}</div>
                    <div className="text-muted-foreground">{product.specs.security}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Modem Performance Matters */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why modem Wi-Fi performance matters<span className="text-primary">_</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Faster and more dependable Wi-Fi means faster downloads, seamless streaming, and less-lag gaming and crucial connectivity, powered by your modem.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Whole-home coverage</h3>
              <p className="text-sm text-muted-foreground">
                Older Wi-Fi setups can struggle in big homes. Mesh systems reduce dead zones with stronger, wider coverage to reach every room.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Faster speeds for more devices</h3>
              <p className="text-sm text-muted-foreground">
                Old routers lag, especially when serving too many devices at once. Modern Wi-Fi delivers speed and handles them all smoothly without slowing down.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Signal className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Stable connections</h3>
              <p className="text-sm text-muted-foreground">
                Modern Wi-Fi delivers stable, reliable connections limiting dropped signals or buffering, even during peak usage times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* View Plans CTA */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-1 w-12 bg-primary mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to get connected<span className="text-primary">?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Pair your new modem with one of our ultra-fast nbn plans for the best experience.
            </p>
            <Button size="lg" className="bg-gradient-brand group" asChild>
              <Link href="/plans">
                View nbn plans
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Things you need to know<span className="text-primary">_</span>
          </h2>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-background rounded-lg border px-6"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

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
