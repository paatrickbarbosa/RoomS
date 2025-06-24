import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useUserBookings() {
  return useQuery({
    queryKey: ["/api/bookings"],
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(bookingData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: "Booking created",
        description: "Your room has been successfully booked",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });
}