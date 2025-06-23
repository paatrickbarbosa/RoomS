import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBookingSchema, insertRoomSchema, insertActivitySchema } from "@shared/schema";
import { z } from "zod";

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

  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/todays-bookings", async (req, res) => {
    try {
      const bookings = await storage.getTodaysBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's bookings" });
    }
  });

  app.get("/api/dashboard/recent-activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const rooms = await storage.getRoomsWithStatus(date);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
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

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      
      // Log activity
      await storage.createActivity({
        type: "room_created",
        description: `Room "${room.name}" was created`,
        metadata: { roomId: room.id },
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

  app.put("/api/rooms/:id", async (req, res) => {
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
        metadata: { roomId: room.id },
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

  app.delete("/api/rooms/:id", async (req, res) => {
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
        metadata: { roomId: id },
      });
      
      // Broadcast update
      broadcast({ type: "room_deleted", data: { id } });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Booking routes
  app.get("/api/bookings", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      let bookings;
      
      if (userId) {
        bookings = await storage.getBookingsByUser(userId);
      } else {
        bookings = await storage.getAllBookings();
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
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

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Check room availability
      const isAvailable = await storage.checkRoomAvailability(
        bookingData.roomId,
        bookingData.startTime,
        bookingData.endTime
      );
      
      if (!isAvailable) {
        return res.status(409).json({ message: "Room is not available for the selected time" });
      }
      
      const booking = await storage.createBooking(bookingData);
      const bookingWithDetails = await storage.getBooking(booking.id);
      
      // Log activity
      await storage.createActivity({
        userId: booking.userId,
        type: "booking_created",
        description: `Booking "${booking.title}" was created`,
        metadata: { bookingId: booking.id, roomId: booking.roomId },
      });
      
      // Broadcast update
      broadcast({ type: "booking_created", data: bookingWithDetails });
      
      res.status(201).json(bookingWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
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
        metadata: { bookingId: booking.id, roomId: booking.roomId },
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

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const deleted = await storage.deleteBooking(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Log activity
      await storage.createActivity({
        userId: booking.userId,
        type: "booking_cancelled",
        description: `Booking "${booking.title}" was cancelled`,
        metadata: { bookingId: id, roomId: booking.roomId },
      });
      
      // Broadcast update
      broadcast({ type: "booking_deleted", data: { id } });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  app.post("/api/bookings/:id/check-availability", async (req, res) => {
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
