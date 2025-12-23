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
  Package
} from "lucide-react";
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

export default function Dashboard() {
  const { user, logout, updateProfile } = useUser();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [modemEnquiries, setModemEnquiries] = useState<ModemEnquiry[]>([]);
  const { toast } = useToast();
  
  // New Ticket State
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);

  // Profile Edit State
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    
    // Load Data from API
    const loadData = async () => {
      const [ticketsRes, usageRes, messagesRes, modemEnquiriesRes] = await Promise.all([
        api.getTickets(),
        api.getUsage(),
        api.getMessages(),
        api.getModemEnquiries()
      ]);
      
      if (ticketsRes.data) setTickets(ticketsRes.data.tickets);
      if (usageRes.data) setUsage(usageRes.data.usage);
      if (messagesRes.data) setContactMessages(messagesRes.data.messages);
      if (modemEnquiriesRes.data) setModemEnquiries(modemEnquiriesRes.data.enquiries);
    };
    
    loadData();
    setFirstName(user.firstName);
    setLastName(user.lastName);
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
          <TabsContent value="billing">
             <Card>
               <CardHeader>
                 <CardTitle>Billing & Invoices</CardTitle>
                 <CardDescription>Manage your payment methods and view history.</CardDescription>
               </CardHeader>
               <CardContent className="py-8 text-center space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg inline-block border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-800 dark:text-yellow-300 font-medium flex items-center gap-2">
                       <CreditCard className="h-5 w-5" />
                       Billing system coming soon
                    </p>
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    We are currently upgrading our billing infrastructure. You will not be charged during this demo period.
                  </p>
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
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}