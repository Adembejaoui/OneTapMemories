# OneTapMemories

A Next.js 14 App Router application for creating and sharing event memories.

## Tech Stack

- Next.js 14 - App Router
- TypeScript - Strict mode
- TailwindCSS - With CSS variables
- shadcn/ui - Component library
- Prisma - ORM with PostgreSQL/Supabase
- NextAuth - Authentication
- Supabase - Database and storage

## Database Schema

### Models

#### User
- `id` (String) - Primary key
- `email` (String) - Unique
- `name` (String) - Optional
- `image` (String) - Optional
- `role` (Role) - Default: ADMIN
- `createdAt` (DateTime)

#### Event
- `id` (String) - Primary key
- `name` (String)
- `slug` (String) - Unique
- `email` (String)
- `maxUploadsPerGuest` (Int) - Default: 10
- `createdAt` (DateTime)
- `uploads` (Upload[]) - One-to-many relation

#### Upload
- `id` (String) - Primary key
- `eventId` (String) - Foreign key to Event
- `url` (String)
- `guestToken` (String) - Anonymous fingerprint for upload tracking
- `createdAt` (DateTime)

#### EventCreationToken
- `id` (String) - Primary key
- `token` (String) - Unique
- `isUsed` (Boolean) - Default: false
- `expiresAt` (DateTime) - Optional
- `createdAt` (DateTime)

#### Role (Enum)
- `ADMIN`

## Data Access Layer

All database operations are centralized in `app/lib/db/`:

- **tokens.ts** - Token creation, validation, and consumption
- **events.ts** - Event CRUD operations
- **uploads.ts** - Upload management with guest limits
- **schemas.ts** - Zod validation schemas
- **index.ts** - Exports all database functions

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Initialize shadcn/ui** (optional)
   ```bash
   npx shadcn-ui@latest init
   ```

5. **Seed database** (optional)
   ```bash
   npx prisma db seed
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

## API Routes

### Events
- `POST /api/events` - Create event
- `GET /api/events` - List all events
- `GET /api/events/[id]` - Get event with uploads

### Uploads
- `POST /api/uploads` - Create upload (enforces guest limits)
- `GET /api/uploads?eventId=...` - List event uploads

### Tokens
- `POST /api/tokens/validate` - Validate and consume creation token
- `GET /api/tokens/validate?token=...` - Check token validity

## Usage Example

```typescript
import { createEvent, getEventWithUploads } from '@/app/lib/db'
import { createUpload, countGuestUploads } from '@/app/lib/db'

// Create event
const event = await createEvent({
  name: 'Wedding 2026',
  slug: 'wedding-2026',
  email: 'contact@example.com',
  maxUploadsPerGuest: 10,
})

// Create upload
const upload = await createUpload({
  eventId: event.id,
  url: 'https://example.com/image.jpg',
  guestToken: 'guest-fingerprint-123',
})

// Check guest upload count
const count = await countGuestUploads(event.id, 'guest-fingerprint-123')

// Get event with all uploads
const eventWithUploads = await getEventWithUploads(event.id)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database

## License

MIT