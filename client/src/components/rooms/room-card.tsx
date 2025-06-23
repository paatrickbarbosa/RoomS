import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, Users, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import type { RoomWithStatus } from "@shared/schema";

interface RoomCardProps {
  room: RoomWithStatus;
  onBook: () => void;
  showDetails?: boolean;
}

export function RoomCard({ room, onBook, showDetails = false }: RoomCardProps) {
  const getStatusInfo = () => {
    if (room.currentBooking) {
      return {
        status: "Occupied",
        color: "text-error",
        bgColor: "bg-error/10",
        message: `Until: ${format(new Date(room.currentBooking.endTime), 'p')}`,
        buttonText: "Unavailable",
        buttonDisabled: true,
        buttonVariant: "secondary" as const,
      };
    } else if (room.nextBooking) {
      const nextBookingTime = new Date(room.nextBooking.startTime);
      const now = new Date();
      const hoursUntilNext = Math.ceil((nextBookingTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (hoursUntilNext <= 2) {
        return {
          status: "Soon Available",
          color: "text-warning",
          bgColor: "bg-warning/10",
          message: `Free at: ${format(nextBookingTime, 'p')}`,
          buttonText: "Book Later",
          buttonDisabled: false,
          buttonVariant: "default" as const,
        };
      }
    }
    
    return {
      status: "Available",
      color: "text-success",
      bgColor: "bg-success/10",
      message: room.nextBooking 
        ? `Next: ${format(new Date(room.nextBooking.startTime), 'p')} - ${format(new Date(room.nextBooking.endTime), 'p')}`
        : "Free all day",
      buttonText: "Book Now",
      buttonDisabled: false,
      buttonVariant: "default" as const,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {room.imageUrl && (
              <img 
                src={room.imageUrl} 
                alt={room.name}
                className="w-16 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{room.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <Users className="w-4 h-4" />
                <span>Capacity: {room.capacity} people</span>
                {showDetails && (
                  <>
                    <span>•</span>
                    <span>${(room.hourlyRate / 100).toFixed(2)}/hour</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {room.amenities.slice(0, showDetails ? room.amenities.length : 3).map((amenity) => (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {!showDetails && room.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 3} more
                  </Badge>
                )}
              </div>
              {showDetails && room.description && (
                <p className="text-sm text-gray-600 mt-2">{room.description}</p>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <Badge 
              className={`${statusInfo.color} ${statusInfo.bgColor} flex items-center space-x-1`}
              variant="outline"
            >
              <Circle className="w-2 h-2 fill-current" />
              <span>{statusInfo.status}</span>
            </Badge>
            <p className="text-sm text-gray-500 mt-1">{statusInfo.message}</p>
            <Button
              className="mt-2"
              size="sm"
              variant={statusInfo.buttonVariant}
              disabled={statusInfo.buttonDisabled}
              onClick={onBook}
            >
              {statusInfo.buttonText}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
