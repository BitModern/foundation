# App Foundation

A modern, full-stack TypeScript application foundation with authentication, user management, AI provider integration, and a beautiful UI built with React, Tailwind CSS, and shadcn/ui components.

## Features

### 🔐 Complete Authentication System
- Email/password registration and login
- Email verification workflow  
- Password reset functionality
- Secure session management with PostgreSQL storage
- Role-based access control (user/admin)

### 🤖 AI Provider Integration
- Support for multiple AI providers (OpenAI, Anthropic, OpenRouter)
- Secure API key management and storage
- Model selection and availability checking
- Generic chat/completion endpoints
- Easy to extend with new providers

### 👥 User Management
- User profiles with Gravatar support
- Account settings and profile editing
- Password change functionality
- Admin user management interface
- Role-based route protection

### 🎨 Modern UI/UX
- Built with React, TypeScript, and Tailwind CSS
- shadcn/ui component library for consistent design
- Dark/light/system theme support
- Fully responsive design
- Accessible components with proper ARIA labels

### ⚙️ Settings & Preferences
- User-specific settings with database persistence
- Theme preferences
- Customizable app-specific settings
- Notification preferences

### 🛠️ Developer Experience
- TypeScript throughout the entire stack
- Hot module reloading in development
- TanStack React Query for server state management
- Drizzle ORM for type-safe database operations
- Express.js backend with middleware
- Vite for fast development and building

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack React Query** for server state
- **Wouter** for routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Express sessions** with PostgreSQL storage
- **Nodemailer** for email service
- **bcrypt** for password hashing
- **AI Integrations** - OpenAI, Anthropic SDKs

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon Database account)
- SMTP email service credentials

### 1. Clone and Install
```bash
git clone <your-foundation-repo>
cd app-foundation
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# Session Secret
SESSION_SECRET="your-super-secret-session-key-here"

# Email Service (for verification emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com" 
SMTP_PASS="your-app-password"
SMTP_FROM="Your App <your-email@gmail.com>"

# Frontend URL (for email links)
FRONTEND_URL="http://localhost:5000"
```

### 3. Database Setup
```bash
# Push schema to database
npm run db:push

# Optional: Open Drizzle Studio to view/manage data
npm run db:studio
```

### 4. Start Development
```bash
npm run dev
```

Your app will be available at `http://localhost:5000`

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── contexts/       # React contexts
├── server/                 # Backend Express app
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic services
│   ├── utils/              # Server utilities
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database operations
├── shared/                 # Shared types and schemas
│   ├── schema.ts          # Database schema & validation
│   └── version.ts         # Version management
└── scripts/               # Build and utility scripts
```

## Key Features Detail

### Authentication Flow
1. User registers with email/password
2. Email verification sent automatically
3. User verifies email via link
4. Full access granted to authenticated routes
5. Sessions persist for 90 days by default

### User Roles
- **user**: Standard user with access to profile and settings
- **admin**: Full access including user management

### Theme System
- Supports light, dark, and system themes
- CSS custom properties for easy customization
- Persisted in user settings

### Database Schema
- **users**: Core user data with authentication fields
- **user_settings**: Flexible settings with AI provider configs and API key storage

## Customization

### Adding New Features
1. Define database tables in `shared/schema.ts`
2. Add API routes in `server/routes.ts` 
3. Create storage methods in `server/storage.ts`
4. Build frontend pages and components
5. Add routes in `client/src/App.tsx`

### Using AI Features
The foundation includes AI provider infrastructure:
- Configure providers in settings: `POST /api/settings`
- Get available providers: `GET /api/ai/providers`  
- Fetch models: `GET /api/models/:provider`
- Send chat requests: `POST /api/ai/chat`
- Frontend components: `AIProviderCard`, `AIProviderContext`

### Styling
- Modify `client/src/index.css` for global styles
- Customize theme colors in CSS custom properties
- Add new shadcn/ui components with `npx shadcn-ui add <component>`

### Environment Variables
All environment variables are documented in the `.env` example above. 
Make sure to set production values for deployment.

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
- Set all `.env` variables in your hosting environment
- Update `FRONTEND_URL` to your production domain
- Use a strong `SESSION_SECRET`
- Configure proper SMTP credentials

## License

MIT License - feel free to use this foundation for your projects!

## Contributing

This is a foundation template - fork it and make it your own! 

---

Built with ❤️ using modern web technologies