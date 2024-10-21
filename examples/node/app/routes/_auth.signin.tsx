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
  const loginResponse = await signIn(request, provider as BuiltInProviderType ?? "credentials", { redirectTo: new URL( request.url ).searchParams.get("redirectTo") ?? "" });
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
