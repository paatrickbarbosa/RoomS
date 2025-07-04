import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBookingSchema, insertRoomSchema, insertActivitySchema, insertUserSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword, comparePassword, generateToken, authenticateToken, requireAdmin, requireAuth, type AuthRequest } from "./auth";

// WebSocket connection management
const wsConnections = new Set<WebSocket>();

function broadcast(message: any) {
  const data = JSON.stringify(message);
  wsConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    wsConnections.add(ws);
    
    ws.on('close', () => {
      wsConnections.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateLastLogin(user.id);

      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
      });

      // Log activity
      await storage.createActivity({
        userId: user.id,
        type: "user_login",
        description: `User ${user.username} logged in`,
        metadata: { userAgent: req.headers['user-agent'] || 'unknown' },
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user) {
        await storage.createActivity({
          userId: req.user.id,
          type: "user_logout",
          description: `User ${req.user.username} logged out`,
          metadata: {},
        });
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: "user", // Default role for registration
        isActive: true,
      });

      // Log activity
      await storage.createActivity({
        userId: user.id,
        type: "user_registered",
        description: `User ${user.username} registered`,
        metadata: { userAgent: req.headers['user-agent'] || 'unknown' },
      });

      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    res.json(req.user);
  });

  // User management routes (Admin only)
  app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "user_created",
        description: `User ${user.username} was created by admin`,
        metadata: { createdUserId: user.id },
      });

      // Don't send password in response
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }

      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "user_updated",
        description: `User ${user.username} was updated by admin`,
        metadata: { updatedUserId: user.id },
      });

      // Don't send password in response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "user_deleted",
        description: `User ${user.username} was deleted by admin`,
        metadata: { deletedUserId: id },
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Dashboard routes (require auth)
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/todays-bookings", authenticateToken, async (req, res) => {
    try {
      const bookings = await storage.getTodaysBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's bookings" });
    }
  });

  app.get("/api/dashboard/recent-activities", authenticateToken, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Room routes (viewing requires auth, CRUD requires admin)
  app.get("/api/rooms", authenticateToken, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const rooms = await storage.getRoomsWithStatus(date);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  app.post("/api/rooms", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      
      // Log activity
      await storage.createActivity({
        type: "room_created",
        description: `Room "${room.name}" was created`,
        metadata: { roomId: room.id }
      });
      
      // Broadcast update
      broadcast({ type: "room_created", data: room });
      
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.put("/api/rooms/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roomData = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(id, roomData);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Log activity
      await storage.createActivity({
        type: "room_updated",
        description: `Room "${room.name}" was updated`,
        metadata: { roomId: room.id }
      });
      
      // Broadcast update
      broadcast({ type: "room_updated", data: room });
      
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid room data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete("/api/rooms/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      const deleted = await storage.deleteRoom(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      // Log activity
      await storage.createActivity({
        type: "room_deleted",
        description: `Room "${room.name}" was deleted`,
        metadata: { roomId: id }
      });
      
      // Broadcast update
      broadcast({ type: "room_deleted", data: { id } });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Booking routes (require auth)
  app.get("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let bookings;
      
      // Regular users can only see their own bookings, admins see all
      if (req.user!.role === 'admin') {
        const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
        if (userId) {
          bookings = await storage.getBookingsByUser(userId);
        } else {
          bookings = await storage.getAllBookings();
        }
      } else {
        bookings = await storage.getBookingsByUser(req.user!.id);
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Set the user ID from the authenticated user
      const bookingWithUser = {
        ...bookingData,
        userId: req.user!.id,
      };
      
      // Check room availability
      const isAvailable = await storage.checkRoomAvailability(
        bookingWithUser.roomId,
        bookingWithUser.startTime,
        bookingWithUser.endTime
      );
      
      if (!isAvailable) {
        return res.status(400).json({ message: "Room is not available for the selected time" });
      }

      // Get room to calculate cost
      const room = await storage.getRoom(bookingWithUser.roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Calculate duration in hours
      const durationMs = new Date(bookingWithUser.endTime).getTime() - new Date(bookingWithUser.startTime).getTime();
      const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
      const totalCost = durationHours * room.hourlyRate;

      const finalBooking = {
        ...bookingWithUser,
        totalCost,
        status: 'confirmed' as const,
      };

      const booking = await storage.createBooking(finalBooking);
      
      // Log activity
      await storage.createActivity({
        userId: booking.userId,
        type: "booking_created",
        description: `User ${req.user!.username} created booking for ${room.name}`,
        metadata: { bookingId: booking.id, roomName: room.name },
      });

      // Broadcast booking update
      broadcast({
        type: "booking_created",
        booking,
      });

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bookingData = insertBookingSchema.partial().parse(req.body);
      
      // If updating time, check availability
      if (bookingData.startTime || bookingData.endTime || bookingData.roomId) {
        const existingBooking = await storage.getBooking(id);
        if (!existingBooking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        
        const startTime = bookingData.startTime || existingBooking.startTime;
        const endTime = bookingData.endTime || existingBooking.endTime;
        const roomId = bookingData.roomId || existingBooking.roomId;
        
        const isAvailable = await storage.checkRoomAvailability(roomId, startTime, endTime, id);
        
        if (!isAvailable) {
          return res.status(409).json({ message: "Room is not available for the selected time" });
        }
      }
      
      const booking = await storage.updateBooking(id, bookingData);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const bookingWithDetails = await storage.getBooking(booking.id);
      
      // Log activity
      await storage.createActivity({
        userId: booking.userId,
        type: "booking_updated",
        description: `Booking "${booking.title}" was updated`,
        metadata: { bookingId: booking.id, roomId: booking.roomId }
      });
      
      // Broadcast update
      broadcast({ type: "booking_updated", data: bookingWithDetails });
      
      res.json(bookingWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns the booking or is admin
      if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }

      // Check if booking is in the future (can't cancel past bookings)
      const now = new Date();
      if (new Date(booking.startTime) <= now) {
        return res.status(400).json({ message: "Cannot cancel bookings that have already started" });
      }

      const deleted = await storage.deleteBooking(id);
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Log activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "booking_cancelled",
        description: `User ${req.user!.username} cancelled booking for ${booking.room.name}`,
        metadata: { bookingId: id, roomName: booking.room.name },
      });
      
      // Broadcast booking update
      broadcast({
        type: "booking_cancelled",
        bookingId: id,
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  app.post("/api/bookings/:id/check-availability", authenticateToken, async (req, res) => {
    try {
      const { roomId, startTime, endTime } = req.body;
      const id = parseInt(req.params.id);
      
      const isAvailable = await storage.checkRoomAvailability(
        roomId,
        new Date(startTime),
        new Date(endTime),
        id
      );
      
      res.json({ available: isAvailable });
    } catch (error) {
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  return httpServer;
}
