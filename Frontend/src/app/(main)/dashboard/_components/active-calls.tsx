'use client';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

const activeCallsData = [
    {
      id: 1,
      sentiment: "negative",
      customer: "Mary Taylor",
      agent: "AI Agent 9",
      topic: "Modification Request",
      time: "10:08",
      status: "ACTIVE",
    },
    {
      id: 2,
      sentiment: "neutral",
      customer: "Donald Miller",
      agent: "AI Agent 6",
      topic: "Date Availability",
      time: "6:02",
      status: "ON-HOLD",
    },
    {
        id: 3,
        sentiment: "positive",
        customer: "Patricia Taylor",
        agent: "AI Agent 2",
        topic: "New Booking",
        time: "3:45",
        status: "ACTIVE",
    },
    {
        id: 4,
        sentiment: "neutral",
        customer: "James Anderson",
        agent: "Human Agent 1",
        topic: "Pricing",
        time: "1:12",
        status: "ACTIVE",
    }
];

const sentimentConfig = {
    negative: {
        className: "bg-red-100 text-red-800",
    },
    neutral: {
        className: "bg-gray-100 text-gray-800",
    },
    positive: {
        className: "bg-emerald-100 text-emerald-800",
    },
};

export function ActiveCalls() {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Active Calls</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                        <p className="font-bold text-lg">12</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg">3.2 min</p>
                        <p className="text-xs text-muted-foreground">Avg Wait</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-lg">18</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                     <div className="text-center">
                        <p className="font-bold text-lg text-red-500">4</p>
                        <p className="text-xs text-muted-foreground">Missed</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <div className="space-y-4">
                        {activeCallsData.map((call) => {
                            const sentiment = sentimentConfig[call.sentiment as keyof typeof sentimentConfig];
                            return (
                                <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Badge className={cn("capitalize text-xs", sentiment.className)}>{call.sentiment}</Badge>
                                        <div>
                                            <p className="font-semibold">{call.customer}</p>
                                            <p className="text-xs text-muted-foreground">Agent: {call.agent} &middot; {call.topic}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-semibold">{call.time}</p>
                                        <Badge variant={call.status === 'ACTIVE' ? "default" : "secondary"} className={cn("text-xs", call.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500')}>{call.status}</Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
