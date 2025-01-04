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
 * //src/lib/auth.server.ts
 * import Credentials from "auth-remix/providers/credentials";
 * import Google from "auth-remix/providers/google";
 * import { RemixAuth } from "auth-remix/node"; // or cloudflare/deno
 * export const { loader, action, getSession, getCsrfToken, signIn, signOut } = RemixAuth({
 *   // adapter: (env) => D1Adapter(env.db) for cloudflare
 *   // adapter: DrizzleAdapter(db, schema)
 *   providers: [
 *     // clientId and secret will be impicitly set from env!
 *     // e.g. AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET from env
 *     // reference: https://authjs.dev/guides/environment-variables#environment-variable-inference
 *     Google({})
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
 * //src/routes/auth.$.ts
 * export { loader, action } from "~/lib/auth.server";
 * ```
 *
 * Don't forget to set the `AUTH_SECRET` environment variable in your `.env` file. This should be a minimum of 32 characters, random string. On UNIX systems you can use `openssl rand -hex 32` or check out `https://generate-secret.vercel.app/32`.
 *
 *
 * ## Signing in and signing out
 * ```tsx title="src/routes/signin.tsx"
 * //src/routes/signin.tsx
 * import { BuiltInProviderType } from "@auth/core/providers";
 * import { json, ActionFunction, LoaderFunctionArgs } from "@remix-run/node"; or cloudflare/deno
 * import { Form, useActionData, useLoaderData } from "@remix-run/react";
 * import { getCsrfToken, signIn } from "~/lib/auth.server";
 *
 *
 * export const loader = async ({ request, context }: LoaderFunctionArgs) => {
 *   const csrfTokenResponse = await getCsrfToken({ request, context });
 *   if (!csrfTokenResponse.ok) {
 *     throw new Error("Error fetching csrf");
 *   }
 *   const { csrfToken } = await csrfTokenResponse.json()
 *   return json( { csrfToken }, { headers: csrfTokenResponse.headers } );
 * }
 *
 * export const action: ActionFunction = async ({ request, context }) => {
 *   const provider = ( await request.clone().formData() ).get("provider")
 *   const loginResponse = await signIn({ request, context }, provider as BuiltInProviderType ?? "credentials", { redirectTo: new URL( request.url ).searchParams.get("redirectTo") ?? "" });
 *   if (!loginResponse.ok) {
 *     return json({ error: ( await loginResponse.json() ).message })
 *   }
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
 * //src/routes/_protected.tsx
 * import { json, LoaderFunctionArgs, redirect } from "@remix-run/node"; or cloudflare/deno
 * import { Outlet } from "@remix-run/react";
 * import { getSession } from "~/lib/auth.server";
 *
 * export const loader = async ({ request, context }: LoaderFunctionArgs) => {
 *   const user = await getSession({ request, context });
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
 * //src/routes/protected.ts
 * export const loader = async ({ request, context }: LoaderFunctionArgs) => {
 *   const user = await getSession({ request, context });
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
 * //src/routes/_protected.profile.tsx
 * import { Form, useRouteLoaderData } from "@remix-run/react"
 * import { loader } from "./_protected";
 *
 * export default function ProfilePage() {
 *   const { user } = useRouteLoaderData<typeof loader>("routes/_protected");
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

import { customFetch } from "@auth/core";
import type { RemixAuthConfig } from "../lib/types.js";
import {
    loader,
    action,
    getCsrfToken,
    getSession,
    signIn,
    signOut,
} from "../core/index.js";
import type {
    LoaderFunctionArgs,
    ActionFunctionArgs,
    AppLoadContext,
} from "@remix-run/cloudflare";

export { customFetch };
export { AuthError, CredentialsSignin } from "@auth/core/errors";
export type {
    Account,
    DefaultSession,
    Profile,
    Session,
    User,
} from "@auth/core/types";

declare module "@remix-run/cloudflare" {
    interface AppLoadContext {
        cloudflare: {
            env: Record<string, string>;
        };
    }
}

export function RemixAuth(config: RemixAuthConfig) {
    return {
        loader: (args: LoaderFunctionArgs | ActionFunctionArgs) => {
            return loader(config, args.context.cloudflare.env)(args);
        },
        action: (args: LoaderFunctionArgs | ActionFunctionArgs) => {
            return action(config, args.context.cloudflare.env)(args);
        },
        getSession: (
            args: Omit<LoaderFunctionArgs | ActionFunctionArgs, "params">,
        ) => {
            return getSession(config, args.context.cloudflare.env)(args);
        },
        getCsrfToken: (
            args: Omit<LoaderFunctionArgs | ActionFunctionArgs, "params">,
        ) => {
            return getCsrfToken(config, args.context.cloudflare.env)(args);
        },
        signIn: (
            args: Pick<
                LoaderFunctionArgs | ActionFunctionArgs,
                "request" | "context"
            >,
            opt: Parameters<ReturnType<typeof signIn>>[1],
        ) => {
            return signIn(
                config,
                (args.context as AppLoadContext).cloudflare.env,
            )(args, opt);
        },
        signOut: (
            args: Pick<
                LoaderFunctionArgs | ActionFunctionArgs,
                "request" | "context"
            >,
            opt?: Parameters<ReturnType<typeof signIn>>[1],
        ) => {
            return signOut(
                config,
                (args.context as AppLoadContext).cloudflare.env,
            )(args, opt);
        },
    };
}
