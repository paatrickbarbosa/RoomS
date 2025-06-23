import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Check, AlertCircle, Info, X } from "lucide-react";

export function NotificationToast() {
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        switch (data.type) {
          case 'booking_created':
            toast({
              title: "New Booking Created",
              description: `${data.data.title} has been booked successfully.`,
            });
            break;
          
          case 'booking_updated':
            toast({
              title: "Booking Updated",
              description: `${data.data.title} has been updated.`,
            });
            break;
          
          case 'booking_deleted':
            toast({
              title: "Booking Cancelled",
              description: "A booking has been cancelled.",
              variant: "destructive",
            });
            break;
          
          case 'room_created':
            toast({
              title: "New Room Added",
              description: `${data.data.name} is now available for booking.`,
            });
            break;
          
          case 'room_updated':
            toast({
              title: "Room Updated",
              description: `${data.data.name} information has been updated.`,
            });
            break;
          
          case 'conflict_detected':
            toast({
              title: "Booking Conflict",
              description: "A scheduling conflict has been detected.",
              variant: "destructive",
            });
            break;
          
          default:
            // Handle other notification types
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, toast]);

  return null; // The actual toast rendering is handled by the Toaster component
}
