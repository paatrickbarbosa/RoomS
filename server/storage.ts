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
import { db } from "./db";
import { eq, and, gte, lte, lt, gt, desc, sql } from "drizzle-orm";

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
      role: insertUser.role || "user",
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
      amenities: insertRoom.amenities || [],
      imageUrl: insertRoom.imageUrl || null,
      description: insertRoom.description || null,
      isActive: insertRoom.isActive !== undefined ? insertRoom.isActive : true,
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
      description: insertBooking.description || null,
      status: insertBooking.status || "confirmed",
      isRecurring: insertBooking.isRecurring || false,
      recurringType: insertBooking.recurringType || null,
      recurringEndDate: insertBooking.recurringEndDate || null,
      googleCalendarEventId: insertBooking.googleCalendarEventId || null,
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
      userId: insertActivity.userId || null,
      metadata: insertActivity.metadata || {},
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

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Rooms
  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isActive, true));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async updateRoom(id: number, roomUpdate: Partial<InsertRoom>): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set(roomUpdate)
      .where(eq(rooms.id, id))
      .returning();
    return room || undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  async getRoomsWithStatus(date: Date = new Date()): Promise<RoomWithStatus[]> {
    const allRooms = await this.getAllRooms();
    const roomsWithStatus: RoomWithStatus[] = [];

    for (const room of allRooms) {
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
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.startTime));

    return result.map(row => ({
      ...row.bookings,
      room: row.rooms!,
      user: row.users!,
    }));
  }

  async getBooking(id: number): Promise<BookingWithDetails | undefined> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, id));

    const row = result[0];
    if (!row || !row.rooms || !row.users) return undefined;

    return {
      ...row.bookings,
      room: row.rooms,
      user: row.users,
    };
  }

  async getBookingsByUser(userId: number): Promise<BookingWithDetails[]> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startTime));

    return result.map(row => ({
      ...row.bookings,
      room: row.rooms!,
      user: row.users!,
    }));
  }

  async getBookingsByRoom(roomId: number, startDate?: Date, endDate?: Date): Promise<Booking[]> {
    let query = db.select().from(bookings).where(eq(bookings.roomId, roomId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          lt(bookings.startTime, endDate),
          gt(bookings.endTime, startDate)
        )
      );
    }
    
    return await query;
  }

  async getTodaysBookings(): Promise<BookingWithDetails[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          gte(bookings.startTime, startOfDay),
          lt(bookings.startTime, endOfDay)
        )
      )
      .orderBy(bookings.startTime);

    return result.map(row => ({
      ...row.bookings,
      room: row.rooms!,
      user: row.users!,
    }));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBooking(id: number, bookingUpdate: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(bookingUpdate)
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async deleteBooking(id: number): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount > 0;
  }

  async checkRoomAvailability(roomId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<boolean> {
    let query = db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, roomId),
          eq(bookings.status, 'confirmed'),
          lt(bookings.startTime, endTime),
          gt(bookings.endTime, startTime)
        )
      );

    if (excludeBookingId) {
      query = query.where(sql`${bookings.id} != ${excludeBookingId}`);
    }

    const conflictingBookings = await query;
    return conflictingBookings.length === 0;
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  // Dashboard
  async getDashboardStats(date: Date = new Date()): Promise<DashboardStats> {
    const allRooms = await this.getAllRooms();
    const roomsWithStatus = await this.getRoomsWithStatus(date);
    const todaysBookings = await this.getTodaysBookings();

    const availableRooms = roomsWithStatus.filter(room => room.isAvailable).length;
    const bookedToday = todaysBookings.filter(booking => booking.status === 'confirmed').length;
    
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'pending'));
    
    const revenueToday = todaysBookings
      .filter(booking => booking.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.totalCost, 0);

    return {
      availableRooms,
      totalRooms: allRooms.length,
      bookedToday,
      pendingBookings: pendingResult.count,
      revenueToday,
    };
  }
}

// Initialize database storage and seed data
async function initializeDatabase() {
  try {
    // Create default user if doesn't exist
    const existingUser = await db.select().from(users).where(eq(users.username, "johndoe"));
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        username: "johndoe",
        password: "password123",
        role: "admin",
        name: "John Doe",
        email: "john@example.com",
      });
    }

    // Create sample rooms if they don't exist
    const existingRooms = await db.select().from(rooms);
    
    if (existingRooms.length === 0) {
      await db.insert(rooms).values([
        {
          name: "Conference Room A",
          capacity: 12,
          type: "conference",
          amenities: ["Projector", "Whiteboard", "WiFi"],
          hourlyRate: 5000,
          imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
          description: "Large conference room with modern amenities",
          isActive: true,
        },
        {
          name: "Meeting Room B",
          capacity: 6,
          type: "meeting",
          amenities: ["Video Conf", "Screen"],
          hourlyRate: 3000,
          imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
          description: "Cozy meeting room perfect for small teams",
          isActive: true,
        },
        {
          name: "Event Space C",
          capacity: 50,
          type: "event",
          amenities: ["Sound System", "Stage", "Catering"],
          hourlyRate: 15000,
          imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
          description: "Large event space for presentations and gatherings",
          isActive: true,
        },
        {
          name: "Huddle Room D",
          capacity: 4,
          type: "huddle",
          amenities: ["Monitor", "Cozy"],
          hourlyRate: 2000,
          imageUrl: "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=80",
          description: "Small huddle room for quick meetings",
          isActive: true,
        },
      ]);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on module load and export storage
initializeDatabase();

export const storage = new DatabaseStorage();
