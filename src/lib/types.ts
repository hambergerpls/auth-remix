import { AuthConfig } from "@auth/core"
import { Adapter } from "../adapters.js"
import { Awaitable, Session } from "@auth/core/types"


export type RemixAuthConfig = Omit<AuthConfig, "raw" | "adapter"> & {
  adapter?: Adapter | ( (env: unknown) => Awaitable<Adapter> )
}

export type GetSessionResult = Promise<Session | null>
