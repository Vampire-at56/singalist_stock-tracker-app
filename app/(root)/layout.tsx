import Header from "@/components/header";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/better-auth/auth";

export const dynamic = "force-dynamic";

const Layout = async ({children}: {children : React.ReactNode}) => {
    const h = await headers();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);

    if (!session?.user) {
        redirect("/sign-in");
    }
    const user = {
        id: session?.user?.id,
        email: session?.user?.email,
        name: session?.user?.name,
    }

    return (
        <main className="min-h-screen text-gray-400">
            <Header />
            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout
