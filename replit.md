# App Foundation - AI-Powered Full-Stack TypeScript Foundation

## Overview
A modern full-stack TypeScript application foundation with complete authentication, user management, AI provider integration, and a beautiful UI built with React, Tailwind CSS, and shadcn/ui components. Designed as a reusable foundation for multiple applications with built-in AI capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.
Timezone: Pacific Time (PT/PST/PDT) - use for all version timestamps and release notes.

### Timezone Conversion Rules (CRITICAL)
- Pacific Standard Time (PST): UTC-8 (Nov-Mar)
- Pacific Daylight Time (PDT): UTC-7 (Mar-Nov) 
- August = PDT (UTC-7), so local time + 7 hours = UTC time
- Example: Aug 16 6:04 PM PDT = Aug 17 01:04 UTC (2025-08-17T01:04:00.000Z)
- ALWAYS verify: Does the displayed time match the intended Pacific time?

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite)
- **UI**: Shadcn/UI, Radix UI, Tailwind CSS for theming and accessibility
- **State Management**: TanStack React Query for server state, local state hooks
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **API**: RESTful JSON API
- **Middleware**: Logging, error handling, request parsing
- **Development**: Hot module reloading

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Hosting**: Neon Database (serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Strategy**: Full persistence for users, settings, and AI provider configurations

### Authentication & Authorization
- **System**: Complete email verification and password reset
- **Session Management**: Express sessions with PostgreSQL session store, optimized cookies
- **Email Service**: SMTP via Nodemailer for transactional emails
- **Persistence**: Robust session persistence across browser sessions

### Core Features
- **Authentication System**: Complete user registration, login, email verification, and password reset
- **User Management**: User profiles with Gravatar support, role-based access (user/admin)
- **AI Provider Integration**: Abstracted service layer supporting OpenAI, Anthropic, and OpenRouter with secure API key management
- **Settings Management**: Flexible user settings with theme preferences and AI provider configurations
- **Version Management**: Comprehensive version numbering displayed in footer with automatic build increments
- **Theme System**: Light/dark/system theme support with CSS custom properties

### UI/UX Decisions
- **Design System**: Consistent use of Shadcn/UI and Tailwind CSS for modern, accessible interface
- **Theming**: CSS custom properties for flexible theming and improved contrast
- **Layout**: Sticky footer layout with proper viewport height management
- **Icons**: Lucide React icons for UI elements and actions
- **User Profile**: Gravatar integration with fallback to user initials

## Foundation Architecture

### What's Included
- Complete authentication and user management system
- AI provider infrastructure with secure API key storage
- Modern UI components and theming system
- Database schema for users and settings
- Email service for authentication workflows
- Version management and development tooling

### What's Not Included (App-Specific)
- Business logic and domain-specific features
- External integrations beyond AI providers
- Custom workflows and processes
- App-specific database tables
- Domain-specific UI components

## External Dependencies

- **AI Providers**: OpenAI, Anthropic, OpenRouter
- **Database**: Neon Database (PostgreSQL)
- **Email Service**: SMTP (configurable)
- **Build Tools**: Vite
- **UI Framework**: Radix UI (primitives)
- **Validation**: Zod

## Development Guidelines

### Adding New Apps
1. Use this foundation as a GitHub template repository
2. Customize for your specific domain and features
3. Add app-specific database tables to `shared/schema.ts`
4. Implement domain logic in `server/routes.ts`
5. Build custom UI pages and components
6. Leverage existing AI infrastructure as needed

### Key Files
- `shared/schema.ts` - Database schema and validation
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `client/src/App.tsx` - Frontend routing
- `client/src/contexts/AIProviderContext.tsx` - AI provider state management
- `server/services/ai-service.ts` - AI provider abstraction layer

## Recent Changes (August 2025)

### AI Provider Integration Added
- Added comprehensive AI provider support (OpenAI, Anthropic, OpenRouter)
- Implemented secure API key management in user settings
- Created AI service abstraction layer for provider switching
- Added AI provider context for frontend state management
- Built AI settings page for provider configuration
- Updated database schema to include AI provider fields

### Foundation Extraction
- Extracted core features from StepMonkey into reusable foundation
- Removed app-specific features (test case generation, PR tools, integrations)
- Maintained essential infrastructure (auth, users, settings, AI)
- Created comprehensive README for foundation usage
- Designed for template repository pattern