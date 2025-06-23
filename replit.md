# Room Booking System

## Overview

This is a full-stack commercial room booking system built with React, Node.js, and PostgreSQL. The application allows users to browse available rooms, make bookings, view calendars, and manage their reservations. It features a modern, responsive UI built with shadcn/ui components and real-time updates via WebSocket connections.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

- **Frontend**: React SPA with TypeScript, built using Vite
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket connections for live updates
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Build System**: Vite for frontend, esbuild for backend

## Key Components

### Frontend Architecture
- **React Router**: Uses `wouter` for client-side routing
- **UI Components**: Built with Radix UI primitives and shadcn/ui
- **State Management**: TanStack Query for API state, React hooks for local state
- **Real-time Updates**: WebSocket hook for live notifications
- **Form Handling**: React Hook Form with Zod validation
- **Calendar Integration**: React Big Calendar for scheduling views

### Backend Architecture
- **Express Server**: RESTful API with middleware for logging and error handling
- **WebSocket Server**: Real-time notifications for booking updates
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Storage Interface**: Abstracted storage layer (currently in-memory, ready for DB)
- **API Routes**: Organized by feature (dashboard, rooms, bookings, activities)

### Database Schema
The application uses four main entities:
- **Users**: Authentication and user management
- **Rooms**: Room details, capacity, amenities, and pricing
- **Bookings**: Reservation management with recurring support
- **Activities**: Audit trail and notification system

## Data Flow

1. **User Interface**: React components trigger API calls through TanStack Query
2. **API Layer**: Express routes handle requests and validate data
3. **Business Logic**: Storage interface manages data operations
4. **Database**: Drizzle ORM executes queries against PostgreSQL
5. **Real-time Updates**: WebSocket broadcasts changes to connected clients
6. **UI Updates**: Query cache invalidation triggers re-renders

## External Dependencies

- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)
- **UI Components**: Extensive Radix UI component library
- **Date Handling**: date-fns for date manipulation
- **Calendar**: React Big Calendar for scheduling interface
- **Validation**: Zod for schema validation
- **Charts**: Recharts for dashboard analytics

## Deployment Strategy

The application is configured for Replit deployment with:
- **Development**: `npm run dev` starts both frontend and backend
- **Production Build**: Vite builds frontend, esbuild bundles backend
- **Database**: Drizzle migrations with `npm run db:push`
- **Environment**: PostgreSQL module enabled in Replit
- **Scaling**: Autoscale deployment target configured

The build process creates a `dist` directory with:
- Static frontend assets in `dist/public`
- Bundled backend server in `dist/index.js`

## Recent Changes

- June 23, 2025: PostgreSQL database integration completed
- June 23, 2025: Admin authentication system implemented with JWT tokens
- June 23, 2025: Admin panel created with full CRUD operations for users and rooms
- June 23, 2025: Role-based access control added (admin/user roles)
- June 23, 2025: Secure password hashing with bcrypt implemented

## User Preferences

Preferred communication style: Simple, everyday language.