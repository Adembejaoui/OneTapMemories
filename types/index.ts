// Shared TypeScript types for OneTapMemories application

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  date: Date
  location: string | null
  coverImage: string | null
  userId: string
  isPublic: boolean
  inviteToken: string | null
  createdAt: Date
  updatedAt: Date
  memories: Memory[]
}

export interface Memory {
  id: string
  eventId: string
  userId: string
  title: string
  description: string | null
  mediaUrl: string
  mediaType: 'image' | 'video'
  thumbnailUrl: string | null
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Invite {
  id: string
  eventId: string
  email: string
  token: string
  role: 'viewer' | 'contributor'
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code?: string
  }
  success: boolean
}

export type MemoryWithUser = Memory & {
  user: User
}