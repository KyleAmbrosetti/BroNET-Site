import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  CreditCard, 
  Download, 
  Upload, 
  Wifi, 
  MessageSquare, 
  Settings, 
  LogOut,
  User as UserIcon,
  ChevronRight,
  PlusCircle,
  Mail,
  Package,
  MapPin,
  Lock,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  replies: any[];
};

type UsageData = {
  month: string;
  download: number;
  upload: number;
};

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
};

type ModemEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  product: string;
  quantity: number;
  message: string | null;
  status: string;
  createdAt: string;
};

type BillingRecord = {
  id: string;
  amount: string;
  description: string;
  planId: string | null;
  createdAt: string;
};

const PLANS = [
  { id: 'nbn25', name: 'NBN 25', speed: '25/10 Mbps', price: '$59' },
  { id: 'nbn50', name: 'NBN 50', speed: '50/20 Mbps', price: '$69' },
  { id: 'nbn100', name: 'NBN 100', speed: '100/20 Mbps', price: '$89' },
  { id: 'nbn250', name: 'NBN 250', speed: '250/25 Mbps', price: '$109' },
  { id: 'nbn1000', name: 'NBN 1000', speed: '1000/50 Mbps', price: '$139' },
];

export default function Dashboard() {
  const { user, logout, updateProfile } = useUser();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [modemEnquiries, setModemEnquiries] = useState<ModemEnquiry[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const { toast } = useToast();
  
  // New Ticket State
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [serviceAddress, setServiceAddress] = useState(user?.serviceAddress || "");
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Plan Change State
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    
    // Load Data from API
    const loadData = async () => {
      const [ticketsRes, usageRes, messagesRes, modemEnquiriesRes, billingRes] = await Promise.all([
        api.getTickets(),
        api.getUsage(),
        api.getMessages(),
        api.getModemEnquiries(),
        api.getBillingHistory()
      ]);
      
      if (ticketsRes.data) setTickets(ticketsRes.data.tickets);
      if (usageRes.data) setUsage(usageRes.data.usage);
      if (messagesRes.data) setContactMessages(messagesRes.data.messages);
      if (modemEnquiriesRes.data) setModemEnquiries(modemEnquiriesRes.data.enquiries);
      if (billingRes.data) setBillingHistory(billingRes.data.history);
    };
    
    loadData();
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setServiceAddress(user.serviceAddress || "");
  }, [user, setLocation]);

  const handleCreateTicket = async () => {
    if (!user) return;
    const { data, error } = await api.createTicket({
      subject: newTicketSubject,
      message: newTicketMessage,
      status: 'open',
    });
    
    if (error) {
      toast({ title: "Failed to create ticket", description: error, variant: "destructive" });
      return;
    }
    
    const ticketsRes = await api.getTickets();
    if (ticketsRes.data) setTickets(ticketsRes.data.tickets);
    
    setIsTicketDialogOpen(false);
    setNewTicketSubject("");
    setNewTicketMessage("");
    toast({ title: "Ticket created", description: "Support will be in touch shortly." });
  };

  const handleUpdateProfile = () => {
    updateProfile({ firstName, lastName });
  };

  const handleUpdateAddress = async () => {
    const { error } = await api.updateAddress(serviceAddress);
    if (error) {
      toast({ title: "Failed to update address", description: error, variant: "destructive" });
      return;
    }
    updateProfile({ serviceAddress });
    toast({ title: "Address updated" });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    setIsChangingPassword(true);
    const { error } = await api.changePassword(oldPassword, newPassword);
    setIsChangingPassword(false);
    
    if (error) {
      toast({ title: "Failed to change password", description: error, variant: "destructive" });
      return;
    }
    
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Password changed successfully" });
  };

  const handleChangePlan = async (planId: string) => {
    setIsChangingPlan(true);
    const { data, error } = await api.changePlan(planId);
    setIsChangingPlan(false);
    
    if (error) {
      toast({ title: "Failed to change plan", description: error, variant: "destructive" });
      return;
    }
    
    if (data?.user) {
      updateProfile({ planId: data.user.planId });
    }
    
    const billingRes = await api.getBillingHistory();
    if (billingRes.data) setBillingHistory(billingRes.data.history);
    
    toast({ title: "Plan changed successfully" });
  };

  if (!user) return null;

  const nextBillDate = new Date(user.joinedAt);
  nextBillDate.setMonth(nextBillDate.getMonth() + 1);

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.firstName}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing & Plan</TabsTrigger>
            <TabsTrigger value="support">My Tickets</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="modems">Modem Requests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Usage Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Data Usage</CardTitle>
                  <CardDescription>Your consumption for the current billing cycle.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Used: {usage[0]?.download} GB</span>
                    <span className="text-sm text-muted-foreground">Unlimited</span>
                  </div>
                  <Progress value={25} className="h-3 mb-6" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg flex items-center gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                        <Download className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Download</div>
                        <div className="text-xl font-bold">{usage[0]?.download} GB</div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg flex items-center gap-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Upload</div>
                        <div className="text-xl font-bold">{usage[0]?.upload} GB</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Plan Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {user.planId ? user.planId.replace('nbn', 'NBN ') : 'NBN 100'}
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">$89.00/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Speed</span>
                      <span className="font-medium">100/20 Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Bill</span>
                      <span className="font-medium">{format(nextBillDate, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("billing")}>Manage Plan</Button>
                </CardFooter>
              </Card>
            </div>

            {/* Network Status Snippet */}
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">Network Status: Operational</h3>
                    <p className="text-sm text-muted-foreground">No known incidents in your area.</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/support">View Status</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BILLING TAB */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="card-current-plan">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your active internet plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-primary mb-1" data-testid="text-plan-name">
                      {PLANS.find(p => p.id === user.planId)?.name || user.planId?.replace('nbn', 'NBN ') || 'NBN 100'}
                    </div>
                    <div className="text-muted-foreground" data-testid="text-plan-speed">
                      {PLANS.find(p => p.id === user.planId)?.speed || '100/20 Mbps'}
                    </div>
                    <div className="text-xl font-semibold mt-2" data-testid="text-plan-price">
                      {PLANS.find(p => p.id === user.planId)?.price || '$89'}/mo
                    </div>
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">Active</Badge>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Change Plan</Label>
                    <Select 
                      value={user.planId || 'nbn100'} 
                      onValueChange={handleChangePlan}
                      disabled={isChangingPlan}
                      data-testid="select-plan"
                    >
                      <SelectTrigger data-testid="select-plan-trigger">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map(plan => (
                          <SelectItem key={plan.id} value={plan.id} data-testid={`option-plan-${plan.id}`}>
                            {plan.name} - {plan.speed} - {plan.price}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-next-payment">
                <CardHeader>
                  <CardTitle>Next Payment</CardTitle>
                  <CardDescription>Your upcoming billing date</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold" data-testid="text-next-bill-date">
                        {format(nextBillDate, 'MMMM d, yyyy')}
                      </div>
                      <div className="text-muted-foreground" data-testid="text-next-bill-amount">
                        Amount: {PLANS.find(p => p.id === user.planId)?.price || '$89'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-billing-history">
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>Recent transactions and plan changes</CardDescription>
              </CardHeader>
              <CardContent>
                {billingHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-billing-history">
                    No billing history yet.
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="list-billing-history">
                    {billingHistory.map((record) => (
                      <div 
                        key={record.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`billing-record-${record.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-full">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium" data-testid={`billing-description-${record.id}`}>
                              {record.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(record.createdAt), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium" data-testid={`billing-amount-${record.id}`}>
                            ${record.amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TICKETS TAB */}
          <TabsContent value="support">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Support Tickets</h2>
              <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Support Ticket</DialogTitle>
                    <DialogDescription>Describe your issue and we'll help you out.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input 
                        placeholder="e.g. Slow speeds in evening" 
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea 
                        placeholder="Tell us more details..." 
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTicket}>Submit Ticket</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {tickets.length === 0 ? (
                <Card className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-bold text-lg">No tickets yet</h3>
                  <p className="text-muted-foreground">Need help? Create a ticket above.</p>
                </Card>
              ) : (
                tickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                          <CardDescription>Created {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}</CardDescription>
                        </div>
                        <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                          {ticket.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{ticket.message}</p>
                      {ticket.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-muted space-y-4">
                           {ticket.replies.map(reply => (
                             <div key={reply.id} className="text-sm">
                               <div className="font-semibold text-xs text-muted-foreground mb-1">
                                 {reply.sender === 'user' ? 'You' : 'BroNET Support'} • {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                               </div>
                               <p>{reply.message}</p>
                             </div>
                           ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages">
             <Card>
               <CardHeader>
                 <CardTitle>Sent Messages</CardTitle>
                 <CardDescription>History of contact form submissions.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {contactMessages.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       No messages sent yet.
                     </div>
                   ) : (
                     contactMessages.map((msg) => (
                       <div key={msg.id} className="border p-4 rounded-lg flex items-start gap-3">
                         <div className="bg-primary/10 p-2 rounded-full text-primary">
                           <Mail className="h-4 w-4" />
                         </div>
                         <div className="flex-1">
                           <div className="flex justify-between mb-1">
                             <h4 className="font-medium">{msg.topic}</h4>
                             <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                           </div>
                           <p className="text-sm text-muted-foreground">{msg.message}</p>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          {/* MODEM REQUESTS TAB */}
          <TabsContent value="modems">
             <Card>
               <CardHeader>
                 <CardTitle>Modem Purchase Requests</CardTitle>
                 <CardDescription>Track your modem and router enquiries.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {modemEnquiries.length === 0 ? (
                     <div className="text-center py-8">
                       <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                       <p className="text-muted-foreground mb-4">No modem requests yet.</p>
                       <Button variant="outline" asChild>
                         <Link href="/modems">Browse Modems</Link>
                       </Button>
                     </div>
                   ) : (
                     modemEnquiries.map((enquiry) => (
                       <div key={enquiry.id} className="border p-4 rounded-lg flex items-start gap-3" data-testid={`enquiry-${enquiry.id}`}>
                         <div className="bg-primary/10 p-2 rounded-full text-primary">
                           <Package className="h-4 w-4" />
                         </div>
                         <div className="flex-1">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <h4 className="font-medium" data-testid={`product-${enquiry.id}`}>{enquiry.product}</h4>
                               <p className="text-sm text-muted-foreground">
                                 Quantity: {enquiry.quantity}
                               </p>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               <Badge 
                                 variant={
                                   enquiry.status === 'pending' ? 'secondary' : 
                                   enquiry.status === 'processing' ? 'default' :
                                   enquiry.status === 'completed' ? 'outline' : 
                                   'destructive'
                                 }
                                 data-testid={`status-${enquiry.id}`}
                               >
                                 {enquiry.status.toUpperCase()}
                               </Badge>
                               <span className="text-xs text-muted-foreground">
                                 {format(new Date(enquiry.createdAt), 'MMM d, h:mm a')}
                               </span>
                             </div>
                           </div>
                           {enquiry.message && (
                             <p className="text-sm text-muted-foreground mt-2" data-testid={`message-${enquiry.id}`}>
                               {enquiry.message}
                             </p>
                           )}
                           {enquiry.phone && (
                             <p className="text-xs text-muted-foreground mt-1">
                               Contact: {enquiry.phone}
                             </p>
                           )}
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </CardContent>
               {modemEnquiries.length > 0 && (
                 <CardFooter>
                   <Button variant="outline" asChild className="w-full">
                     <Link href="/modems">View More Modems</Link>
                   </Button>
                 </CardFooter>
               )}
             </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card data-testid="card-profile-settings">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" data-testid="input-email" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateProfile} data-testid="button-save-profile">Save Changes</Button>
              </CardFooter>
            </Card>

            <Card data-testid="card-service-address">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Service Address
                </CardTitle>
                <CardDescription>The address where your internet service is installed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    value={serviceAddress} 
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="123 Main Street, Sydney NSW 2000"
                    data-testid="input-service-address"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateAddress} data-testid="button-save-address">Update Address</Button>
              </CardFooter>
            </Card>

            <Card data-testid="card-change-password">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password for security.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    data-testid="input-old-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    data-testid="input-confirm-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
                  data-testid="button-change-password"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}