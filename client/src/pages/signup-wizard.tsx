import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { 
  MapPin, CheckCircle2, Loader2, ArrowRight, ArrowLeft, 
  Wifi, Cable, User, CreditCard, FileText, Phone, Mail,
  Calendar, Building2, Zap
} from "lucide-react";

type Step = "address" | "qualification" | "details" | "plan" | "payment" | "confirmation";

type CoverageResult = {
  normalizedAddress: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  technology?: string;
  maxTier?: string;
  available?: boolean;
};

type QualificationResult = {
  locId: string;
  csaId?: string;
  address: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  technology: string;
  maxDownload: number;
  maxUpload: number;
  bandwidthProfile?: string;
  serviceClass: number;
  sqReference: string;
  validUntil: string;
  available: boolean;
};

type Plan = {
  id: string;
  name: string;
  speed: number;
  upload: number;
  price: number;
  priceId?: string;
};

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: "address", label: "Address", icon: MapPin },
  { id: "qualification", label: "Qualification", icon: FileText },
  { id: "details", label: "Your Details", icon: User },
  { id: "plan", label: "Select Plan", icon: Zap },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "confirmation", label: "Confirmation", icon: CheckCircle2 },
];

export default function SignupWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("address");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();

  const [address, setAddress] = useState("");
  const [isCheckingCoverage, setIsCheckingCoverage] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  
  const [qualification, setQualification] = useState<QualificationResult | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);
  
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [stripeProducts, setStripeProducts] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setContactName(`${user.firstName} ${user.lastName}`);
      setContactEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await api.getStripeProducts();
      if (data?.products) {
        setStripeProducts(data.products);
      }
    };
    fetchProducts();
  }, []);

  const getStepIndex = (step: Step) => STEPS.findIndex(s => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);

  const handleCheckCoverage = async () => {
    if (!address.trim()) {
      toast({ title: "Please enter an address", variant: "destructive" });
      return;
    }

    setIsCheckingCoverage(true);
    try {
      const { data, error } = await api.checkCoverage(address);
      if (error || !data?.success) {
        toast({ title: "Check failed", description: error || "Unable to verify address", variant: "destructive" });
        return;
      }

      if (data.result) {
        setCoverageResult(data.result);
        if (data.result.available !== false) {
          toast({ title: "NBN Available!", description: `Technology: ${data.result.technology}` });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to check coverage", variant: "destructive" });
    } finally {
      setIsCheckingCoverage(false);
    }
  };

  const handleQualification = async () => {
    if (!coverageResult) return;

    setIsQualifying(true);
    try {
      const response = await fetch("/api/orders/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: coverageResult.normalizedAddress,
          technology: coverageResult.technology,
          postcode: coverageResult.postcode,
          suburb: coverageResult.suburb,
          state: coverageResult.state,
        }),
      });

      const data = await response.json();
      if (data.success && data.qualification) {
        setQualification(data.qualification);
        setCurrentStep("details");
        toast({ title: "Service Qualified", description: `LOC ID: ${data.qualification.locId}` });
      } else {
        toast({ title: "Qualification failed", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Service qualification failed", variant: "destructive" });
    } finally {
      setIsQualifying(false);
    }
  };

  const handleDetailsSubmit = () => {
    if (!contactName || !contactEmail || !contactPhone) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const phoneRegex = /^(\+61|0)[2-478][\d]{8}$/;
    if (!phoneRegex.test(contactPhone.replace(/\s/g, ""))) {
      toast({ title: "Invalid phone number", description: "Please enter a valid Australian phone number", variant: "destructive" });
      return;
    }

    setCurrentStep("plan");
  };

  const getAvailablePlans = (): Plan[] => {
    if (!qualification) return [];

    const isWireless = qualification.technology.toLowerCase().includes("wireless");
    const maxSpeed = qualification.maxDownload;

    if (isWireless) {
      return [
        { id: "fw25", name: "Fixed Wireless 25", speed: 25, upload: 5, price: 59 },
        { id: "fw50", name: "Fixed Wireless 50", speed: 50, upload: 10, price: 69 },
        { id: "fw75", name: "Fixed Wireless 75", speed: 75, upload: 10, price: 79 },
        { id: "fwplus", name: "Fixed Wireless Plus", speed: 100, upload: 20, price: 89 },
      ].filter(p => p.speed <= maxSpeed);
    }

    return [
      { id: "nbn50", name: "NBN 50", speed: 50, upload: 20, price: 69 },
      { id: "nbn100", name: "NBN 100", speed: 100, upload: 20, price: 89 },
      { id: "nbn250", name: "NBN 250", speed: 250, upload: 25, price: 109 },
      { id: "nbn1000", name: "NBN 1000", speed: 1000, upload: 50, price: 129 },
      { id: "nbn2000", name: "NBN 2000", speed: 2000, upload: 500, price: 155 },
    ].filter(p => p.speed <= maxSpeed);
  };

  const getPriceId = (planName: string) => {
    const product = stripeProducts.find(p => p.name === planName);
    return product?.prices?.[0]?.id;
  };

  const handlePlanSelect = (plan: Plan) => {
    const priceId = getPriceId(plan.name);
    setSelectedPlan({ ...plan, priceId });
  };

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please log in first", description: "You need an account to continue" });
      setLocation("/auth");
      return;
    }

    if (!selectedPlan?.priceId) {
      toast({ title: "Error", description: "Plan not available for checkout", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await api.createCheckoutSession(selectedPlan.priceId, selectedPlan.name);
      if (error) {
        toast({ title: "Checkout Error", description: error, variant: "destructive" });
        return;
      }
      
      if (data?.url) {
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            downloadSpeed: selectedPlan.speed,
            uploadSpeed: selectedPlan.upload,
            serviceAddress: qualification?.address || coverageResult?.normalizedAddress || address,
            locId: qualification?.locId,
            technology: qualification?.technology || coverageResult?.technology,
            contactName,
            contactEmail,
            contactPhone,
            preferredDate: preferredDate || undefined,
          }),
        });

        const orderData = await orderResponse.json();
        if (orderData.success) {
          setOrderResult(orderData);
        }

        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Error", description: "Payment processing failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
              isCompleted ? "bg-primary border-primary text-primary-foreground" :
              isActive ? "border-primary text-primary" :
              "border-muted text-muted-foreground"
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`hidden sm:block ml-2 text-sm font-medium ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                isCompleted ? "bg-primary" : "bg-muted"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderAddressStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Check Your Address
        </CardTitle>
        <CardDescription>
          Enter your service address to check NBN availability and technology type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Enter your full address (e.g., 123 Main St, Sydney NSW 2000)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1"
            data-testid="input-address"
          />
          <Button onClick={handleCheckCoverage} disabled={isCheckingCoverage} data-testid="button-check-address">
            {isCheckingCoverage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Check Address
          </Button>
        </div>

        {coverageResult && (
          <Alert className={coverageResult.available !== false ? "border-green-500" : "border-destructive"}>
            <div className="flex items-start gap-3">
              {coverageResult.technology?.toLowerCase().includes("wireless") ? 
                <Wifi className="h-5 w-5 text-primary" /> : 
                <Cable className="h-5 w-5 text-primary" />
              }
              <div className="flex-1">
                <AlertTitle>{coverageResult.available !== false ? "NBN Available!" : "Limited Availability"}</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <p><strong>Address:</strong> {coverageResult.normalizedAddress}</p>
                  <p><strong>Technology:</strong> {coverageResult.technology}</p>
                  <p><strong>Max Speed:</strong> {coverageResult.maxTier}</p>
                  {coverageResult.suburb && <p><strong>Suburb:</strong> {coverageResult.suburb}, {coverageResult.state}</p>}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {coverageResult?.available !== false && coverageResult && (
          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep("qualification")} data-testid="button-continue-qualification">
              Continue to Qualification <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderQualificationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Service Qualification
        </CardTitle>
        <CardDescription>
          We'll verify your service eligibility and generate your unique NBN identifiers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p><strong>Address:</strong> {coverageResult?.normalizedAddress}</p>
          <p><strong>Technology:</strong> {coverageResult?.technology}</p>
          <p><strong>Max Speed:</strong> {coverageResult?.maxTier}</p>
        </div>

        {!qualification ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Click below to perform a formal service qualification. This will:
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2 mb-6">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Generate your unique LOC ID (Location ID)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Confirm available bandwidth profiles</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Verify service class and technology</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Create SQ (Service Qualification) reference</li>
            </ul>
            <Button onClick={handleQualification} disabled={isQualifying} size="lg" data-testid="button-qualify">
              {isQualifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Perform Service Qualification
            </Button>
          </div>
        ) : (
          <Alert className="border-green-500">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <AlertTitle>Service Qualified Successfully</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>LOC ID:</strong> {qualification.locId}</div>
                <div><strong>CSA ID:</strong> {qualification.csaId}</div>
                <div><strong>Technology:</strong> {qualification.technology}</div>
                <div><strong>Service Class:</strong> {qualification.serviceClass}</div>
                <div><strong>Max Download:</strong> {qualification.maxDownload} Mbps</div>
                <div><strong>Max Upload:</strong> {qualification.maxUpload} Mbps</div>
                <div><strong>Bandwidth Profile:</strong> {qualification.bandwidthProfile}</div>
                <div><strong>SQ Reference:</strong> {qualification.sqReference}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("address")} data-testid="button-back-address">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {qualification && (
            <Button onClick={() => setCurrentStep("details")} data-testid="button-continue-details">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Your Details
        </CardTitle>
        <CardDescription>
          Enter your contact information for the service installation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactName"
                placeholder="John Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="pl-10"
                data-testid="input-contact-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactEmail"
                type="email"
                placeholder="john@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="pl-10"
                data-testid="input-contact-email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactPhone"
                type="tel"
                placeholder="0412 345 678"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="pl-10"
                data-testid="input-contact-phone"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredDate">Preferred Connection Date (Optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="preferredDate"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-preferred-date"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4" />
            <strong>Service Address</strong>
          </div>
          <p className="text-sm text-muted-foreground">{qualification?.address || coverageResult?.normalizedAddress}</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("qualification")} data-testid="button-back-qualification">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleDetailsSubmit} data-testid="button-continue-plan">
            Continue to Plan Selection <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPlanStep = () => {
    const availablePlans = getAvailablePlans();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Select Your Plan
          </CardTitle>
          <CardDescription>
            Choose a plan that suits your needs. All plans include unlimited data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan?.id === plan.id ? "border-primary ring-2 ring-primary" : ""
                }`}
                onClick={() => handlePlanSelect(plan)}
                data-testid={`card-plan-${plan.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{plan.name}</h3>
                    {selectedPlan?.id === plan.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    ${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.speed} Mbps down / {plan.upload} Mbps up
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlan && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Selected: {selectedPlan.name}</AlertTitle>
              <AlertDescription>
                ${selectedPlan.price}/month - {selectedPlan.speed} Mbps download, {selectedPlan.upload} Mbps upload
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep("details")} data-testid="button-back-details">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={() => setCurrentStep("payment")} 
              disabled={!selectedPlan}
              data-testid="button-continue-payment"
            >
              Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Order Summary & Payment
        </CardTitle>
        <CardDescription>
          Review your order and proceed to secure payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-bold">{selectedPlan?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedPlan?.speed} Mbps download / {selectedPlan?.upload} Mbps upload
              </p>
            </div>
            <div className="text-2xl font-bold">${selectedPlan?.price}/mo</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Service Address:</strong>
              <p className="text-muted-foreground">{qualification?.address || coverageResult?.normalizedAddress}</p>
            </div>
            <div>
              <strong>Technology:</strong>
              <p className="text-muted-foreground">{qualification?.technology || coverageResult?.technology}</p>
            </div>
            <div>
              <strong>LOC ID:</strong>
              <p className="text-muted-foreground">{qualification?.locId || "Pending"}</p>
            </div>
            <div>
              <strong>SQ Reference:</strong>
              <p className="text-muted-foreground">{qualification?.sqReference || "Pending"}</p>
            </div>
            <div>
              <strong>Contact:</strong>
              <p className="text-muted-foreground">{contactName}</p>
            </div>
            <div>
              <strong>Phone:</strong>
              <p className="text-muted-foreground">{contactPhone}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2">What happens next?</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Complete secure payment via Stripe</li>
            <li>Receive order confirmation email</li>
            <li>NBN connection provisioned (5-7 business days)</li>
            <li>AVC ID assigned when service is active</li>
            <li>Welcome pack with modem instructions sent</li>
          </ol>
        </div>

        {!user && (
          <Alert variant="destructive">
            <AlertTitle>Account Required</AlertTitle>
            <AlertDescription>
              Please <a href="/auth" className="underline font-semibold">log in or create an account</a> to continue with payment.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("plan")} data-testid="button-back-plan">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isSubmitting || !user}
            className="bg-gradient-brand"
            size="lg"
            data-testid="button-pay-now"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Pay ${selectedPlan?.price}/mo Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfirmationStep = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle>Order Submitted Successfully!</CardTitle>
        <CardDescription>
          Your NBN service order has been submitted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderResult && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Order Reference:</strong></div>
              <div>{orderResult.orderReference}</div>
              <div><strong>NBN Order ID:</strong></div>
              <div>{orderResult.nbnOrderId || "Processing"}</div>
              <div><strong>AVC ID:</strong></div>
              <div>{orderResult.avcId || "Assigned upon activation"}</div>
              <div><strong>Estimated Connection:</strong></div>
              <div>{orderResult.estimatedConnectionDate ? new Date(orderResult.estimatedConnectionDate).toLocaleDateString() : "5-7 business days"}</div>
            </div>
          </div>
        )}

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertTitle>Check Your Email</AlertTitle>
          <AlertDescription>
            We've sent a confirmation to {contactEmail} with your order details and next steps.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-dashboard">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "address": return renderAddressStep();
      case "qualification": return renderQualificationStep();
      case "details": return renderDetailsStep();
      case "plan": return renderPlanStep();
      case "payment": return renderPaymentStep();
      case "confirmation": return renderConfirmationStep();
      default: return renderAddressStep();
    }
  };

  return (
    <div className="container py-8 px-4 md:px-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Sign Up for BroNET</h1>
        <p className="text-muted-foreground">Complete the steps below to get connected to fast NBN internet</p>
      </div>

      {renderStepIndicator()}
      {renderCurrentStep()}
    </div>
  );
}
