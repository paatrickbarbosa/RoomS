import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookingModal } from "@/components/bookings/booking-modal";
import { Calendar, Clock, MapPin, Edit, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { BookingWithDetails } from "@shared/schema";
import { useUserBookings, useCancelBooking } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";

export default function Bookings() {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useUserBookings();
  const cancelBookingMutation = useCancelBooking();

  const handleEditBooking = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  // Filter bookings to show only user's own bookings (unless admin)
  const userBookings = bookings.filter((booking: BookingWithDetails) => 
    user?.role === 'admin' || booking.userId === user?.id
  );

  const BookingCard = ({ booking }: { booking: BookingWithDetails }) => (
    <Card key={booking.id} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{booking.room.name}</h3>
            <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}>
              {booking.status}
            </Badge>
            {user?.role === 'admin' && (
              <Badge variant="outline" className="text-xs">
                {booking.user.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(booking.startTime), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {booking.room.capacity} people
            </div>
          </div>
          {booking.description && (
            <p className="text-sm text-gray-600 mb-2">{booking.description}</p>
          )}
          <p className="text-sm font-medium">
            Total: ${(booking.totalCost / 100).toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Only show edit button for pending bookings or admin */}
          {(booking.status === 'pending' || user?.role === 'admin') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditBooking(booking)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {/* Only allow cancellation of future bookings */}
          {new Date(booking.startTime) > new Date() && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking for {booking.room.name}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelBookingMutation.mutate(booking.id)}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={cancelBookingMutation.isPending}
                  >
                    {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'admin' ? 'Manage all room reservations' : 'Manage your room reservations'}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading bookings...</p>
          </div>
        </div>
      ) : userBookings.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't made any room reservations yet.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              Book your first room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {userBookings.map((booking: BookingWithDetails) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(undefined);
        }}
        booking={selectedBooking}
      />
    </div>
  );
}