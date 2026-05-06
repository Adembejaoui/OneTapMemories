"use server"

import { createToken } from "lib/db/tokens"
import { auth } from "auth"

export async function generateTokenAction(): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  const token = await createToken()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const url = `${baseUrl}/create-event/${token.token}`

  return { success: true, url }
}