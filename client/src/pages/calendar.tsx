import { useQuery } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { BookingModal } from "@/components/bookings/booking-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { BookingWithDetails } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/bookings'],
  });

  const events = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.title} - ${booking.room.name}`,
    start: new Date(booking.startTime),
    end: new Date(booking.endTime),
    resource: booking,
  }));

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(start);
    setIsBookingModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    // Handle event selection if needed
    console.log('Selected event:', event);
  };

  const eventStyleGetter = (event: any) => {
    const booking = event.resource as BookingWithDetails;
    let backgroundColor = '#1976D2'; // primary blue
    
    if (booking.status === 'pending') {
      backgroundColor = '#FF9800'; // warning orange
    } else if (booking.status === 'cancelled') {
      backgroundColor = '#F44336'; // error red
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">View and manage all room bookings</p>
          </div>
          <Button 
            onClick={() => setIsBookingModalOpen(true)} 
            className="mt-4 md:mt-0 bg-primary hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        {isLoading ? (
          <div className="text-center py-8">Loading calendar...</div>
        ) : (
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              defaultView="week"
              step={30}
              timeslots={2}
              min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
              max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
            />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-card rounded-xl shadow-sm border border-border p-4">
        <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-warning rounded"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-error rounded"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedDate(undefined);
        }}
        selectedDate={selectedDate}
      />
    </div>
  );
}
