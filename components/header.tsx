import Link from "next/link";
import Image from "next/image";
import Navitems from "@/components/Navitems";
import UserDropdown from "@/components/UserDropdown";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";

const Header = async () => {
    const h = await headers();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: h }).catch(() => null);
    const user = session?.user ?? null;

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <Image src="/assets/icons/logo.svg" alt="Signalist logo" width={140} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className="hidden sm:block">
                    <Navitems />
                </nav>
                <UserDropdown user={user} />

            </div>
        </header>
    )
}
export default Header
