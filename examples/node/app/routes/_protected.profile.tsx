import { Form, useRouteLoaderData } from "@remix-run/react";
import type { loader } from "./_protected";

/**
 *  We don't need to use { getSession } function to fetch the current user.
 *  We can use Remix { useMatches } to get the user data from the parent
 *  layout by searching with route id.
 */
export default function ProfilePage() {
    const { user } = useRouteLoaderData<typeof loader>("routes/_protected")!;

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
    );
}
