import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Trash2, CheckCircle, AlertTriangle, Database, Upload, Info, MessageSquare, Bot, Inbox, Mail, Headphones, Router } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  updatedAt: string;
};

type NbnDatasetRecord = {
  id: string;
  addressHash: string | null;
  locid: string | null;
  normalizedAddress: string | null;
  postcode: string | null;
  technology: string;
  maxTier: string;
  notes: string | null;
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

type ContactMessage = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  userId: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export default function Admin() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { toast } = useToast();
  
  // Incident State
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"minor" | "major" | "critical">("minor");

  // NBN Dataset State
  const [dataset, setDataset] = useState<NbnDatasetRecord[]>([]);
  const [dataInput, setDataInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDataset, setIsLoadingDataset] = useState(true);
  const [replaceMode, setReplaceMode] = useState(true);

  // Chat Config State
  const [chatConfig, setChatConfig] = useState<any>(null);
  const [isLoadingChatConfig, setIsLoadingChatConfig] = useState(false);

  // Enquiries State
  const [modemEnquiries, setModemEnquiries] = useState<ModemEnquiry[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    
    if (user.isAdmin !== 1) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions",
        variant: "destructive"
      });
      setLocation("/dashboard");
      return;
    }

    const loadIncidents = async () => {
      const { data } = await api.getIncidents();
      if (data) setIncidents(data.incidents);
    };
    loadIncidents();

    loadDataset();
    loadChatConfig();
    loadEnquiries();
  }, [user, setLocation]);

  const loadDataset = async () => {
    setIsLoadingDataset(true);
    const { data } = await api.getNbnDataset();
    if (data) {
      setDataset(data.dataset);
    }
    setIsLoadingDataset(false);
  };

  const loadChatConfig = async () => {
    setIsLoadingChatConfig(true);
    const { data } = await api.getChatConfigStatus();
    if (data) {
      setChatConfig(data);
    }
    setIsLoadingChatConfig(false);
  };

  const loadEnquiries = async () => {
    setIsLoadingEnquiries(true);
    try {
      const [modemRes, messagesRes, ticketsRes] = await Promise.all([
        api.getAllModemEnquiries(),
        api.getAllContactMessages(),
        api.getAllTickets()
      ]);
      
      if (modemRes.data) setModemEnquiries(modemRes.data.enquiries || []);
      if (messagesRes.data) setContactMessages(messagesRes.data.messages || []);
      if (ticketsRes.data) setAllTickets(ticketsRes.data.tickets || []);
    } catch (error) {
      console.error("Error loading enquiries:", error);
    }
    setIsLoadingEnquiries(false);
  };

  const handleCreate = async () => {
    const { data, error } = await api.createIncident({
      title,
      severity,
      status: "investigating"
    });
    
    if (error) {
      toast({ title: "Failed to create incident", description: error, variant: "destructive" });
      return;
    }
    
    const res = await api.getIncidents();
    if (res.data) setIncidents(res.data.incidents);
    setTitle("");
    toast({ title: "Incident created" });
  };

  const handleResolve = async (id: string) => {
    const { error } = await api.resolveIncident(id);
    if (error) {
      toast({ title: "Failed to resolve incident", description: error, variant: "destructive" });
      return;
    }
    
    const res = await api.getIncidents();
    if (res.data) setIncidents(res.data.incidents);
    toast({ title: "Incident resolved" });
  };

  const handleUpload = async () => {
    if (!dataInput.trim()) {
      toast({
        title: "No data provided",
        description: "Please enter CSV or JSON data to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      let parsedData: any[] = [];

      // Try parsing as JSON first
      if (dataInput.trim().startsWith('[')) {
        parsedData = JSON.parse(dataInput);
      } else {
        // Parse as CSV
        const lines = dataInput.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index] || null;
          });
          parsedData.push(record);
        }
      }

      const { data, error } = await api.uploadNbnDataset(parsedData, replaceMode);

      if (error) {
        toast({
          title: "Upload failed",
          description: error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Upload successful",
          description: `Imported ${data.recordsImported} records`
        });
        setDataInput("");
        loadDataset();
      }
    } catch (err: any) {
      toast({
        title: "Parse error",
        description: err.message || "Failed to parse input data",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearDataset = async () => {
    if (!confirm("Are you sure you want to delete all dataset records? This action cannot be undone.")) {
      return;
    }

    const { error } = await api.deleteNbnDataset();

    if (error) {
      toast({
        title: "Delete failed",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Dataset cleared",
        description: "All records have been deleted"
      });
      loadDataset();
    }
  };

  if (!user || user.isAdmin !== 1) {
    return null;
  }

  return (
    <div className="container py-12 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8" data-testid="text-admin-title">Admin Console</h1>
      
      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents" data-testid="tab-incidents">Network Incidents</TabsTrigger>
          <TabsTrigger value="dataset" data-testid="tab-dataset">NBN Dataset</TabsTrigger>
          <TabsTrigger value="enquiries" data-testid="tab-enquiries">
            <Inbox className="h-4 w-4 mr-2" />
            Enquiries
          </TabsTrigger>
          <TabsTrigger value="chatconfig" data-testid="tab-chatconfig">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Create New Incident</CardTitle>
                <CardDescription>Post a new network status update.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Incident Title</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g. Unplanned Outage in Melbourne"
                    data-testid="input-incident-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  data-testid="button-create-incident"
                >
                  Create Incident
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Incidents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incidents.map((incident) => (
                  <div 
                    key={incident.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    data-testid={`incident-${incident.id}`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {incident.title}
                        <Badge variant={incident.status === 'resolved' ? 'outline' : 'destructive'}>
                          {incident.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(incident.createdAt), 'PP p')}
                      </div>
                    </div>
                    {incident.status !== 'resolved' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleResolve(incident.id)}
                        data-testid={`button-resolve-${incident.id}`}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
                {incidents.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No incidents found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dataset" className="mt-6">
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>NBN Dataset Management</AlertTitle>
            <AlertDescription>
              This dataset is used as a fallback when the wholesale API is not configured or unavailable.
              Upload CSV or JSON data with address information and NBN technology details.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Dataset
                </CardTitle>
                <CardDescription>
                  Import NBN availability data in CSV or JSON format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-input">CSV or JSON Data</Label>
                  <Textarea
                    id="data-input"
                    placeholder="Paste CSV or JSON data here..."
                    className="font-mono text-sm min-h-[200px]"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                    data-testid="textarea-dataset"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                  <p className="font-semibold">Expected Fields:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li><code className="bg-background px-1 rounded">normalizedAddress</code> - Full address (used with postcode to generate hash)</li>
                    <li><code className="bg-background px-1 rounded">postcode</code> - Australian postcode (used for lookups)</li>
                    <li><code className="bg-background px-1 rounded">technology</code> - NBN technology type (required, e.g., FTTP, FTTN, HFC)</li>
                    <li><code className="bg-background px-1 rounded">maxTier</code> - Maximum speed tier (required, e.g., 1000Mbps, 100Mbps)</li>
                    <li><code className="bg-background px-1 rounded">locid</code>, <code className="bg-background px-1 rounded">addressHash</code>, <code className="bg-background px-1 rounded">notes</code> - Optional fields</li>
                  </ul>
                </div>

                <details className="bg-muted/50 p-4 rounded-lg">
                  <summary className="font-semibold text-sm cursor-pointer">Example CSV</summary>
                  <pre className="text-xs bg-background p-3 rounded overflow-x-auto mt-2">
{`normalizedAddress,postcode,technology,maxTier,notes
"123 Main St, Sydney NSW 2000",2000,FTTP,1000Mbps,Active
"456 High St, Melbourne VIC 3000",3000,FTTN,100Mbps,Available`}
                  </pre>
                </details>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceMode}
                      onChange={(e) => setReplaceMode(e.target.checked)}
                      className="rounded"
                      data-testid="checkbox-replace"
                    />
                    <span className="text-sm">Replace existing dataset</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !dataInput.trim()}
                    className="flex-1"
                    data-testid="button-upload"
                  >
                    {isUploading ? "Uploading..." : "Upload Dataset"}
                  </Button>
                  <Button
                    onClick={() => setDataInput("")}
                    variant="outline"
                    data-testid="button-clear-input"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Current Dataset
                    </CardTitle>
                    <CardDescription>
                      {dataset.length} records in database
                    </CardDescription>
                  </div>
                  {dataset.length > 0 && (
                    <Button
                      onClick={handleClearDataset}
                      variant="destructive"
                      size="sm"
                      data-testid="button-delete-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDataset ? (
                  <p className="text-muted-foreground text-center py-8">Loading dataset...</p>
                ) : dataset.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No records in dataset</p>
                    <p className="text-sm text-muted-foreground mt-2">Upload data above to populate the dataset</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {dataset.map((record) => (
                      <div
                        key={record.id}
                        className="border rounded-lg p-4 bg-muted/30 space-y-2"
                        data-testid={`record-${record.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            {record.normalizedAddress && (
                              <p className="font-medium text-sm">{record.normalizedAddress}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {record.postcode && (
                                <span>Postcode: {record.postcode}</span>
                              )}
                              {record.locid && (
                                <span>LOCID: {record.locid}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                              {record.technology}
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                              {record.maxTier}
                            </span>
                          </div>
                        </div>
                        {record.notes && (
                          <p className="text-xs text-muted-foreground italic">{record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enquiries" className="mt-6">
          {isLoadingEnquiries ? (
            <p className="text-muted-foreground text-center py-8">Loading enquiries...</p>
          ) : (
            <div className="grid gap-6">
              {/* Modem Enquiries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Router className="h-5 w-5" />
                    Modem Enquiries
                    <Badge variant="secondary" className="ml-auto">{modemEnquiries.length}</Badge>
                  </CardTitle>
                  <CardDescription>Router and modem purchase enquiries from customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {modemEnquiries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No modem enquiries yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {modemEnquiries.map((enquiry) => (
                        <div key={enquiry.id} className="border rounded-lg p-4 space-y-2" data-testid={`enquiry-modem-${enquiry.id}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{enquiry.name}</p>
                              <p className="text-sm text-muted-foreground">{enquiry.email}</p>
                              {enquiry.phone && <p className="text-sm text-muted-foreground">{enquiry.phone}</p>}
                            </div>
                            <Badge variant={enquiry.status === 'pending' ? 'outline' : 'default'}>{enquiry.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{enquiry.product}</span>
                            <span className="text-muted-foreground">x{enquiry.quantity}</span>
                          </div>
                          {enquiry.message && <p className="text-sm text-muted-foreground">{enquiry.message}</p>}
                          <p className="text-xs text-muted-foreground">{format(new Date(enquiry.createdAt), 'PP p')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Messages
                    <Badge variant="secondary" className="ml-auto">{contactMessages.length}</Badge>
                  </CardTitle>
                  <CardDescription>Messages from the contact form</CardDescription>
                </CardHeader>
                <CardContent>
                  {contactMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No contact messages yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {contactMessages.map((msg) => (
                        <div key={msg.id} className="border rounded-lg p-4 space-y-2" data-testid={`enquiry-contact-${msg.id}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{msg.name}</p>
                              <p className="text-sm text-muted-foreground">{msg.email}</p>
                            </div>
                            <Badge variant={msg.status === 'pending' ? 'outline' : 'default'}>{msg.status}</Badge>
                          </div>
                          <p className="font-medium text-sm">{msg.subject}</p>
                          <p className="text-sm text-muted-foreground">{msg.message}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), 'PP p')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Support Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Support Tickets
                    <Badge variant="secondary" className="ml-auto">{allTickets.length}</Badge>
                  </CardTitle>
                  <CardDescription>All customer support tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  {allTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No support tickets yet</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {allTickets.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4 space-y-2" data-testid={`enquiry-ticket-${ticket.id}`}>
                          <div className="flex items-start justify-between">
                            <p className="font-medium">{ticket.subject}</p>
                            <Badge variant={ticket.status === 'open' ? 'destructive' : ticket.status === 'in_progress' ? 'default' : 'outline'}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created: {format(new Date(ticket.createdAt), 'PP p')}
                            {ticket.updatedAt !== ticket.createdAt && ` • Updated: ${format(new Date(ticket.updatedAt), 'PP p')}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chatconfig" className="mt-6">
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Chatbot Configuration
                </CardTitle>
                <CardDescription>
                  Status and configuration of the customer support chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingChatConfig ? (
                  <p className="text-muted-foreground text-center py-4">Loading configuration...</p>
                ) : chatConfig ? (
                  <>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base font-semibold">AI Mode</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {chatConfig.mode === 'ai' 
                              ? 'Using AI for intelligent responses' 
                              : 'Using built-in FAQ fallback mode'}
                          </p>
                        </div>
                        <Badge variant={chatConfig.isConfigured ? "default" : "secondary"}>
                          {chatConfig.mode === 'ai' ? 'AI Enabled' : 'FAQ Mode'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base font-semibold">Provider</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {chatConfig.provider}
                          </p>
                        </div>
                        {chatConfig.isConfigured && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base font-semibold">Chat Logging</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {chatConfig.saveLogs 
                              ? 'Conversations are saved to database' 
                              : 'Conversations are ephemeral (not saved)'}
                          </p>
                        </div>
                        <Badge variant={chatConfig.saveLogs ? "default" : "outline"}>
                          {chatConfig.saveLogs ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>

                    {!chatConfig.isConfigured && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>AI Mode Not Configured</AlertTitle>
                        <AlertDescription>
                          The chatbot is running in FAQ fallback mode. To enable AI mode, the OpenAI integration needs to be configured with Replit AI Integrations.
                          The chatbot will still work using built-in BroNET knowledge.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3">Environment Variables</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <code className="text-xs">SAVE_CHAT_LOGS</code>
                          <Badge variant="outline" className="text-xs">
                            {chatConfig.saveLogs ? 'true' : 'false'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Set SAVE_CHAT_LOGS=true to enable conversation logging to database
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Rate limiting (20 requests per minute per IP)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Secret redaction (passwords, API keys, credit cards)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Privacy notice displayed to users
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Export to support ticket (for logged-in users)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Mobile-responsive full-screen mode
                        </li>
                      </ul>
                    </div>

                    <Button 
                      onClick={loadChatConfig} 
                      variant="outline" 
                      className="w-full"
                      data-testid="button-refresh-chat-config"
                    >
                      Refresh Configuration
                    </Button>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuration Error</AlertTitle>
                    <AlertDescription>
                      Could not load chat configuration. Please check the server logs.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}