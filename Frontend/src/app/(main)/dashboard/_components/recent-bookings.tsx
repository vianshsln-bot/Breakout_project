
'use client';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IndianRupee } from "lucide-react";

const recentBookingsData = [
    {
      id: 1,
      company: "Future Solutions",
      event: "Anniversary",
      amount: "₹2,316",
      status: "confirmed",
      date: "10/4/2025, 2:02:35 AM",
      paymentMethod: "bank"
    },
    {
      id: 2,
      company: "Prime Industries",
      event: "Conference",
      amount: "₹5,361",
      status: "cancelled",
      date: "10/3/2025, 5:15:52 PM",
      paymentMethod: "bank"
    },
    {
      id: 3,
      company: "Innovate Co.",
      event: "Product Launch",
      amount: "₹7,820",
      status: "confirmed",
      date: "9/28/2025, 11:30:00 AM",
      paymentMethod: "card"
    }
];

const statusConfig = {
    confirmed: {
        className: "bg-emerald-100 text-emerald-800",
    },
    cancelled: {
        className: "bg-red-100 text-red-800",
    },
};

export function RecentBookings() {
    return (
        <Card className="col-span-1">
            <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Recent Bookings</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <div className="space-y-4">
                        {recentBookingsData.map((booking) => {
                             const status = statusConfig[booking.status as keyof typeof statusConfig];
                            return (
                                <div key={booking.id} className="flex items-start justify-between p-3 rounded-lg bg-background hover:bg-muted/50">
                                    <div>
                                        <p className="font-semibold">{booking.company}</p>
                                        <p className="text-sm text-muted-foreground">{booking.event}</p>
                                        <p className="text-lg font-bold text-primary mt-1">{booking.amount}</p>
                                        <p className="text-xs text-muted-foreground">{booking.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={cn("capitalize text-xs", status.className)}>{booking.status}</Badge>
                                        <p className="text-xs text-muted-foreground mt-1">{booking.paymentMethod}</p>
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
