import { json, ActionFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getCsrfToken, getSession, signOut } from "~/lib/auth.server";


/**
 *  Auth.js expects a csrf token for signing out. Therefore, we need to
 *  get the token using { getCsrfToken } . The response returned
 *  will contain `Set-Cookie` headers that also contain the csrf token to
 *  be set on the browser cookie.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  /** We check if the user is logged in, else we redirect to `/` */
  const user = await getSession(request);
  if (!user) {
    return redirect(`/`);
  }
  const csrfTokenResponse = await getCsrfToken(request);
  if (!csrfTokenResponse.ok) {
    throw new Error("Error fetching csrf");
  }
  const { csrfToken } = await csrfTokenResponse.json()
  return json( { csrfToken }, { headers: csrfTokenResponse.headers } );
}


/**
 *  We pass the `POST` { request } to the signOut function.
 *  We can optionally pass a { redirectTo } option if we want 
 *  to redirect the user to a specific page after signing out.
 */
export const action: ActionFunction = async ({ request }) => {
  /** We check if the user is logged in, else we redirect to `/` */
  const user = await getSession(request);
  if (!user) {
    return redirect(`/`);
  }
  const signOutResponse = await signOut(request, { redirectTo: new URL( request.url ).searchParams.get("redirectTo") ?? "" });
  return signOutResponse;
}

/**
 *  We use { useLoaderData } to retrieve the csrfToken
 *  and put the value in a hidden input field.
 */
export default function SignOutPage() {
  const { csrfToken } = useLoaderData<typeof loader>();
  const error = useActionData<typeof action>();
  return (
    <div>
      { error && <p>{error}</p> }
      <p>Are you sure you want to sign out?</p>
      <Form method="POST">
        <button type="submit" >Sign out</button>
        <input name="csrfToken" type="hidden" value={csrfToken} />
      </Form>
    </div>
  )
}
