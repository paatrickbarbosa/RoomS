# Room Booking System

A comprehensive commercial room scheduling application built with React, Node.js, and TypeScript.

## Features

- **Real-time Notifications**: WebSocket-powered live updates for booking changes
- **Dashboard Overview**: Statistics and room availability at a glance
- **Room Management**: Browse, filter, and search available rooms by type and capacity
- **Interactive Calendar**: Full calendar view with booking management
- **Booking System**: Create, edit, and cancel bookings with recurring support
- **Google Calendar Integration**: Ready for Google Calendar sync (mock implementation included)
- **Responsive Design**: Modern UI with dark mode support
- **Admin Dashboard**: Complete management interface for rooms and bookings

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM (currently using in-memory storage)
- **Real-time**: WebSocket connections
- **State Management**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Calendar**: React Big Calendar

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5000`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   └── vite.ts            # Vite development setup
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── package.json           # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:push` - Push database schema (when using PostgreSQL)

## Database Setup

The application currently uses in-memory storage for demonstration. To use PostgreSQL:

1. Set up a PostgreSQL database
2. Update the database configuration in `drizzle.config.ts`
3. Run `npm run db:push` to create tables
4. Update the storage implementation to use Drizzle ORM

## Google Calendar Integration

The application includes mock Google Calendar integration. To implement real integration:

1. Set up Google Cloud Console project
2. Enable Google Calendar API
3. Obtain API credentials
4. Replace mock implementation in `client/src/lib/mock-data.ts`

## Deployment

The application is configured for Replit deployment but can be deployed to any Node.js hosting platform:

1. Build the application: `npm run build`
2. Set environment variables
3. Start the server: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details