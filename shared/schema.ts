import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  type: text("type").notNull(), // "conference", "meeting", "event", "huddle"
  amenities: json("amenities").$type<string[]>().notNull().default([]),
  hourlyRate: integer("hourly_rate").notNull(), // in cents
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("confirmed"), // "pending", "confirmed", "cancelled"
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringType: text("recurring_type"), // "daily", "weekly", "monthly"
  recurringEndDate: timestamp("recurring_end_date"),
  googleCalendarEventId: text("google_calendar_event_id"),
  totalCost: integer("total_cost").notNull(), // in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // "booking_created", "booking_cancelled", "calendar_synced", etc.
  description: text("description").notNull(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended types for API responses
export type BookingWithDetails = Booking & {
  room: Room;
  user: User;
};

export type RoomWithStatus = Room & {
  isAvailable: boolean;
  nextBooking?: Booking;
  currentBooking?: Booking;
};

export type DashboardStats = {
  availableRooms: number;
  totalRooms: number;
  bookedToday: number;
  pendingBookings: number;
  revenueToday: number;
};

// Define relations for better querying
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  activities: many(activities),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));
