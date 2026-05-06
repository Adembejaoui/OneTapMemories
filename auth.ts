import { getServerSession } from "next-auth"
import { authConfig } from "./lib/auth"

export const auth = () => getServerSession(authConfig)