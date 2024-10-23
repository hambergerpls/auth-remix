/**
 *
 * :::warning
 * `auth-remix` is currently experimental. The API _will_ change in the future.
 * :::
 *
 * Remix Auth is the community Remix integration for Auth.js.
 * It provides a simple way to add authentication to your Remix app in a few lines of code.
 *
 * ## Installation
 * ```bash npm2yarn
 * npm install auth-remix
 * ```
 *
 * ## Usage
 *
 * ```ts title="src/lib/auth.server.ts"
 * import Credentials from "auth-remix/providers/credentials";
 * import { RemixAuth } from "auth-remix";
 * export const { loader, action, getSession, signIn, signOut } = RemixAuth({ 
 *   providers: [
 *     Credentials({
 *       id: "credentials",
 *       name: "Password",
 *       credentials: {
 *         password: { label: "Password", type: "password" },
 *       },
 *       async authorize(credentials) {
 *         if (credentials.password === "password") {
 *           return {
 *             email: "bob@alice.com",
 *             name: "Bob Alice",
 *             image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
 *           }
 *         }
 *         if (credentials.password === "123") {
 *           return {
 *             email: "alice@bob.com",
 *             name: "Alice Bob",
 *             image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
 *           }
 *         }
 *         return null;
 *       }
 *     })
 *   ]
 * });
 * ```
 *
 * ```ts title="src/routes/auth.$.ts"
 * export { loader, action } from "~/lib/auth.server";
 * ```
 *
 * Don't forget to set the `AUTH_SECRET` environment variable in your `.env` file. This should be a minimum of 32 characters, random string. On UNIX systems you can use `openssl rand -hex 32` or check out `https://generate-secret.vercel.app/32`.
 *
 *
 * ## Signing in and signing out
 * ```tsx title="src/routes/signin.tsx"
 *
 * import { BuiltInProviderType } from "@auth/core/providers";
 * import { json, ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
 * import { Form, useActionData, useLoaderData } from "@remix-run/react";
 * import { getCsrfToken, signIn } from "~/lib/auth.server";
 *
 *
 * export const loader = async ({ request }: LoaderFunctionArgs) => {
 *   const csrfTokenResponse = await getCsrfToken(request);
 *   if (!csrfTokenResponse.ok) {
 *     throw new Error("Error fetching csrf");
 *   }
 *   const { csrfToken } = await csrfTokenResponse.json()
 *   return json( { csrfToken }, { headers: csrfTokenResponse.headers } );
 * }
 *
 * export const action: ActionFunction = async ({ request }) => {
 *   const provider = ( await request.clone().formData() ).get("provider")
 *   const loginResponse = await signIn(request, provider as BuiltInProviderType ?? "credentials", { redirectTo: new URL( request.url ).searchParams.get("redirectTo") ?? "" });
 *   return loginResponse;
 * }
 *
 * export default function SignInPage() {
 *   const { csrfToken } = useLoaderData<typeof loader>();
 *   const error = useActionData<typeof action>();
 *   return (
 *     <div>
 *       { error && <p>{error}</p> }
 *       <Form method="POST">
 *         <label htmlFor="password">Password</label>
 *         <input name="password" type="password" />
 *         <input name="provider" type="hidden" value="credentials" />
 *         <input name="csrfToken" type="hidden" value={csrfToken} />
 *       </Form>
 *     </div>
 *   )
 * }
 * ```
 *
 * You can sign in or out by calling signIn or signOut function exported from your `src/lib/auth.server.ts`.
 * Make sure to include the `csrfToken` in the request body for all sign-in and sign-out requests.
 *
 *
 * ## Authorization
 * You can protect routes by checking for the presence of a session and then redirect to a login page if the session is not present.
 * This can be done via layout nesting as follows:
 *
 * ```ts title="src/routes/_protected.tsx"
 * import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
 * import { Outlet } from "@remix-run/react";
 * import { getSession } from "~/lib/auth.server";
 *
 * export const loader = async ({ request }: LoaderFunctionArgs) => {
 *   const user = await getSession(request);
 *   if (!user || !user.user) {
 *     return redirect(`/signin?redirectTo=${request.url}`);
 *   }
 *   return json({ user: user.user })
 * }
 * 
 * export default function ProtectedPage() {
 *   return <Outlet />
 * }
 * ```
 *
 * ### Per Route
 * ```ts title="src/routes/protected.ts"
 * export const loader = async ({ request }: LoaderFunctionArgs) => {
 *   const user = await getSession(request);
 *   if (!user) {
 *     return redirect(`/`);
 *   }
 *   return json( { user } );
 * }
 * ```
 *
 * ## Managing sessions
 * You can access the session data from the parent layout as follows
 *
 * ```ts title="src/routes/_protected.profile.tsx"
 * import { Form, useMatches } from "@remix-run/react"
 * import { loader } from "./_protected";
 * import { SerializeFrom } from "@remix-run/node";
 * 
 * export default function ProfilePage() {
 *   const { user } = useMatches().find((e) => e.id === 'routes/_protected')?.data as SerializeFrom<typeof loader>;
 * 
 *   return (
 *     <div>
 *       <p>Name: {user.name}</p>
 *       <p>Email: {user.email}</p>
 *       <img src={user.image ?? ""} />
 *       <p>Raw: {JSON.stringify(user)}</p>
 *       <Form method="GET" action="/signout">
 *         <button type="submit">Sign Out</button>
 *       </Form>
 *     </div>
 *   )
 * }
 * ```
 *
 *
 * @module auth-remix/cloudflare
 */

import {
  Auth,
  type AuthConfig,
  createActionURL,
  customFetch,
} from "@auth/core"
import type { Session } from "@auth/core/types"
import { type LoaderFunction, type LoaderFunctionArgs, type ActionFunction, type ActionFunctionArgs, redirect } from "@remix-run/cloudflare"
import { BuiltInProviderType, ProviderType } from "../providers/index.js"
import { RemixAuthConfig } from "../lib/types.js"
import { setEnvDefaults } from "../lib/utils.js"

export { customFetch }
export { AuthError, CredentialsSignin } from "@auth/core/errors"
export type {
  Account,
  DefaultSession,
  Profile,
  Session,
  User,
} from "@auth/core/types"

export function RemixAuth(config: RemixAuthConfig) {
  const loader: LoaderFunction = async ({ request, params, context }) => {
    // @ts-expect-error
    setEnvDefaults(context.cloudflare.env, config)
    config.basePath = getBasePath({ request, params })
    return await Auth(request, config as AuthConfig)
  }

  const action: ActionFunction = async ({ request, params, context }) => {
    // @ts-expect-error
    setEnvDefaults(context.cloudflare.env, config)
    config.basePath = getBasePath({ request, params })
    return await Auth(request, config as AuthConfig)
  }

  const getCsrfToken = async (
    { request, context }: Omit< LoaderFunctionArgs | ActionFunctionArgs, "params" >,
  ): Promise<Response> => {
    // @ts-expect-error
    setEnvDefaults(context.cloudflare.env, config)
    const url = createActionURL(
      "csrf",
      request.headers.get("x-forwarded-proto") ?? new URL( request.url ).protocol,
      request.headers,
      // @ts-expect-error
      context.cloudflare.env,
      config
    )

    const response = await Auth(
      new Request(url),
      config as AuthConfig
    )

    if (!response.ok) {
      throw new Error(( await response.json<Error>() ).message)
    }
    return response;
  }

  const getSession = async (
    { request, context }: Omit< LoaderFunctionArgs | ActionFunctionArgs, "params" >,
  ): GetSessionResult => {
    // @ts-expect-error
    setEnvDefaults(context.cloudflare.env, config)
    const url = createActionURL(
      "session",
      request.headers.get("x-forwarded-proto") ?? new URL( request.url ).protocol,
      request.headers,
      // @ts-expect-error
      context.cloudflare.env,
      config
    )

    const response = await Auth(
      new Request(url, { headers: { cookie: request.headers.get("cookie") ?? "" } }),
      config as AuthConfig
    )

    const { status = 200 } = response

    const data = await response.json<Session | Error>()

    if (!data || !Object.keys(data).length) return null
    if (status === 200) return data as Session
    throw new Error(( data as Error ).message)
  }


  const signIn = async (
    { request, context }: Omit< LoaderFunctionArgs | ActionFunctionArgs, "params" >,
    provider?: BuiltInProviderType,
    options: ({ redirectTo?: string }) = {},
    authorizationParams?: string[][] | Record<string, string> | string | URLSearchParams,
  ) => {
    // @ts-expect-error
    setEnvDefaults(context.cloudflare.env, config)
    const headers = new Headers(request.headers)
    const {
      redirectTo,
    } = options

    const callbackUrl = redirectTo?.toString() ?? headers.get("Referer") ?? "/"
    const signInURL = createActionURL(
      "signin",
      headers.get("x-forwarded-proto") ?? new URL( request.url ).protocol,
      headers,
      // @ts-expect-error
      context.cloudflare.env,
      config
    )

    if (!provider) {
      signInURL.searchParams.append("callbackUrl", callbackUrl)
      return redirect(signInURL.toString())
    }

    let url = `${signInURL}/${provider}?${new URLSearchParams(
authorizationParams
)}`
    let foundProvider: { id?: BuiltInProviderType; type?: ProviderType } = {}

    for (const providerConfig of config.providers) {
      const { options, ...defaults } =
        typeof providerConfig === "function" ? providerConfig() : providerConfig
      const id = (options?.id as string | undefined) ?? defaults.id
      if (id === provider) {
        foundProvider = {
          id,
          type: (options?.type as ProviderType | undefined) ?? defaults.type,
        }
        break
      }
    }

    if (!foundProvider.id) {
      const url = `${signInURL}?${new URLSearchParams({ callbackUrl })}`
      return redirect(url)
    }

    if (foundProvider.type === "credentials") {
      url = url.replace("signin", "callback")
    }

    headers.set("Content-Type", "application/x-www-form-urlencoded")
    const body = new URLSearchParams({ ...Object.fromEntries(await request.formData()), callbackUrl })
    const newReq = new Request(url, { method: "POST", headers, body })
    const res = await Auth(newReq, { ...config as AuthConfig })

    return res
  }

  const signOut = async (
  { request, context }: Omit< LoaderFunctionArgs | ActionFunctionArgs, "params" >,
  options: { redirectTo?: string } = {},
) => {
  // @ts-expect-error
  setEnvDefaults(context.cloudflare.env, config)
  const headers = new Headers( request.headers )
  headers.set("Content-Type", "application/x-www-form-urlencoded")

  const url = createActionURL(
    "signout",
    headers.get("x-forwarded-proto") ?? new URL( request.url ).protocol,
    headers,
    // @ts-expect-error
    context.cloudflare.env,
    config
  )
  const callbackUrl = options?.redirectTo ?? headers.get("Referer") ?? "/"
  const body = new URLSearchParams({ ...Object.fromEntries(await request.formData()), callbackUrl })
  const newReq = new Request(url, { method: "POST", headers, body })

  const res = await Auth(newReq, { ...config as AuthConfig })

  return res
}

  return { loader, action, getSession, getCsrfToken, signIn, signOut }
}

export type GetSessionResult = Promise<Session | null>


export function getBasePath({ request, params }: Omit< LoaderFunctionArgs | ActionFunctionArgs, "context" >) {
  const url = new URL(request.url);
  const [ firstParams ] = Object.values( params )
  if (!firstParams) {
    throw new Error("Value of first params is undefined")
  }
  return url.pathname.split(firstParams[0])[0].replace(/\/$/, "")
}
