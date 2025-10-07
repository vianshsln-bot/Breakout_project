
import { Header } from "@/components/layout/header";
import { agentData, whatsAppTemplates, eventThemes, systemHealth, recentAudits } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Bot, User, CheckCircle, AlertTriangle, Settings as SettingsIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const statusColors = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

export default function SystemPage() {
  return (
    <>
      <Header title="System Pages" />
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="whatsapp" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Automation</CardTitle>
                <CardDescription>Manage messaging campaigns and templates.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Read Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsAppTemplates.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell><Badge variant={t.status === 'approved' ? 'default' : 'secondary'} className={t.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : ''}>{t.status}</Badge></TableCell>
                        <TableCell>{t.sent}</TableCell>
                        <TableCell>{((t.read / t.sent) * 100 || 0).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="themes">
            <Card>
              <CardHeader>
                <CardTitle>Themes & Packages</CardTitle>
                <CardDescription>Manage event themes and pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Bookings</TableHead>
                       <TableHead>Revenue</TableHead>
                       <TableHead>Popularity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventThemes.map(theme => (
                      <TableRow key={theme.id}>
                        <TableCell className="font-medium">{theme.name}</TableCell>
                        <TableCell>₹{theme.basePrice.toLocaleString()}</TableCell>
                        <TableCell>{theme.bookings}</TableCell>
                        <TableCell>₹{theme.revenue.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{theme.popularity}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {systemHealth.map(metric => (
                            <div key={metric.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                                    <span className="text-sm font-bold">{metric.value}</span>
                                </div>
                                <Progress value={parseFloat(metric.value)} className={`h-2 [&>div]:${statusColors[metric.status as keyof typeof statusColors]}`}/>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Recent Audits</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Area</TableHead><TableHead>Result</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {recentAudits.map(audit => (
                                    <TableRow key={audit.id}>
                                        <TableCell>{audit.area}</TableCell>
                                        <TableCell>
                                            <Badge variant={audit.result === 'passed' ? 'default' : 'destructive'} className={audit.result === 'passed' ? 'bg-emerald-100 text-emerald-800' : ''}>
                                              {audit.result === 'passed' ? <CheckCircle className="mr-1 w-3 h-3"/> : <AlertTriangle className="mr-1 w-3 h-3"/>}
                                              {audit.result}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(audit.timestamp).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader><CardTitle>Agent Management</CardTitle></CardHeader>
              <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>FCR</TableHead>
                      <TableHead>CSAT</TableHead>
                      <TableHead>Calls Today</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentData.map(agent => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                             <Avatar className="w-8 h-8">
                                {agent.isAI ? <AvatarFallback><Bot/></AvatarFallback> : <AvatarImage src={agent.avatar} />}
                             </Avatar>
                             {agent.name}
                        </TableCell>
                        <TableCell><Badge variant={agent.isAI ? "outline" : "secondary"}>{agent.isAI ? <><Bot className="w-3 h-3 mr-1"/> AI</> : <><User className="w-3 h-3 mr-1"/> Human</>}</Badge></TableCell>
                        <TableCell>
                            <Badge variant={agent.status === 'online' || agent.status === 'busy' ? 'default' : 'secondary'} className={agent.status === 'online' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-orange-500' : ''}>
                                {agent.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{agent.fcr}%</TableCell>
                        <TableCell>{agent.csat}%</TableCell>
                        <TableCell>{agent.callsToday}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Access Control</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p>Manage user roles and permissions here.</p>
                        <Button>Manage Roles</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       <p>Connect with third-party services.</p>
                       <Button variant="outline">Add Integration</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between">
                           <Label htmlFor="email-notifs">Email Notifications</Label>
                           <Switch id="email-notifs" defaultChecked />
                       </div>
                       <div className="flex items-center justify-between">
                           <Label htmlFor="slack-notifs">Slack Alerts</Label>
                           <Switch id="slack-notifs" />
                       </div>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
