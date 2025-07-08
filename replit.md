# MAXWIL' Bakery E-commerce Platform

## Overview

MAXWIL' Bakery is a modern full-stack e-commerce platform built for a bakery business. The application provides a customer-facing storefront for ordering baked goods and an administrative dashboard for managing products, orders, and delivery tracking. The system is designed to handle both traditional bakery items and fast-food offerings with real-time order management capabilities.

## System Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management and React Context for local state
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Styling**: Custom bakery-themed design system with warm color palette

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Well-defined tables for users, products, and orders with proper relationships

## Key Components

### Authentication System
- **Strategy**: Session-based authentication using Passport.js local strategy
- **Security**: Password hashing with scrypt, secure session management
- **Authorization**: Role-based access control (admin/customer roles)
- **Security Code**: Additional security layer for admin registration

### Product Management
- **Categories**: Supports multiple product categories (bread, pastries, cakes, fastfood)
- **CRUD Operations**: Full admin interface for product management
- **Image Support**: Product images with URL-based storage
- **Availability Tracking**: Products can be marked as available/unavailable

### Order Processing
- **Shopping Cart**: Persistent cart state with quantity management
- **Checkout Process**: Multi-step checkout with customer details and delivery information
- **Payment Methods**: Cash on delivery (COD) support
- **Status Tracking**: Order lifecycle management (pending, confirmed, preparing, out-for-delivery, delivered)

### Delivery Management
- **Address Input**: Smart address input with geolocation support
- **Map Integration**: Multiple mapping solutions (Google Maps, OpenStreetMap, Waze)
- **Coordinate Storage**: Latitude/longitude storage for precise delivery locations
- **Route Planning**: Integration with external navigation apps

### Admin Dashboard
- **Product Management**: Create, edit, delete products with category filtering
- **Order Management**: View and update order statuses
- **Revenue Tracking**: Financial reporting and analytics
- **Delivery Tracking**: Map-based order visualization

## Data Flow

1. **Customer Journey**: Browse products → Add to cart → Checkout → Order tracking
2. **Admin Workflow**: Manage products → Process orders → Update delivery status
3. **Order Lifecycle**: Pending → Confirmed → Preparing → Out for delivery → Delivered
4. **Authentication Flow**: Login/Register → Session creation → Role-based access control

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL adapter
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **passport**: Authentication middleware

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Frontend build tool with HMR
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Drizzle migrations for schema management

### Production Build
- **Frontend**: Vite build process generating static assets
- **Backend**: esbuild bundling for Node.js deployment
- **Assets**: Static file serving through Express

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **Session Secret**: Secure session encryption key
- **Google Maps API**: Optional for enhanced mapping features

### Security Considerations
- Rate limiting on API endpoints
- Security headers implementation
- Input validation using Zod schemas
- Secure session configuration

## Changelog
- July 08, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.