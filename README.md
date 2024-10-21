# auth-remix (Remix Auth) (Experimental)

`auth-remix` is currently experimental. The API _will_ change in the future.

Remix Auth is the community Remix integration for Auth.js.
It provides a simple way to add authentication to your Remix app in a few lines of code.

## TODO

- [x] `auth-remix/node`
- [ ] `auth-remix/cloudflare`
- [ ] `auth-remix/deno`
- [x] `examples/node`
- [ ] `examples/cloudflare`
- [ ] `examples/deno`
- [ ] Tests for `auth-remix/node`
- [ ] Tests for `auth-remix/cloudflare`
- [ ] Tests for `auth-remix/deno`
- [x] Credentials example
- [ ] OAuth example
- [ ] Magic Link example
- [ ] WebAuthn example

## Installation

```bash npm2yarn
npm install auth-remix
```

## Usage

```ts title="src/lib/auth.server.ts"
// src/lib/auth.server.ts

/**
 *  Ensure the current file name has `.server` in order to explicitly
 *  mark it that it should be server-side only.
 */

import Credentials from "auth-remix/providers/credentials";
import { RemixAuth } from "auth-remix/node";

/**
 *  We import { RemixAuth } and call the function with a provider and destructure the object returned.
 *  In this example, we use { Credentials } provider for a simple password-based authentication.
 *
 *  { loader } and { action } are handlers to be exported at `auth.$` route.
 *  { getSession } function is used to retrieve the current user's session.
 *  { getCsrfToken } function is used to retrieve csrfToken and set it in cookie.
 *  { signIn } is a function to sign in a user.
 *  { signOut } is a function to sign out a user.
 */
export const { loader, action, getSession, getCsrfToken, signIn, signOut } = RemixAuth({ 
  providers: [
    Credentials({
      id: "credentials",
      name: "Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials.password === "password") {
          return {
            email: "bob@alice.com",
            name: "Bob Alice",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          }
        }
        if (credentials.password === "123") {
          return {
            email: "alice@bob.com",
            name: "Alice Bob",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          }
        }
        return null;
      }
    })
  ]
});
```

```ts title="src/routes/auth.$.ts"
// src/routes/auth.$.ts
/** 
 * We export the loader and action function from RemixAuth at auth.$ route.
 * This acts as the /auth/<action>/<provider> endpoint for Auth.js
 * */
export { loader, action } from "~/lib/auth.server";
```

Don't forget to set the `AUTH_SECRET` environment variable in your `.env` file.
This should be a minimum of 32 characters, random string.
On UNIX systems you can use `openssl rand -hex 32` or check out `https://generate-secret.vercel.app/32`.

## Signing in and signing out

```tsx title="src/routes/signin.tsx"
// src/routes/signin.tsx
import { BuiltInProviderType } from "@auth/core/providers";
import { json, ActionFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getCsrfToken, signIn } from "~/lib/auth.server";

/**
 *  Auth.js expects a csrf token for signing in. Therefore, we need to
 *  get the token using { getCsrfToken } . The response returned
 *  will contain `Set-Cookie` headers that also contain the csrf token to
 *  be set on the browser cookie.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const csrfTokenResponse = await getCsrfToken(request);
  if (!csrfTokenResponse.ok) {
    throw new Error("Error fetching csrf");
  }
  const { csrfToken } = await csrfTokenResponse.json()
  return json( { csrfToken }, { headers: csrfTokenResponse.headers } );
}

/**
 *  We retrieve the { provider } value from the form and pass 
 *  the `POST` { request } and { provider } to the signIn function.
 *  Having provider value in the `Form` is useful if we want to
 *  implement multiple sign-in methods. We can optionally pass a
 *  { redirectTo } option if we want to redirect the user to a
 *  specific page after authentication.
 */
export const action: ActionFunction = async ({ request }) => {
  const provider = ( await request.clone().formData() ).get("provider")
  const loginResponse = await signIn(
    request,
    provider as BuiltInProviderType ?? "credentials",
    { redirectTo: new URL( request.url ).searchParams.get("redirectTo") ?? "" }
  );
  return loginResponse;
}

/**
 *  We use { useLoaderData } to retrieve the csrfToken
 *  and put the value in a hidden input field.
 */
export default function SignInPage() {
  const { csrfToken } = useLoaderData<typeof loader>();
  const error = useActionData<typeof action>();
  return (
    <div>
      { error && <p>{error}</p> }
      <Form method="POST">
        <label htmlFor="password">Password</label>
        <input name="password" type="password" />
        <input name="provider" type="hidden" value="credentials" />
        <input name="csrfToken" type="hidden" value={csrfToken} />
      </Form>
    </div>
  )
}
```

You can sign in or out by calling signIn or signOut function exported from your `src/lib/auth.server.ts`.
Make sure to include the `csrfToken` in the request body for all sign-in and sign-out requests.

## Authorization

You can protect routes by checking for the presence of a session and then redirect to a login page if the session is not present.
This can be done via layout nesting as follows:

```tsx title="src/routes/_protected.tsx"
// src/routes/_protected.tsx
import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getSession } from "~/lib/auth.server";

/**
 *  The `_protected` layout acts as a protected shell that fetches
 *  the current user from the current session. We can redirect the
 *  user to a sign-in page if the user is not logged in, else we
 *  return the user data which is accessible by the children.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getSession(request);
  if (!user || !user.user) {
    return redirect(`/signin?redirectTo=${request.url}`);
  }
  return json({ user: user.user })
}

export default function ProtectedPage() {
  return <Outlet />
}
```

### Per Route

```tsx title="src/routes/protected.tsx"
import { getSession } from "~/lib/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getSession(request);
  if (!user) {
    return redirect(`/`);
  }
  return json( { user } );
}
```

## Managing sessions

You can access the session data from the parent layout as follows

```tsx title="src/routes/_protected.profile.tsx"
// src/routes/_protected.profile.tsx
import { Form, useMatches } from "@remix-run/react"
import { loader } from "./_protected";
import { SerializeFrom } from "@remix-run/node";


/**
 *  We don't need to use { getSession } function to fetch the current user.
 *  We can use Remix { useMatches } to get the user data from the parent
 *  layout by searching with route id.
 */
export default function ProfilePage() {
  const { user } = useMatches().find((e) => e.id === 'routes/_protected')?.data as SerializeFrom<typeof loader>;

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <img src={user.image ?? ""} />
      <p>Raw: {JSON.stringify(user)}</p>
      <Form method="GET" action="/signout">
        <button type="submit">Sign Out</button>
      </Form>
    </div>
  )
}
```

## Contributing

Feel free to open a PR.

## License

ISC
