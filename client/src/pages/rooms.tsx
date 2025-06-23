import { useQuery } from "@tanstack/react-query";
import { RoomCard } from "@/components/rooms/room-card";
import { BookingModal } from "@/components/bookings/booking-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import type { RoomWithStatus } from "@shared/schema";

export default function Rooms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>();

  const { data: rooms = [], isLoading } = useQuery<RoomWithStatus[]>({
    queryKey: ['/api/rooms'],
  });

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.amenities.some(amenity => amenity.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = roomTypeFilter === "all" || room.type === roomTypeFilter;
    const matchesCapacity = capacityFilter === "all" || 
      (capacityFilter === "small" && room.capacity <= 6) ||
      (capacityFilter === "medium" && room.capacity > 6 && room.capacity <= 20) ||
      (capacityFilter === "large" && room.capacity > 20);
    
    return matchesSearch && matchesType && matchesCapacity;
  });

  const handleBookRoom = (roomId?: number) => {
    setSelectedRoomId(roomId);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
            <p className="text-gray-600 mt-1">Browse and book available rooms</p>
          </div>
          <Button onClick={() => handleBookRoom()} className="mt-4 md:mt-0 bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Quick Book
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Input 
              type="text" 
              placeholder="Search rooms, types, or amenities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="conference">Conference Room</SelectItem>
              <SelectItem value="meeting">Meeting Room</SelectItem>
              <SelectItem value="event">Event Space</SelectItem>
              <SelectItem value="huddle">Huddle Room</SelectItem>
            </SelectContent>
          </Select>
          <Select value={capacityFilter} onValueChange={setCapacityFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Capacity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="small">Small (1-6 people)</SelectItem>
              <SelectItem value="medium">Medium (7-20 people)</SelectItem>
              <SelectItem value="large">Large (21+ people)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Available Rooms ({filteredRooms.length})
          </h2>
          
          {isLoading ? (
            <div className="text-center py-8">Loading rooms...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium mb-2">No rooms found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRooms.map((room) => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  onBook={() => handleBookRoom(room.id)}
                  showDetails={true}
                />
              ))}
            </div>
          )}
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
