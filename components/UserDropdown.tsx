"use client";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {LogOut} from "lucide-react";
import NavItems from "@/components/Navitems";
import { signOut } from "@/lib/actions/auth.actions";

type UserDropdownProps = {
    user: User | null;
    initialStocks: StockWithWatchlistStatus[];
};

const UserDropdown = ({ user, initialStocks }: UserDropdownProps) => {
    const router = useRouter();
    const handleSignOut = async () => {
        await signOut();
        router.refresh();
        router.push("/sign-in");
    }

    if(!user){
        return (
            <Button onClick={() => router.push("/sign-in")} className="yellow-btn">
                Sign In
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-gray-4 hover:text-yellow-300">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/profile.jpg" alt="User"/>
                        <AvatarFallback
                            className="bg-yellow-300 text-yellow-900 text-sm font-bold">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                        <span className="text-base font-medium text-gray-400">
                            {user.name}
                        </span>

                    </div>

                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="text-gray-400">
                <DropdownMenuLabel>
                    <div className="flex relative items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="/profile.jpg" alt="User"/>
                            <AvatarFallback
                                className="bg-yellow-300 text-yellow-900 text-sm font-bold">{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                        <span className="text-base font-medium text-gray-400">
                            {user.name}
                        </span>
                            <span className="text-sm text-gray-400">{user.email}</span>

                        </div>

                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600" />
                <DropdownMenuItem onClick={handleSignOut} className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-400 transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2 hidden sm:block" />
                      LogOut
                </DropdownMenuItem>
                <DropdownMenuSeparator className="hidden sm:block bg-gray-600" />
                <nav className="sm:hidden">
                    <NavItems initialStocks={initialStocks}/>
                </nav>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown
