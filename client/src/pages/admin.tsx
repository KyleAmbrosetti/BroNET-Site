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
import { Trash2, CheckCircle, AlertTriangle, Database, Upload, Info, MessageSquare, Bot, Inbox, Mail, Headphones, Router, ShoppingCart, Eye, Clock, Users, Key, Ban, UserCheck, BarChart3, TrendingUp, DollarSign, UserPlus, Download, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  userName?: string;
};

type TicketReply = {
  id: string;
  ticketId: string;
  userId: string | null;
  message: string;
  isStaff: number;
  createdAt: string;
  userName?: string;
};

type ServiceOrder = {
  id: string;
  userId: string;
  orderReference: string;
  nbnOrderId: string | null;
  avcId: string | null;
  cvcId: string | null;
  planId: string;
  planName: string;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  serviceAddress: string;
  locId: string | null;
  technology: string | null;
  status: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredDate: string | null;
  estimatedConnectionDate: string | null;
  actualConnectionDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  planId: string | null;
  serviceAddress: string | null;
  isAdmin: number;
  disabled: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  joinedAt: string;
};

type OrderStatusHistory = {
  id: string;
  orderId: string;
  status: string;
  message: string | null;
  updatedBy: string | null;
  createdAt: string;
};

type AnalyticsData = {
  totalCustomers: number;
  newSignups30Days: number;
  signupsTrend: { date: string; signups: number }[];
  totalOrders: number;
  activeOrders: number;
  ordersByStatus: { status: string; count: number }[];
  ordersByPlan: { plan: string; count: number }[];
  estimatedMonthlyRevenue: number;
};

type Plan = {
  id: string;
  name: string;
  speed: number;
  uploadSpeed: number;
  priceMonthly: number;
  promoPrice: number | null;
  promoDuration: number | null;
  description: string | null;
  features: string[] | null;
  isActive: number;
  displayOrder: number;
};

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
  { value: 'on_hold', label: 'On Hold' },
];

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'active':
      return 'default';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    case 'pending':
    case 'on_hold':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'submitted':
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'provisioning':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'on_hold':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return '';
  }
}

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

  // Tickets Management State
  const [adminTickets, setAdminTickets] = useState<Ticket[]>([]);
  const [isLoadingAdminTickets, setIsLoadingAdminTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [ticketReplyMessage, setTicketReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [newTicketStatus, setNewTicketStatus] = useState('');
  const [isUpdatingTicketStatus, setIsUpdatingTicketStatus] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');

  // Orders State
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [newOrderStatus, setNewOrderStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editAvcId, setEditAvcId] = useState('');
  const [isUpdatingAvcId, setIsUpdatingAvcId] = useState(false);
  
  // Bulk Order Actions State
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isUpdatingBulkStatus, setIsUpdatingBulkStatus] = useState(false);

  // Customers State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; password: string } | null>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Plans State
  const [adminPlans, setAdminPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    speed: 0,
    uploadSpeed: 0,
    priceMonthly: 0,
    promoPrice: 0,
    promoDuration: 0,
    description: '',
    features: '',
    isActive: 1,
    displayOrder: 0,
  });
  const [isSavingPlan, setIsSavingPlan] = useState(false);

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
    loadOrders();
    loadCustomers();
    loadAnalytics();
    loadAdminTickets();
    loadAdminPlans();
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

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const { data } = await api.getAdminOrders();
      if (data) setOrders(data.orders || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    setIsLoadingOrders(false);
  };

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const { data } = await api.getAdminUsers();
      if (data) setCustomers(data.users || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
    setIsLoadingCustomers(false);
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const { data } = await api.getAdminAnalytics();
      if (data) setAnalytics(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setIsLoadingAnalytics(false);
  };

  const loadAdminTickets = async () => {
    setIsLoadingAdminTickets(true);
    try {
      const { data } = await api.getAllTickets();
      if (data) setAdminTickets(data.tickets || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
    setIsLoadingAdminTickets(false);
  };

  const loadAdminPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const { data } = await api.getAdminPlans();
      if (data) setAdminPlans(data.plans || []);
    } catch (error) {
      console.error("Error loading plans:", error);
    }
    setIsLoadingPlans(false);
  };

  const handleOpenNewPlanDialog = () => {
    setEditingPlan(null);
    setPlanForm({
      id: '',
      name: '',
      speed: 0,
      uploadSpeed: 0,
      priceMonthly: 0,
      promoPrice: 0,
      promoDuration: 0,
      description: '',
      features: '',
      isActive: 1,
      displayOrder: adminPlans.length,
    });
    setIsPlanDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      id: plan.id,
      name: plan.name,
      speed: plan.speed,
      uploadSpeed: plan.uploadSpeed,
      priceMonthly: plan.priceMonthly,
      promoPrice: plan.promoPrice || 0,
      promoDuration: plan.promoDuration || 0,
      description: plan.description || '',
      features: (plan.features || []).join(', '),
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
    setIsPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.id.trim() || !planForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Plan ID and Name are required",
        variant: "destructive"
      });
      return;
    }

    setIsSavingPlan(true);
    
    const planData = {
      id: planForm.id.trim(),
      name: planForm.name.trim(),
      speed: planForm.speed,
      uploadSpeed: planForm.uploadSpeed,
      priceMonthly: planForm.priceMonthly,
      promoPrice: planForm.promoPrice || null,
      promoDuration: planForm.promoDuration || null,
      description: planForm.description.trim() || null,
      features: planForm.features.trim() ? planForm.features.split(',').map(f => f.trim()) : null,
      isActive: planForm.isActive,
      displayOrder: planForm.displayOrder,
    };

    if (editingPlan) {
      const { error } = await api.updateAdminPlan(editingPlan.id, planData);
      if (error) {
        toast({ title: "Failed to update plan", description: error, variant: "destructive" });
      } else {
        toast({ title: "Plan updated" });
        setIsPlanDialogOpen(false);
        loadAdminPlans();
      }
    } else {
      const { error } = await api.createAdminPlan(planData);
      if (error) {
        toast({ title: "Failed to create plan", description: error, variant: "destructive" });
      } else {
        toast({ title: "Plan created" });
        setIsPlanDialogOpen(false);
        loadAdminPlans();
      }
    }
    setIsSavingPlan(false);
  };

  const handleTogglePlanActive = async (plan: Plan) => {
    const { error } = await api.updateAdminPlan(plan.id, { isActive: plan.isActive === 1 ? 0 : 1 });
    if (error) {
      toast({ title: "Failed to update plan", description: error, variant: "destructive" });
    } else {
      toast({ title: plan.isActive === 1 ? "Plan deactivated" : "Plan activated" });
      loadAdminPlans();
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const { error } = await api.deleteAdminPlan(planId);
    if (error) {
      toast({ title: "Failed to delete plan", description: error, variant: "destructive" });
    } else {
      toast({ title: "Plan deleted" });
      loadAdminPlans();
    }
  };

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setNewTicketStatus(ticket.status);
    setTicketReplyMessage('');
    setIsTicketDialogOpen(true);
    
    const { data } = await api.getAdminTicket(ticket.id);
    if (data) {
      setSelectedTicket(data.ticket);
      setTicketReplies(data.replies || []);
    }
  };

  const handleAddTicketReply = async () => {
    if (!selectedTicket || !ticketReplyMessage.trim()) return;
    
    setIsSubmittingReply(true);
    const { data, error } = await api.addAdminTicketReply(selectedTicket.id, ticketReplyMessage.trim());
    
    if (error) {
      toast({
        title: "Failed to add reply",
        description: error,
        variant: "destructive"
      });
    } else if (data?.reply) {
      setTicketReplies(prev => [...prev, data.reply]);
      setTicketReplyMessage('');
      toast({ title: "Reply added" });
      loadAdminTickets();
    }
    setIsSubmittingReply(false);
  };

  const handleUpdateTicketStatus = async () => {
    if (!selectedTicket || !newTicketStatus || newTicketStatus === selectedTicket.status) return;
    
    setIsUpdatingTicketStatus(true);
    const { data, error } = await api.updateAdminTicketStatus(selectedTicket.id, newTicketStatus);
    
    if (error) {
      toast({
        title: "Failed to update status",
        description: error,
        variant: "destructive"
      });
    } else if (data?.ticket) {
      setSelectedTicket(data.ticket);
      toast({ title: "Status updated" });
      loadAdminTickets();
    }
    setIsUpdatingTicketStatus(false);
  };

  const getTicketStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400';
      default:
        return '';
    }
  };

  const filteredAdminTickets = ticketStatusFilter === 'all' 
    ? adminTickets 
    : adminTickets.filter(t => t.status === ticketStatusFilter);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setResetPasswordResult(null);
    setIsCustomerDialogOpen(true);
  };

  const handleDisableCustomer = async (customerId: string) => {
    const { error } = await api.disableAdminUser(customerId);
    if (error) {
      toast({
        title: "Failed to disable account",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({ title: "Account disabled" });
      loadCustomers();
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, disabled: 1 } : null);
      }
    }
  };

  const handleEnableCustomer = async (customerId: string) => {
    const { error } = await api.enableAdminUser(customerId);
    if (error) {
      toast({
        title: "Failed to enable account",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({ title: "Account enabled" });
      loadCustomers();
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, disabled: 0 } : null);
      }
    }
  };

  const handleResetPassword = async (customerId: string) => {
    const { data, error } = await api.resetAdminUserPassword(customerId);
    if (error) {
      toast({
        title: "Failed to reset password",
        description: error,
        variant: "destructive"
      });
    } else if (data) {
      setResetPasswordResult({
        email: data.userEmail,
        password: data.newPassword
      });
      toast({ title: "Password reset successfully" });
    }
  };

  const handleViewOrder = async (order: ServiceOrder) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.status);
    setStatusMessage('');
    setEditAvcId(order.avcId || '');
    setIsOrderDialogOpen(true);
    
    const { data } = await api.getAdminOrder(order.id);
    if (data?.history) {
      setOrderHistory(data.history);
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newOrderStatus) return;
    
    setIsUpdatingStatus(true);
    const { error } = await api.updateAdminOrderStatus(
      selectedOrder.id,
      newOrderStatus,
      statusMessage || undefined
    );
    
    if (error) {
      toast({
        title: "Failed to update status",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({ title: "Order status updated" });
      loadOrders();
      const { data } = await api.getAdminOrder(selectedOrder.id);
      if (data) {
        setSelectedOrder(data.order);
        setOrderHistory(data.history || []);
      }
    }
    setIsUpdatingStatus(false);
    setStatusMessage('');
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this cancelled order? This action cannot be undone.')) {
      return;
    }
    
    const { error } = await api.deleteAdminOrder(orderId);
    
    if (error) {
      toast({
        title: "Failed to delete order",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({ title: "Order deleted" });
      loadOrders();
    }
  };

  const handleToggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleToggleAllOrders = () => {
    if (selectedOrderIds.size === orders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map(o => o.id)));
    }
  };

  const handleExportCSV = (exportAll: boolean) => {
    const ids = exportAll ? undefined : Array.from(selectedOrderIds);
    const url = api.exportAdminOrders(ids);
    window.open(url, '_blank');
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.size === 0 || !bulkStatus) return;
    
    setIsUpdatingBulkStatus(true);
    const { data, error } = await api.bulkUpdateOrderStatus(
      Array.from(selectedOrderIds),
      bulkStatus,
      bulkMessage || undefined
    );
    
    if (error) {
      toast({
        title: "Failed to update orders",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({ 
        title: "Orders updated", 
        description: data?.message || `Updated ${selectedOrderIds.size} orders`
      });
      setSelectedOrderIds(new Set());
      setBulkStatus('');
      setBulkMessage('');
      loadOrders();
    }
    setIsUpdatingBulkStatus(false);
  };

  const handleUpdateAvcId = async () => {
    if (!selectedOrder || !editAvcId.trim()) return;
    
    setIsUpdatingAvcId(true);
    const { data, error } = await api.updateAdminOrderAvcId(selectedOrder.id, editAvcId.trim());
    
    if (error) {
      toast({
        title: "Failed to update AVC ID",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({ title: "AVC ID updated" });
      if (data?.order) {
        setSelectedOrder(data.order);
      }
      loadOrders();
    }
    setIsUpdatingAvcId(false);
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
      
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents</TabsTrigger>
          <TabsTrigger value="dataset" data-testid="tab-dataset">Dataset</TabsTrigger>
          <TabsTrigger value="chatconfig" data-testid="tab-chatconfig">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="enquiries" data-testid="tab-enquiries">
            <Inbox className="h-4 w-4 mr-2" />
            Enquiries
          </TabsTrigger>
          <TabsTrigger value="tickets" data-testid="tab-tickets">
            <Headphones className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">
            <DollarSign className="h-4 w-4 mr-2" />
            Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          {isLoadingAnalytics ? (
            <p className="text-muted-foreground text-center py-8">Loading analytics...</p>
          ) : analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-total-customers">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground">Registered accounts</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-new-signups">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Signups (30 days)</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.newSignups30Days}</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-orders">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">All service orders</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-active-services">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.activeOrders}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-signups-chart">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Signups Trend (Last 30 Days)
                    </CardTitle>
                    <CardDescription>New customer registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.signupsTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip 
                            labelFormatter={(value) => format(new Date(value), 'PP')}
                            formatter={(value: number) => [value, 'Signups']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="signups" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-orders-by-plan">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Orders by Plan
                    </CardTitle>
                    <CardDescription>Distribution of orders across plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {analytics.ordersByPlan.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.ordersByPlan} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                            <YAxis 
                              dataKey="plan" 
                              type="category" 
                              tick={{ fontSize: 11 }} 
                              width={120}
                            />
                            <Tooltip formatter={(value: number) => [value, 'Orders']} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No orders yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-order-status">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Orders by Status
                    </CardTitle>
                    <CardDescription>Breakdown of order statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.ordersByStatus.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.ordersByStatus.map((item) => (
                            <TableRow key={item.status}>
                              <TableCell>
                                <Badge className={getStatusBadgeClass(item.status)}>
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{item.count}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {analytics.totalOrders > 0 
                                  ? Math.round((item.count / analytics.totalOrders) * 100) 
                                  : 0}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No orders yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="card-revenue">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Revenue Estimate
                    </CardTitle>
                    <CardDescription>Based on active services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Monthly Revenue</p>
                        <p className="text-3xl font-bold">${analytics.estimatedMonthlyRevenue.toLocaleString()}</p>
                      </div>
                      <div className="text-sm text-muted-foreground border-t pt-4">
                        <p>Calculation: {analytics.activeOrders} active services × $89 avg plan price</p>
                        <p className="mt-2 text-xs">Note: This is an estimate based on average plan pricing.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={loadAnalytics} variant="outline" data-testid="button-refresh-analytics">
                  Refresh Analytics
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Failed to load analytics data</p>
              <Button onClick={loadAnalytics} variant="outline" className="mt-4">
                Retry
              </Button>
            </div>
          )}
        </TabsContent>

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

        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Support Tickets
                  </CardTitle>
                  <CardDescription>Manage customer support tickets</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-ticket-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tickets</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="secondary">{filteredAdminTickets.length} tickets</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAdminTickets ? (
                <p className="text-muted-foreground text-center py-8">Loading tickets...</p>
              ) : filteredAdminTickets.length === 0 ? (
                <div className="text-center py-12">
                  <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Customer Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdminTickets.map((ticket) => (
                      <TableRow key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>{ticket.userEmail || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge className={getTicketStatusBadgeClass(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(ticket.createdAt), 'PP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                            data-testid={`button-view-ticket-${ticket.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Service Orders
                  </CardTitle>
                  <CardDescription>
                    Manage customer NBN service orders
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportCSV(true)}
                    data-testid="button-export-all-orders"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All as CSV
                  </Button>
                  <Badge variant="secondary">{orders.length} orders</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedOrderIds.size > 0 && (
                <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-4" data-testid="bulk-actions-toolbar">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedOrderIds.size} order{selectedOrderIds.size > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrderIds(new Set())}
                      data-testid="button-clear-selection"
                    >
                      Clear selection
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(false)}
                      data-testid="button-export-selected-orders"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected as CSV
                    </Button>
                    <div className="flex items-center gap-2">
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-[180px]" data-testid="select-bulk-status">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Status message (optional)"
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                        className="w-[200px]"
                        data-testid="input-bulk-message"
                      />
                      <Button
                        size="sm"
                        onClick={handleBulkStatusUpdate}
                        disabled={!bulkStatus || isUpdatingBulkStatus}
                        data-testid="button-bulk-update-status"
                      >
                        {isUpdatingBulkStatus ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Update Status
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {isLoadingOrders ? (
                <p className="text-muted-foreground text-center py-8">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                            onCheckedChange={handleToggleAllOrders}
                            data-testid="checkbox-select-all-orders"
                          />
                        </TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>AVC ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedOrderIds.has(order.id)}
                              onCheckedChange={() => handleToggleOrderSelection(order.id)}
                              data-testid={`checkbox-order-${order.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{order.orderReference}</TableCell>
                          <TableCell>{order.contactName}</TableCell>
                          <TableCell className="text-sm">{order.contactEmail}</TableCell>
                          <TableCell>{order.planName}</TableCell>
                          <TableCell className="font-mono text-sm">{order.avcId || '—'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm" title={order.serviceAddress}>
                            {order.serviceAddress}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(order.createdAt), 'PP')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewOrder(order)}
                                data-testid={`button-view-order-${order.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {order.status === 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  data-testid={`button-delete-order-${order.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Management
                  </CardTitle>
                  <CardDescription>
                    View and manage customer accounts
                  </CardDescription>
                </div>
                <Badge variant="secondary">{customers.length} customers</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCustomers ? (
                <p className="text-muted-foreground text-center py-8">Loading customers...</p>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No customers yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                          <TableCell className="font-medium">{customer.email}</TableCell>
                          <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                          <TableCell>{customer.planId || '—'}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(customer.joinedAt), 'PP')}
                          </TableCell>
                          <TableCell>
                            {customer.isAdmin === 1 ? (
                              <Badge variant="default">Admin</Badge>
                            ) : customer.disabled === 1 ? (
                              <Badge variant="destructive">Disabled</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewCustomer(customer)}
                                data-testid={`button-view-customer-${customer.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {customer.isAdmin !== 1 && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        data-testid={`button-reset-password-${customer.id}`}
                                      >
                                        <Key className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will generate a new random password for {customer.email}. The new password will be displayed once.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleResetPassword(customer.id)}>
                                          Reset Password
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  {customer.disabled === 1 ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEnableCustomer(customer.id)}
                                      data-testid={`button-enable-customer-${customer.id}`}
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          data-testid={`button-disable-customer-${customer.id}`}
                                        >
                                          <Ban className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Disable Account</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will disable the account for {customer.email}. They will not be able to log in until the account is re-enabled.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDisableCustomer(customer.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Disable Account
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Manage Plans
                  </CardTitle>
                  <CardDescription>Configure internet plans and pricing</CardDescription>
                </div>
                <Button onClick={handleOpenNewPlanDialog} data-testid="button-new-plan">
                  + New Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPlans ? (
                <p className="text-muted-foreground text-center py-8">Loading plans...</p>
              ) : adminPlans.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No plans found. Create your first plan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Speed (Mbps)</TableHead>
                        <TableHead>Monthly Price</TableHead>
                        <TableHead>Promo Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminPlans.map((plan) => (
                        <TableRow key={plan.id} data-testid={`plan-row-${plan.id}`}>
                          <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>{plan.speed}/{plan.uploadSpeed}</TableCell>
                          <TableCell>${(plan.priceMonthly / 100).toFixed(2)}/mo</TableCell>
                          <TableCell>
                            {plan.promoPrice ? (
                              <span className="text-green-600">${(plan.promoPrice / 100).toFixed(2)} for {plan.promoDuration}mo</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={plan.isActive === 1 ? "default" : "secondary"}
                              className={plan.isActive === 1 ? "bg-green-100 text-green-800" : ""}
                            >
                              {plan.isActive === 1 ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{plan.displayOrder}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditPlan(plan)}
                                data-testid={`button-edit-plan-${plan.id}`}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTogglePlanActive(plan)}
                                data-testid={`button-toggle-plan-${plan.id}`}
                              >
                                {plan.isActive === 1 ? "Deactivate" : "Activate"}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    data-testid={`button-delete-plan-${plan.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the plan "{plan.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeletePlan(plan.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? `Editing plan: ${editingPlan.name}` : 'Add a new internet plan'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-id">Plan ID</Label>
                <Input
                  id="plan-id"
                  value={planForm.id}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="e.g., everyday"
                  disabled={!!editingPlan}
                  data-testid="input-plan-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-name">Display Name</Label>
                <Input
                  id="plan-name"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Everyday"
                  data-testid="input-plan-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-speed">Download Speed (Mbps)</Label>
                <Input
                  id="plan-speed"
                  type="number"
                  value={planForm.speed}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, speed: parseInt(e.target.value) || 0 }))}
                  data-testid="input-plan-speed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-upload">Upload Speed (Mbps)</Label>
                <Input
                  id="plan-upload"
                  type="number"
                  value={planForm.uploadSpeed}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, uploadSpeed: parseInt(e.target.value) || 0 }))}
                  data-testid="input-plan-upload"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Monthly Price (cents)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  value={planForm.priceMonthly}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, priceMonthly: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g., 7200 = $72.00"
                  data-testid="input-plan-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-display-order">Display Order</Label>
                <Input
                  id="plan-display-order"
                  type="number"
                  value={planForm.displayOrder}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                  data-testid="input-plan-order"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-promo-price">Promo Price (cents, optional)</Label>
                <Input
                  id="plan-promo-price"
                  type="number"
                  value={planForm.promoPrice}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, promoPrice: parseInt(e.target.value) || 0 }))}
                  placeholder="Leave 0 for no promo"
                  data-testid="input-plan-promo-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-promo-duration">Promo Duration (months)</Label>
                <Input
                  id="plan-promo-duration"
                  type="number"
                  value={planForm.promoDuration}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, promoDuration: parseInt(e.target.value) || 0 }))}
                  data-testid="input-plan-promo-duration"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">Description (optional)</Label>
              <Textarea
                id="plan-description"
                value={planForm.description}
                onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the plan"
                data-testid="input-plan-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-features">Features (comma-separated, optional)</Label>
              <Input
                id="plan-features"
                value={planForm.features}
                onChange={(e) => setPlanForm(prev => ({ ...prev, features: e.target.value }))}
                placeholder="e.g., Unlimited data, No contract"
                data-testid="input-plan-features"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="plan-active"
                checked={planForm.isActive === 1}
                onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, isActive: checked ? 1 : 0 }))}
                data-testid="checkbox-plan-active"
              />
              <Label htmlFor="plan-active">Active (visible to customers)</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan} disabled={isSavingPlan} data-testid="button-save-plan">
                {isSavingPlan ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <p className="font-medium">{selectedCustomer.planId || 'No plan'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">{format(new Date(selectedCustomer.joinedAt), 'PPP')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">
                    {selectedCustomer.isAdmin === 1 ? (
                      <Badge variant="default">Admin</Badge>
                    ) : selectedCustomer.disabled === 1 ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Service Address</Label>
                  <p className="font-medium text-xs">{selectedCustomer.serviceAddress || 'Not set'}</p>
                </div>
              </div>

              {resetPasswordResult && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Password Reset</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">New password for {resetPasswordResult.email}:</p>
                    <code className="block bg-background p-2 rounded font-mono text-sm select-all">
                      {resetPasswordResult.password}
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Copy this password now. It will not be shown again.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {selectedCustomer.isAdmin !== 1 && (
                <div className="flex gap-2 pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-dialog-reset-password">
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Password</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will generate a new random password for {selectedCustomer.email}. The new password will be displayed once.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleResetPassword(selectedCustomer.id)}>
                          Reset Password
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {selectedCustomer.disabled === 1 ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEnableCustomer(selectedCustomer.id)}
                      data-testid="button-dialog-enable"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Enable Account
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" data-testid="button-dialog-disable">
                          <Ban className="h-4 w-4 mr-2" />
                          Disable Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will disable the account for {selectedCustomer.email}. They will not be able to log in until the account is re-enabled.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDisableCustomer(selectedCustomer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Disable Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.orderReference}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-mono">{selectedOrder.orderReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span>{selectedOrder.planName}</span>
                    </div>
                    {selectedOrder.downloadSpeed && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span>{selectedOrder.downloadSpeed}/{selectedOrder.uploadSpeed} Mbps</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Technology:</span>
                      <span>{selectedOrder.technology || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={getStatusBadgeClass(selectedOrder.status)}>
                        {selectedOrder.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LOC ID:</span>
                      <span className="font-mono">{selectedOrder.locId || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">AVC ID:</span>
                      <div className="flex items-center gap-2">
                        <Input
                          value={editAvcId}
                          onChange={(e) => setEditAvcId(e.target.value)}
                          placeholder="Enter AVC ID"
                          className="h-7 w-32 font-mono text-xs"
                          data-testid="input-avc-id"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleUpdateAvcId}
                          disabled={isUpdatingAvcId || !editAvcId.trim() || editAvcId === selectedOrder.avcId}
                          className="h-7 px-2"
                          data-testid="button-save-avc-id"
                        >
                          {isUpdatingAvcId ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{selectedOrder.contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedOrder.contactEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedOrder.contactPhone}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Service Address</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{selectedOrder.serviceAddress}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
                    {selectedOrder.locId && (
                      <span>LOC ID: <span className="font-mono">{selectedOrder.locId}</span></span>
                    )}
                    {selectedOrder.avcId && (
                      <span>AVC ID: <span className="font-mono">{selectedOrder.avcId}</span></span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(selectedOrder.createdAt), 'PPp')}</span>
                  </div>
                  {selectedOrder.preferredDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preferred:</span>
                      <span>{format(new Date(selectedOrder.preferredDate), 'PP')}</span>
                    </div>
                  )}
                  {selectedOrder.estimatedConnectionDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Connection:</span>
                      <span>{format(new Date(selectedOrder.estimatedConnectionDate), 'PP')}</span>
                    </div>
                  )}
                  {selectedOrder.actualConnectionDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connected:</span>
                      <span>{format(new Date(selectedOrder.actualConnectionDate), 'PP')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Select value={newOrderStatus} onValueChange={setNewOrderStatus}>
                      <SelectTrigger className="w-[180px]" data-testid="select-order-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Status message (optional)"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      className="flex-1"
                      data-testid="input-status-message"
                    />
                  </div>
                  <Button
                    onClick={handleUpdateOrderStatus}
                    disabled={isUpdatingStatus || newOrderStatus === selectedOrder.status}
                    data-testid="button-update-status"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Status History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orderHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No status history</p>
                  ) : (
                    <div className="space-y-3">
                      {orderHistory.map((entry, index) => (
                        <div key={entry.id} className="flex gap-3 relative">
                          {index < orderHistory.length - 1 && (
                            <div className="absolute left-[7px] top-5 w-0.5 h-full bg-border" />
                          )}
                          <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${getStatusBadgeClass(entry.status)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm capitalize">
                                {entry.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.createdAt), 'PPp')}
                              </span>
                            </div>
                            {entry.message && (
                              <p className="text-sm text-muted-foreground mt-1">{entry.message}</p>
                            )}
                            {entry.updatedBy && (
                              <p className="text-xs text-muted-foreground">by {entry.updatedBy}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Support Ticket
            </DialogTitle>
            <DialogDescription>
              View and respond to customer support ticket
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <Badge className={getTicketStatusBadgeClass(selectedTicket.status)}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-1">
                    <div>From: {selectedTicket.userName || 'Unknown'} ({selectedTicket.userEmail || 'Unknown'})</div>
                    <div>Created: {format(new Date(selectedTicket.createdAt), 'PPp')}</div>
                    {selectedTicket.updatedAt !== selectedTicket.createdAt && (
                      <div>Updated: {format(new Date(selectedTicket.updatedAt), 'PPp')}</div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.description || 'No description provided.'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Replies ({ticketReplies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticketReplies.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No replies yet</p>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {ticketReplies.map((reply) => (
                        <div 
                          key={reply.id} 
                          className={`p-3 rounded-lg ${reply.isStaff ? 'bg-primary/10 ml-8' : 'bg-muted/50 mr-8'}`}
                          data-testid={`ticket-reply-${reply.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{reply.userName || 'Unknown'}</span>
                              {reply.isStaff === 1 && (
                                <Badge variant="outline" className="text-xs">Staff</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.createdAt), 'PP p')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-3 pt-4 border-t">
                    <Label htmlFor="ticket-reply">Add Reply</Label>
                    <Textarea
                      id="ticket-reply"
                      placeholder="Type your reply..."
                      value={ticketReplyMessage}
                      onChange={(e) => setTicketReplyMessage(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="textarea-ticket-reply"
                    />
                    <Button
                      onClick={handleAddTicketReply}
                      disabled={isSubmittingReply || !ticketReplyMessage.trim()}
                      data-testid="button-add-ticket-reply"
                    >
                      {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Select value={newTicketStatus} onValueChange={setNewTicketStatus}>
                      <SelectTrigger className="w-[180px]" data-testid="select-ticket-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateTicketStatus}
                      disabled={isUpdatingTicketStatus || newTicketStatus === selectedTicket.status}
                      data-testid="button-update-ticket-status"
                    >
                      {isUpdatingTicketStatus ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}