import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import type { BookingWithDetails } from "@shared/schema";

export function TodaysSchedule() {
  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/dashboard/todays-bookings'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-primary';
      case 'pending': return 'bg-warning';
      case 'cancelled': return 'bg-error';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No bookings today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div 
                key={booking.id} 
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className={`w-2 h-12 ${getStatusColor(booking.status)} rounded-full`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{booking.title}</p>
                  <p className="text-sm text-gray-600">{booking.room.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="ghost" className="w-full mt-4 text-primary font-medium text-sm">
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
