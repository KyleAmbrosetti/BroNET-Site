import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddressSearch } from "@/components/address-search";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { api } from "@/lib/api";
import { 
  MapPin, CheckCircle2, Loader2, ArrowRight, ArrowLeft, 
  Wifi, Cable, User, CreditCard, Phone, Mail,
  Calendar, Zap, Lock, Eye, EyeOff, Router, ChevronDown, ChevronUp,
  Tag, FileText, Info, Check, Package
} from "lucide-react";

type Step = "plan" | "details" | "account" | "payment";

type CoverageResult = {
  normalizedAddress: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  technology?: string;
  maxTier?: string;
  available?: boolean;
  locId?: string;
};

type NtdOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  isFree?: boolean;
};

type SuperloopQualification = {
  locId: string;
  locationId: string;
  qualificationSearchId: string;
  remoteQualificationSearchId: string;
  technologyType: string;
  serviceClass: number;
  maxDownload: number;
  maxUpload: number;
  available: boolean;
  region?: string;
  poi?: string;
  poiName?: string;
  hasActivePOTS?: boolean;
  serviceType?: string;
  generationTwoNtds?: any[];
  firstOrAdditionalNtdPlans?: string[];
  generationOneNtdPlans?: string[];
  generationTwoNtdPlans?: string[];
  infrastructures?: any[];
  infrastructureInstallationOptions?: string[];
  plans?: any[];
};

type QualificationResult = {
  locId: string;
  csaId?: string;
  locationId?: string;
  qualificationSearchId?: string;
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
  generationTwoNtds?: any[];
  requiresGen2Ntd?: boolean;
  ntdOptions?: NtdOption[];
};

type Plan = {
  id: string;
  name: string;
  speed: number;
  upload: number;
  price: number;
  typicalEvening?: number;
  priceId?: string;
};

type RouterOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  commitment?: number;
  image?: string;
};

const getRouterOptions = (planSpeed: number): RouterOption[] => {
  const options: RouterOption[] = [];
  
  // Free modem on ALL plans (36-month commitment)
  if (planSpeed >= 2000) {
    // eero Pro 7 for NBN 2000 plans
    options.push({ id: "free", name: "Free eero Pro 7", description: "Premium tri-band WiFi 7 mesh router included (36-month commitment)", price: 0, commitment: 36 });
  } else {
    // eero 7 for all other plans
    options.push({ id: "free", name: "Free eero 7", description: "High-performance WiFi 7 mesh router included (36-month commitment)", price: 0, commitment: 36 });
  }
  
  // BYO option always available
  options.push({ id: "byo", name: "BYO Router", description: "Use your own compatible router", price: 0 });
  
  return options;
};

const STEPS: { id: Step; label: string; number: number }[] = [
  { id: "plan", label: "Plan", number: 1 },
  { id: "details", label: "Connect", number: 2 },
  { id: "account", label: "Account", number: 3 },
  { id: "payment", label: "Payment", number: 4 },
];

export default function SignupWizard() {
  const [currentStep, setCurrentStep] = useState<Step>("plan");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login, signup } = useUser();

  // Address & Coverage
  const [address, setAddress] = useState("");
  const [superloopLocationId, setSuperloopLocationId] = useState<string | null>(null);
  const [isCheckingCoverage, setIsCheckingCoverage] = useState(false);
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [qualification, setQualification] = useState<QualificationResult | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);
  const [selectedNtdOption, setSelectedNtdOption] = useState<string | null>(null);
  
  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [stripeProducts, setStripeProducts] = useState<any[]>([]);
  
  // Router selection
  const [selectedRouter, setSelectedRouter] = useState<string>("free");
  
  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  
  // Contact details
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [avcId, setAvcId] = useState("");
  
  // Account
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  
  // Order
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  
  // Mobile order summary
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Reset mobile summary when step changes
  useEffect(() => {
    setShowMobileSummary(false);
  }, [currentStep]);

  // Validate we can be on current step (defensive guard)
  useEffect(() => {
    if (currentStep === "details" && (!selectedPlan || !coverageResult)) {
      setCurrentStep("plan");
    }
    if (currentStep === "account" && (!selectedPlan || !coverageResult || !contactName || !contactEmail || !contactPhone)) {
      setCurrentStep("plan");
    }
    if (currentStep === "payment" && (!selectedPlan || !coverageResult)) {
      setCurrentStep("plan");
    }
  }, [currentStep, selectedPlan, coverageResult, contactName, contactEmail, contactPhone]);

  // Parse URL parameters for pre-selected plan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    const speedParam = params.get('speed');
    const priceParam = params.get('price');
    const addressParam = params.get('address');
    
    if (addressParam) {
      setAddress(addressParam);
      // Auto-check coverage for pre-filled address
      handleCheckCoverage(addressParam);
    }
    
    if (planParam && speedParam && priceParam) {
      setSelectedPlan({
        id: planParam.toLowerCase().replace(/\s+/g, ''),
        name: planParam,
        speed: parseInt(speedParam),
        upload: parseInt(speedParam) >= 1000 ? 50 : 20,
        price: parseFloat(priceParam),
      });
    }
  }, []);

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

  // Update priceId when stripeProducts load (for URL-parameter plans)
  useEffect(() => {
    if (selectedPlan && !selectedPlan.priceId && stripeProducts.length > 0) {
      const product = stripeProducts.find(p => p.name === selectedPlan.name);
      if (product?.prices?.[0]?.id) {
        setSelectedPlan({ ...selectedPlan, priceId: product.prices[0].id });
      }
    }
  }, [stripeProducts, selectedPlan]);

  const getStepIndex = (step: Step) => STEPS.findIndex(s => s.id === step);
  const currentStepIndex = getStepIndex(currentStep);

  const handleAddressSelect = (suggestion: { 
    address: string; 
    suburb?: string; 
    state?: string; 
    postcode?: string;
    locationId?: string;
  }) => {
    setAddress(suggestion.address);
    if (suggestion.locationId) {
      setSuperloopLocationId(suggestion.locationId);
    }
  };

  const handleCheckCoverage = async (addressToCheck?: string) => {
    const addr = addressToCheck || address;
    if (!addr.trim()) {
      toast({ title: "Please enter an address", variant: "destructive" });
      return;
    }

    setIsCheckingCoverage(true);
    setSelectedNtdOption(null);
    
    try {
      // If we have a Superloop location ID, use Superloop qualification directly
      if (superloopLocationId) {
        const { data, error } = await api.qualifySuperloopLocation(superloopLocationId);
        if (data?.success && data.qualification) {
          const sq = data.qualification;
          
          // Map NTD options for FTTP/HFC
          const ntdOptions: NtdOption[] = [];
          if (sq.generationTwoNtds && sq.generationTwoNtds.length > 0) {
            for (const ntd of sq.generationTwoNtds) {
              ntdOptions.push({
                id: ntd.ntdOption || ntd.id,
                name: getNtdDisplayName(ntd.ntdOption || ntd.id),
                description: ntd.description || getNtdDescription(ntd.ntdOption || ntd.id),
                price: ntd.price || 0,
                isFree: ntd.price === 0 || ntd.isFree,
              });
            }
          }
          
          // Set coverage result from Superloop data
          setCoverageResult({
            normalizedAddress: addr,
            technology: sq.technologyType,
            available: sq.available,
            locId: sq.locId,
          });
          
          // Set qualification with Gen 2 NTD info
          const requiresGen2Ntd = (sq.generationTwoNtdPlans?.length ?? 0) > 0 && 
                                   !(sq.generationOneNtdPlans?.length ?? 0);
          
          setQualification({
            locId: sq.locId,
            locationId: sq.locationId,
            qualificationSearchId: sq.qualificationSearchId,
            address: addr,
            technology: sq.technologyType,
            maxDownload: sq.maxDownload,
            maxUpload: sq.maxUpload,
            serviceClass: sq.serviceClass,
            sqReference: sq.remoteQualificationSearchId || sq.qualificationSearchId,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            available: sq.available,
            generationTwoNtds: sq.generationTwoNtds,
            requiresGen2Ntd,
            ntdOptions,
          });
          
          // Auto-select first NTD option if available
          if (ntdOptions.length > 0) {
            const freeOption = ntdOptions.find(o => o.isFree || o.price === 0);
            setSelectedNtdOption(freeOption?.id || ntdOptions[0].id);
          }
          
          setIsCheckingCoverage(false);
          return;
        } else if (error) {
          console.warn('Superloop qualification failed, falling back to standard check:', error);
        }
      }
      
      // Fallback to standard coverage check
      const { data, error } = await api.checkCoverage(addr);
      if (error || !data?.success) {
        toast({ title: "Check failed", description: error || "Unable to verify address", variant: "destructive" });
        return;
      }

      if (data.result) {
        setCoverageResult(data.result);
        // Auto-qualify the service
        await handleQualification(data.result);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to check coverage", variant: "destructive" });
    } finally {
      setIsCheckingCoverage(false);
    }
  };

  const getNtdDisplayName = (ntdOption: string): string => {
    switch (ntdOption) {
      case '1_PORT': return 'Standard NTD (1 Port)';
      case '4_PORT': return 'Business NTD (4 Port)';
      case '4_PORT_RESIDENTIAL': return 'Premium NTD (4 Port)';
      case 'NTD_2.5': return 'HFC NTD 2.5G';
      default: return ntdOption;
    }
  };

  const getNtdDescription = (ntdOption: string): string => {
    switch (ntdOption) {
      case '1_PORT': return 'Standard single-port network device';
      case '4_PORT': return 'Business-grade 4-port network device';
      case '4_PORT_RESIDENTIAL': return 'Residential 4-port network device - required for speeds above 1000 Mbps';
      case 'NTD_2.5': return 'High-speed HFC device with 2.5Gbps capability';
      default: return 'Network termination device';
    }
  };

  const handleQualification = async (coverage: CoverageResult) => {
    setIsQualifying(true);
    try {
      const response = await fetch("/api/orders/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: coverage.normalizedAddress,
          technology: coverage.technology,
          postcode: coverage.postcode,
          suburb: coverage.suburb,
          state: coverage.state,
          locId: coverage.locId,
        }),
      });

      const data = await response.json();
      if (data.success && data.qualification) {
        setQualification(data.qualification);
      }
    } catch (err) {
      console.error("Qualification failed:", err);
    } finally {
      setIsQualifying(false);
    }
  };

  const getAvailablePlans = (): Plan[] => {
    // Get max speed from qualification first, then try to parse from coverageResult.maxTier
    let maxSpeed = qualification?.maxDownload || 2000;
    if (!qualification?.maxDownload && coverageResult?.maxTier) {
      // Parse maxTier string like "75 Mbps" or "1000 Mbps"
      const tierMatch = coverageResult.maxTier.match(/(\d+)/);
      if (tierMatch) {
        maxSpeed = parseInt(tierMatch[1], 10);
      }
    }
    
    // Determine technology type - check both qualification and coverage result
    const technology = qualification?.technology || coverageResult?.technology || "";
    const techLower = technology.toLowerCase();
    
    // Fixed Wireless plans only for wireless technology
    const isWireless = techLower.includes("wireless") || techLower.includes("fixed wireless");
    
    // Satellite has very limited speeds
    const isSatellite = techLower.includes("satellite");

    if (isWireless) {
      return [
        { id: "fw25", name: "Fixed Wireless 25", speed: 25, upload: 5, price: 59, typicalEvening: 25 },
        { id: "fw50", name: "Fixed Wireless 50", speed: 50, upload: 10, price: 69, typicalEvening: 47 },
        { id: "fw75", name: "Fixed Wireless 75", speed: 75, upload: 10, price: 79, typicalEvening: 70 },
        { id: "fwplus", name: "Fixed Wireless Plus", speed: 100, upload: 20, price: 89, typicalEvening: 90 },
      ].filter(p => p.speed <= maxSpeed);
    }

    if (isSatellite) {
      return [
        { id: "sat25", name: "Satellite 25", speed: 25, upload: 5, price: 69, typicalEvening: 20 },
        { id: "sat50", name: "Satellite 50", speed: 50, upload: 10, price: 89, typicalEvening: 40 },
      ].filter(p => p.speed <= maxSpeed);
    }

    // NBN fibre/HFC/FTTC/FTTB plans - show all that fit within maxSpeed
    const nbnPlans = [
      { id: "nbn50", name: "NBN 50/20", speed: 50, upload: 20, price: 79, typicalEvening: 50 },
      { id: "nbn100", name: "NBN 100/20", speed: 100, upload: 20, price: 89, typicalEvening: 98 },
      { id: "nbn250", name: "NBN 250/100", speed: 250, upload: 100, price: 94, typicalEvening: 245 },
      { id: "nbn500", name: "NBN 500/200", speed: 500, upload: 200, price: 115, typicalEvening: 480 },
      { id: "nbn1000", name: "NBN 1000/400", speed: 1000, upload: 400, price: 136, typicalEvening: 900 },
      { id: "nbn2000-200", name: "NBN 2000/200", speed: 2000, upload: 200, price: 162, typicalEvening: 1800 },
      { id: "nbn2000-500", name: "NBN 2000/500", speed: 2000, upload: 500, price: 208, typicalEvening: 1800 },
    ];
    
    return nbnPlans.filter(p => p.speed <= maxSpeed);
  };

  const getPriceId = (planName: string) => {
    const product = stripeProducts.find(p => p.name === planName);
    return product?.prices?.[0]?.id;
  };

  const handlePlanSelect = (plan: Plan) => {
    const priceId = getPriceId(plan.name);
    setSelectedPlan({ ...plan, priceId });
    
    // Default to free router (now available on all plans)
    if (selectedRouter !== "free" && selectedRouter !== "premium") {
      setSelectedRouter("free");
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "bronet10") {
      setPromoApplied(true);
      setPromoDiscount(10);
      toast({ title: "Promo code applied!", description: "$10/month discount applied" });
    } else {
      toast({ title: "Invalid code", description: "Please check your promo code", variant: "destructive" });
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoCode("");
    toast({ title: "Promo code removed" });
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

    if (user) {
      setCurrentStep("payment");
    } else {
      setCurrentStep("account");
    }
  };

  const handleAccountSubmit = async () => {
    if (authMode === "signup") {
      if (!password || !confirmPassword) {
        toast({ title: "Please enter a password", variant: "destructive" });
        return;
      }
      if (password.length < 8) {
        toast({ title: "Password too short", description: "Password must be at least 8 characters", variant: "destructive" });
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: "Passwords don't match", variant: "destructive" });
        return;
      }

      const nameParts = contactName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setIsCreatingAccount(true);
      try {
        await signup({
          email: contactEmail,
          password,
          firstName,
          lastName,
        });
        setCurrentStep("payment");
      } catch (err: any) {
        // Error already shown by useUser hook
      } finally {
        setIsCreatingAccount(false);
      }
    } else {
      if (!password) {
        toast({ title: "Please enter your password", variant: "destructive" });
        return;
      }

      setIsCreatingAccount(true);
      try {
        await login(contactEmail, password);
        setCurrentStep("payment");
      } catch (err: any) {
        // Error already shown by useUser hook
      } finally {
        setIsCreatingAccount(false);
      }
    }
  };

  const handlePayment = async () => {
    if (!user) {
      setCurrentStep("account");
      return;
    }

    if (!selectedPlan?.priceId) {
      toast({ title: "Error", description: "Plan not available for checkout", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await api.createCheckoutSession(selectedPlan.priceId, selectedPlan.name, {
        planId: selectedPlan.id,
        serviceAddress: qualification?.address || coverageResult?.normalizedAddress || address,
        locId: qualification?.locId,
        csaId: qualification?.csaId,
        sqReference: qualification?.sqReference,
        avcId: avcId || undefined,
        technology: qualification?.technology || coverageResult?.technology,
        downloadSpeed: selectedPlan.speed,
        uploadSpeed: selectedPlan.upload,
        contactName,
        contactEmail,
        contactPhone,
        preferredDate: preferredDate || undefined,
        routerOption: selectedRouter,
        promoCode: promoApplied ? promoCode : undefined,
        locationId: qualification?.locationId || undefined,
        qualificationSearchId: qualification?.qualificationSearchId || undefined,
        ntdOption: selectedNtdOption || undefined,
      });
      
      if (error) {
        toast({ title: "Checkout Error", description: error, variant: "destructive" });
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Error", description: "Payment processing failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonthlyTotal = () => {
    if (!selectedPlan) return 0;
    return selectedPlan.price - promoDiscount;
  };

  const getSelectedRouterDetails = () => {
    return getRouterOptions(selectedPlan?.speed || 0).find(r => r.id === selectedRouter);
  };

  // Step Progress Indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {STEPS.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${
                isCompleted ? "bg-green-500 text-white" :
                isActive ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span className={`mt-2 text-xs font-medium text-center ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                isCompleted ? "bg-green-500" : "bg-muted"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Order Summary Sidebar (Desktop)
  const renderOrderSummary = () => (
    <Card className="sticky top-24 border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Your order summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan */}
        {selectedPlan ? (
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="p-2 bg-primary/10 rounded">
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{selectedPlan.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedPlan.speed}/{selectedPlan.upload} Mbps
              </div>
              {selectedPlan.typicalEvening && (
                <div className="text-xs text-muted-foreground">
                  Typical evening: {selectedPlan.typicalEvening} Mbps
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold">${selectedPlan.price}</div>
              <div className="text-xs text-muted-foreground">/mth</div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg text-center text-muted-foreground">
            <Wifi className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <div className="text-sm">No plan selected</div>
          </div>
        )}

        {/* Router */}
        {selectedRouter && selectedRouter !== "byo" && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Router className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">{getSelectedRouterDetails()?.name}</div>
              <div className="text-xs text-muted-foreground">
                {getSelectedRouterDetails()?.commitment ? `${getSelectedRouterDetails()?.commitment}-month commitment` : "No commitment"}
              </div>
            </div>
            <div className="text-sm font-medium text-green-600">FREE</div>
          </div>
        )}

        {/* Address */}
        {coverageResult && (
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="text-sm">{coverageResult.normalizedAddress}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {coverageResult.technology}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Promo Code */}
        <div>
          <Label className="text-sm mb-2 block">Promo code</Label>
          {promoApplied ? (
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Tag className="h-4 w-4" />
                <span className="text-sm font-medium">{promoCode}</span>
                <span className="text-xs">(-${promoDiscount}/mth)</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRemovePromo}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                data-testid="button-remove-promo"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="text-sm"
                data-testid="input-promo-code"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleApplyPromo}
                disabled={!promoCode}
                data-testid="button-apply-promo"
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          {promoApplied && selectedPlan && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Promo discount</span>
              <span>-${promoDiscount}/mth</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg">
            <span>Total monthly cost</span>
            <span>${getMonthlyTotal()}/mth</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total min cost</span>
            <span>${getMonthlyTotal()}</span>
          </div>
        </div>

        {/* NBN Identifiers */}
        {qualification && (
          <>
            <Separator />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LOC ID</span>
                <span className="font-mono">{qualification.locId}</span>
              </div>
              {qualification.csaId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CSA ID</span>
                  <span className="font-mono">{qualification.csaId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">SQ Reference</span>
                <span className="font-mono">{qualification.sqReference}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Mobile Order Summary (Collapsible)
  const renderMobileOrderSummary = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
      <Collapsible open={showMobileSummary} onOpenChange={setShowMobileSummary}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span className="font-medium">Order summary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">${getMonthlyTotal()}/mth</span>
              {showMobileSummary ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 max-h-64 overflow-y-auto">
            {selectedPlan && (
              <div className="flex justify-between items-center py-2 border-t">
                <div>
                  <div className="font-medium">{selectedPlan.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedPlan.speed} Mbps</div>
                </div>
                <div className="font-bold">${selectedPlan.price}/mth</div>
              </div>
            )}
            {promoApplied && (
              <div className="flex justify-between text-green-600 text-sm">
                <span>Promo discount</span>
                <span>-${promoDiscount}/mth</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  // Step 1: Plan Selection
  const renderPlanStep = () => {
    const availablePlans = getAvailablePlans();

    return (
      <div className="space-y-6">
        {/* Address Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddressSearch
              value={address}
              onChange={(val) => {
                setAddress(val);
                setSuperloopLocationId(null);
              }}
              onSelect={handleAddressSelect}
              onSearch={() => handleCheckCoverage()}
              isSearching={isCheckingCoverage || isQualifying}
              placeholder="Enter your street address..."
              buttonText={isCheckingCoverage ? "Checking..." : "Check Address"}
              inputId="service-address"
            />
            
            {coverageResult && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-300">
                      NBN Available at this address
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                      {coverageResult.technology} • Max speed: {coverageResult.maxTier}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Selection */}
        {coverageResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Choose Your Plan
              </CardTitle>
              <CardDescription>
                All plans include unlimited data with no lock-in contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${
                      selectedPlan?.id === plan.id 
                        ? "border-primary bg-primary/5" 
                        : "border-muted"
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                    data-testid={`plan-option-${plan.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan?.id === plan.id 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground"
                        }`}>
                          {selectedPlan?.id === plan.id && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.speed} Mbps / {plan.upload} Mbps upload
                          </div>
                          {plan.typicalEvening && (
                            <div className="text-xs text-muted-foreground">
                              Typical evening speed: {plan.typicalEvening} Mbps
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${plan.price}</div>
                        <div className="text-sm text-muted-foreground">/mth</div>
                      </div>
                    </div>
                    {plan.speed >= 1000 && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500">
                        Ultrafast
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NTD Selection for High-Speed FTTP/HFC Plans */}
        {selectedPlan && selectedPlan.speed > 1000 && qualification?.ntdOptions && qualification.ntdOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cable className="h-5 w-5" />
                Network Device Upgrade
              </CardTitle>
              <CardDescription>
                Speeds above 1000 Mbps require a Generation 2 Network Termination Device (NTD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>NBN Upgrade Required</AlertTitle>
                <AlertDescription>
                  Your selected {selectedPlan.speed} Mbps plan requires an upgraded network device. 
                  This is a one-time installation by an NBN technician.
                </AlertDescription>
              </Alert>
              <RadioGroup value={selectedNtdOption || ''} onValueChange={setSelectedNtdOption}>
                <div className="grid gap-3">
                  {qualification.ntdOptions.map((ntd) => (
                    <div
                      key={ntd.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedNtdOption === ntd.id 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedNtdOption(ntd.id)}
                      data-testid={`ntd-option-${ntd.id}`}
                    >
                      <RadioGroupItem value={ntd.id} id={`ntd-${ntd.id}`} />
                      <div className="flex-1">
                        <Label htmlFor={`ntd-${ntd.id}`} className="font-medium cursor-pointer">
                          {ntd.name}
                        </Label>
                        <div className="text-sm text-muted-foreground">{ntd.description}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${ntd.isFree ? 'text-green-600' : ''}`}>
                          {ntd.isFree || ntd.price === 0 ? "FREE" : `$${ntd.price}`}
                        </div>
                        {!ntd.isFree && ntd.price > 0 && (
                          <div className="text-xs text-muted-foreground">one-time</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Router Selection */}
        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Router className="h-5 w-5" />
                Router Options
              </CardTitle>
              <CardDescription>
                All plans include a free modem - or upgrade to premium WiFi 7
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedRouter} onValueChange={setSelectedRouter}>
                <div className="grid gap-3">
                  {getRouterOptions(selectedPlan.speed).map((router) => (
                    <div
                      key={router.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedRouter === router.id 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedRouter(router.id)}
                    >
                      <RadioGroupItem value={router.id} id={router.id} />
                      <div className="flex-1">
                        <Label htmlFor={router.id} className="font-medium cursor-pointer">
                          {router.name}
                        </Label>
                        <div className="text-sm text-muted-foreground">{router.description}</div>
                        {router.commitment && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {router.commitment}-month commitment required
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {router.price === 0 ? "FREE" : `$${router.price}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button 
            size="lg" 
            onClick={() => setCurrentStep("details")}
            disabled={!selectedPlan || !coverageResult}
            className="bg-gradient-brand"
            data-testid="button-continue-details"
          >
            Continue to Your Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Step 2: Details
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
      <CardContent className="space-y-6">
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
            <Label htmlFor="preferredDate">Preferred Connection Date</Label>
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

        <div className="space-y-2">
          <Label htmlFor="avcId">AVC ID (Optional - for transfers)</Label>
          <div className="relative">
            <Cable className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="avcId"
              placeholder="AVC123456789012"
              value={avcId}
              onChange={(e) => setAvcId(e.target.value.toUpperCase())}
              className="pl-10"
              data-testid="input-avc-id"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            If you're transferring from another provider, enter your existing AVC ID. You can find this on your current provider's bill.
          </p>
        </div>

        <Separator />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Service Address</AlertTitle>
          <AlertDescription>
            {coverageResult?.normalizedAddress || address}
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("plan")} data-testid="button-back-plan">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleDetailsSubmit} className="bg-gradient-brand" data-testid="button-continue-account">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Account
  const renderAccountStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {authMode === "signup" ? "Create Your Account" : "Log In"}
        </CardTitle>
        <CardDescription>
          {authMode === "signup" 
            ? "Create an account to manage your service"
            : "Log in with your existing account"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={authMode === "signup" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setAuthMode("signup")}
            data-testid="button-tab-signup"
          >
            New Account
          </Button>
          <Button
            variant={authMode === "login" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setAuthMode("login")}
            data-testid="button-tab-login"
          >
            Existing Account
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input 
              value={contactEmail} 
              onChange={(e) => setContactEmail(e.target.value)}
              type="email"
              placeholder="your@email.com"
              data-testid="input-account-email"
            />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === "signup" ? "Create a password (min 8 characters)" : "Enter your password"}
                data-testid="input-account-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {authMode === "signup" && (
            <div>
              <Label>Confirm Password</Label>
              <Input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                data-testid="input-account-confirm-password"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("details")} data-testid="button-back-details">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={handleAccountSubmit}
            disabled={isCreatingAccount}
            className="bg-gradient-brand"
            data-testid="button-create-account"
          >
            {isCreatingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {authMode === "signup" ? "Create Account" : "Log In"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 4: Payment
  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Review & Pay
        </CardTitle>
        <CardDescription>
          Review your order and proceed to secure payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{selectedPlan?.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedPlan?.speed} Mbps / {selectedPlan?.upload} Mbps upload
              </div>
            </div>
            <div className="text-2xl font-bold">${selectedPlan?.price}/mth</div>
          </div>
          
          {promoApplied && (
            <div className="flex justify-between text-green-600">
              <span>Promo discount (6 months)</span>
              <span>-${promoDiscount}/mth</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Monthly Total</span>
            <span>${getMonthlyTotal()}/mth</span>
          </div>
        </div>

        {/* Service Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Service Address</div>
            <div className="font-medium">{coverageResult?.normalizedAddress}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Technology</div>
            <div className="font-medium">{qualification?.technology || coverageResult?.technology}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Contact</div>
            <div className="font-medium">{contactName}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div className="font-medium">{contactPhone}</div>
          </div>
        </div>
        
        {/* NBN Location ID */}
        {qualification?.locId && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Cable className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">NBN Location ID:</span>
              <span className="font-mono font-medium text-blue-700 dark:text-blue-300" data-testid="text-loc-id">
                {qualification.locId}
              </span>
            </div>
          </div>
        )}

        {/* AVC ID (for transfers) */}
        {avcId && (
          <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-sm">
              <Cable className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">Transfer AVC ID:</span>
              <span className="font-mono font-medium text-purple-700 dark:text-purple-300" data-testid="text-avc-id">
                {avcId}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* What happens next */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>What happens next?</AlertTitle>
          <AlertDescription>
            <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
              <li>Complete secure payment via Stripe</li>
              <li>Receive order confirmation email</li>
              <li>NBN connection provisioned (5-7 business days)</li>
              <li>Router shipped to your address</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(user ? "details" : "account")} 
            data-testid="button-back-from-payment"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={isSubmitting}
            className="bg-gradient-brand"
            size="lg"
            data-testid="button-pay-now"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Pay ${getMonthlyTotal()}/mth Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "plan": return renderPlanStep();
      case "details": return renderDetailsStep();
      case "account": return renderAccountStep();
      case "payment": return renderPaymentStep();
      default: return renderPlanStep();
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="container py-4 px-4 md:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Sign Up for BroNET</h1>
            <a href="tel:0742766387" className="text-sm text-muted-foreground hover:text-foreground">
              <Phone className="inline h-4 w-4 mr-1" />
              07 4276 6387
            </a>
          </div>
        </div>
      </div>

      <div className="container py-6 px-4 md:px-6">
        {renderStepIndicator()}
        
        <div className="grid lg:grid-cols-[1fr,380px] gap-6">
          {/* Main Content */}
          <div>
            {renderCurrentStep()}
          </div>

          {/* Order Summary Sidebar (Desktop) */}
          <div className="hidden lg:block">
            {renderOrderSummary()}
          </div>
        </div>
      </div>

      {/* Mobile Order Summary */}
      {renderMobileOrderSummary()}
    </div>
  );
}
