import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DoorOpen, CalendarCheck, Clock, DollarSign } from "lucide-react";
import type { DashboardStats } from "@shared/schema";

export function StatsOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const statCards = [
    {
      title: "Available Now",
      value: stats?.availableRooms || 0,
      subtitle: `of ${stats?.totalRooms || 0} total rooms`,
      icon: DoorOpen,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Booked Today",
      value: stats?.bookedToday || 0,
      subtitle: "+2 from yesterday",
      icon: CalendarCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending",
      value: stats?.pendingBookings || 0,
      subtitle: "awaiting confirmation",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Revenue Today",
      value: `$${((stats?.revenueToday || 0) / 100).toFixed(2)}`,
      subtitle: "+12% from yesterday",
      icon: DollarSign,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="shadow-sm border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`${stat.color} text-xl w-6 h-6`} />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
