import { useEffect, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db, Incident } from "@/lib/mock-db";
import { format } from "date-fns";
import { Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { toast } = useToast();
  
  // New Incident State
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"minor" | "major" | "critical">("minor");

  useEffect(() => {
    // Simple admin check (in mock, anyone can access /admin if they know the URL, but let's redirect if not logged in)
    if (!user) {
      setLocation("/auth");
      return;
    }
    setIncidents(db.getIncidents());
  }, [user, setLocation]);

  const handleCreate = () => {
    db.createIncident({
      title,
      severity,
      status: "investigating"
    });
    setIncidents(db.getIncidents());
    setTitle("");
    toast({ title: "Incident created" });
  };

  const handleResolve = (id: string) => {
    db.resolveIncident(id);
    setIncidents(db.getIncidents());
    toast({ title: "Incident resolved" });
  };

  return (
    <div className="container py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Incident</CardTitle>
            <CardDescription>Post a new network status update.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Incident Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unplanned Outage in Melbourne" />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full">Create Incident</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Incidents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
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
                  <Button size="sm" variant="outline" onClick={() => handleResolve(incident.id)}>
                    Resolve
                  </Button>
                )}
              </div>
            ))}
            {incidents.length === 0 && <p className="text-muted-foreground text-center py-4">No incidents found.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}