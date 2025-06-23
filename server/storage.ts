import { 
  users, rooms, bookings, activities,
  type User, type InsertUser,
  type Room, type InsertRoom,
  type Booking, type InsertBooking,
  type Activity, type InsertActivity,
  type BookingWithDetails,
  type RoomWithStatus,
  type DashboardStats
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Rooms
  getAllRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, room: Partial<InsertRoom>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  getRoomsWithStatus(date?: Date): Promise<RoomWithStatus[]>;
  
  // Bookings
  getAllBookings(): Promise<BookingWithDetails[]>;
  getBooking(id: number): Promise<BookingWithDetails | undefined>;
  getBookingsByUser(userId: number): Promise<BookingWithDetails[]>;
  getBookingsByRoom(roomId: number, startDate?: Date, endDate?: Date): Promise<Booking[]>;
  getTodaysBookings(): Promise<BookingWithDetails[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  checkRoomAvailability(roomId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<boolean>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Dashboard
  getDashboardStats(date?: Date): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private rooms: Map<number, Room> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private activities: Map<number, Activity> = new Map();
  private currentUserId = 1;
  private currentRoomId = 1;
  private currentBookingId = 1;
  private currentActivityId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "johndoe",
      password: "password123",
      role: "admin",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create sample rooms
    const sampleRooms: Room[] = [
      {
        id: this.currentRoomId++,
        name: "Conference Room A",
        capacity: 12,
        type: "conference",
        amenities: ["Projector", "Whiteboard", "WiFi"],
        hourlyRate: 5000, // $50.00
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
        description: "Large conference room with modern amenities",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentRoomId++,
        name: "Meeting Room B",
        capacity: 6,
        type: "meeting",
        amenities: ["Video Conf", "Screen"],
        hourlyRate: 3000, // $30.00
        imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
        description: "Cozy meeting room perfect for small teams",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentRoomId++,
        name: "Event Space C",
        capacity: 50,
        type: "event",
        amenities: ["Sound System", "Stage", "Catering"],
        hourlyRate: 15000, // $150.00
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
        description: "Large event space for presentations and gatherings",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentRoomId++,
        name: "Huddle Room D",
        capacity: 4,
        type: "huddle",
        amenities: ["Monitor", "Cozy"],
        hourlyRate: 2000, // $20.00
        imageUrl: "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
        description: "Small huddle room for quick meetings",
        isActive: true,
        createdAt: new Date(),
      },
    ];

    sampleRooms.forEach(room => this.rooms.set(room.id, room));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Rooms
  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.isActive);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      ...insertRoom,
      id: this.currentRoomId++,
      createdAt: new Date(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async updateRoom(id: number, roomUpdate: Partial<InsertRoom>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...roomUpdate };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getRoomsWithStatus(date: Date = new Date()): Promise<RoomWithStatus[]> {
    const rooms = await this.getAllRooms();
    const roomsWithStatus: RoomWithStatus[] = [];

    for (const room of rooms) {
      const now = new Date();
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const roomBookings = await this.getBookingsByRoom(room.id, startOfDay, endOfDay);
      
      const currentBooking = roomBookings.find(booking => 
        booking.startTime <= now && booking.endTime > now && booking.status === 'confirmed'
      );
      
      const futureBookings = roomBookings
        .filter(booking => booking.startTime > now && booking.status === 'confirmed')
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      roomsWithStatus.push({
        ...room,
        isAvailable: !currentBooking,
        currentBooking,
        nextBooking: futureBookings[0],
      });
    }

    return roomsWithStatus;
  }

  // Bookings
  async getAllBookings(): Promise<BookingWithDetails[]> {
    const bookings = Array.from(this.bookings.values());
    const bookingsWithDetails: BookingWithDetails[] = [];

    for (const booking of bookings) {
      const room = await this.getRoom(booking.roomId);
      const user = await this.getUser(booking.userId);
      if (room && user) {
        bookingsWithDetails.push({ ...booking, room, user });
      }
    }

    return bookingsWithDetails;
  }

  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const room = await this.getRoom(booking.roomId);
    const user = await this.getUser(booking.userId);
    if (!room || !user) return undefined;

    return { ...booking, room, user };
  }

  async getBookingsByUser(userId: number): Promise<BookingWithDetails[]> {
    const allBookings = await this.getAllBookings();
    return allBookings.filter(booking => booking.userId === userId);
  }

  async getBookingsByRoom(roomId: number, startDate?: Date, endDate?: Date): Promise<Booking[]> {
    let roomBookings = Array.from(this.bookings.values()).filter(booking => booking.roomId === roomId);
    
    if (startDate && endDate) {
      roomBookings = roomBookings.filter(booking => 
        booking.startTime < endDate && booking.endTime > startDate
      );
    }
    
    return roomBookings;
  }

  async getTodaysBookings(): Promise<BookingWithDetails[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const allBookings = await this.getAllBookings();
    return allBookings.filter(booking => 
      booking.startTime >= startOfDay && booking.startTime < endOfDay
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      createdAt: new Date(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBooking(id: number, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...bookingUpdate };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async checkRoomAvailability(roomId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<boolean> {
    const roomBookings = Array.from(this.bookings.values()).filter(booking => 
      booking.roomId === roomId && 
      booking.status === 'confirmed' &&
      booking.id !== excludeBookingId
    );

    return !roomBookings.some(booking => 
      booking.startTime < endTime && booking.endTime > startTime
    );
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      ...insertActivity,
      id: this.currentActivityId++,
      createdAt: new Date(),
    };
    this.activities.set(activity.id, activity);
    return activity;
  }

  // Dashboard
  async getDashboardStats(date: Date = new Date()): Promise<DashboardStats> {
    const rooms = await this.getAllRooms();
    const roomsWithStatus = await this.getRoomsWithStatus(date);
    const todaysBookings = await this.getTodaysBookings();

    const availableRooms = roomsWithStatus.filter(room => room.isAvailable).length;
    const bookedToday = todaysBookings.filter(booking => booking.status === 'confirmed').length;
    const pendingBookings = Array.from(this.bookings.values()).filter(booking => booking.status === 'pending').length;
    const revenueToday = todaysBookings
      .filter(booking => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.totalCost, 0);

    return {
      availableRooms,
      totalRooms: rooms.length,
      bookedToday,
      pendingBookings,
      revenueToday,
    };
  }
}

export const storage = new MemStorage();
