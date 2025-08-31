# Overview

GameScope is a comprehensive sports team management application built specifically for soccer teams. It provides coaches and team administrators with tools to manage their squad, track fixtures, analyze performance statistics, and organize match videos. The application focuses on Polk State College's women's soccer team but is designed to be adaptable for other teams and sports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a modern React-based architecture built with TypeScript and Vite:

- **Framework**: React with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming support
- **Build Tool**: Vite with hot module replacement for fast development

The frontend follows a page-based architecture with dedicated routes for:
- Dashboard (overview and key metrics)
- Fixtures (match scheduling, management, and team logo management)
- Squad (player management)
- Statistics (team performance analytics)
- Videos (match video organization)

## Recent Changes (August 31, 2025)

### Logo Management Integration
- **Moved logo management functionality from standalone page to Fixtures page**
- **Added "Logos" tab to Fixtures page alongside Season, Planning, and Videos tabs**
- **Individual theme controls**: Each team logo container has independent light/dark theme toggles
- **Background removal**: Process existing team logos to remove backgrounds with smart, color-based, and manual modes
- **Image comparison**: Side-by-side view of original vs processed logos
- **ThemedLogoContainer component**: Custom container with per-container theme persistence in localStorage

## Backend Architecture

The backend is built using Express.js with a layered architecture:

- **Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL (Neon serverless)
- **API Design**: RESTful API with standardized error handling
- **Storage Interface**: Abstracted storage layer for database operations
- **Development**: Hot reloading with tsx and middleware logging

The storage layer implements the IStorage interface, providing a clean abstraction for all database operations including teams, players, fixtures, match statistics, and user management.

## Data Storage Solutions

- **Primary Database**: PostgreSQL via Neon serverless for production scalability
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection Pooling**: Neon connection pooling for efficient database connections

The database schema includes tables for:
- Teams (with coach information and metadata)
- Players (with positions, statistics, and personal details)
- Fixtures (matches with scores, venues, and status tracking)
- Match Statistics (detailed performance metrics)
- Users (authentication and role management)

## Authentication and Authorization

The application implements a role-based access control system with three user roles:
- **Admin**: Full system access and team management
- **Coach**: Team and player management, fixture scheduling
- **Player**: Limited access to view team information and personal statistics

Session management is handled through express-session with PostgreSQL session storage using connect-pg-simple.

# External Dependencies

## Core Technologies
- **Neon Database**: Serverless PostgreSQL for production database hosting
- **Radix UI**: Accessible component primitives for consistent UI behavior
- **TanStack React Query**: Server state management and intelligent caching
- **Drizzle ORM**: Type-safe database operations and schema management

## Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **ESBuild**: Fast JavaScript bundling for production builds

## UI and Styling
- **Lucide React**: Consistent icon library
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Type-safe CSS class variations
- **Geist Font Family**: Typography system for professional appearance

## Development Environment
- **Replit Integration**: Runtime error overlays and development tooling
- **WebSocket Support**: Real-time development features with ws library
- **PostCSS**: CSS processing with Tailwind CSS integration

The application is designed to be deployed on platforms that support Node.js with PostgreSQL, with specific optimizations for Replit's development environment.