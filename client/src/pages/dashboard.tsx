import { useQuery } from "@tanstack/react-query";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RoomCard } from "@/components/rooms/room-card";
import { TodaysSchedule } from "@/components/dashboard/todays-schedule";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { BookingModal } from "@/components/bookings/booking-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarDays, Search } from "lucide-react";
import { useState } from "react";
import type { RoomWithStatus } from "@shared/schema";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<RoomWithStatus[]>({
    queryKey: ['/api/rooms'],
  });

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = roomTypeFilter === "all" || room.type === roomTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleBookRoom = (roomId?: number) => {
    setSelectedRoomId(roomId);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your commercial room bookings</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button onClick={() => handleBookRoom()} className="bg-primary hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Quick Book
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <CalendarDays className="w-4 h-4 mr-2" />
              Sync Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rooms List */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Room Availability</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Input 
                      type="text" 
                      placeholder="Search rooms..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="conference">Conference Room</SelectItem>
                      <SelectItem value="meeting">Meeting Room</SelectItem>
                      <SelectItem value="event">Event Space</SelectItem>
                      <SelectItem value="huddle">Huddle Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {roomsLoading ? (
                <div>Loading rooms...</div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No rooms found matching your criteria
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    onBook={() => handleBookRoom(room.id)} 
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TodaysSchedule />
          <RecentActivity />
          
          {/* Quick Actions */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => handleBookRoom()}
                className="w-full bg-primary hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book a Room
              </Button>
              <Button variant="outline" className="w-full">
                <CalendarDays className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
              <Button variant="outline" className="w-full">
                Manage Bookings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoomId(undefined);
        }}
        selectedRoomId={selectedRoomId}
      />
    </div>
  );
}
