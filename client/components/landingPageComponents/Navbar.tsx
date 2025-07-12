import Link from "next/link";
import ThemeToggle from "../tools/ThemeToggle";
import Button from "../ui/Button";

export default function Navbar() {
    return (
        <div className="fixed top-0 left-0 w-full z-50 py-4">
            <nav className="py-4 flex items-center justify-between lg:mx-auto mx-5 max-w-6xl px-5 rounded-xl md:rounded-2xl backdrop-blur-md dark:bg-black/30 bg-white/30 shadow-2xl border-[1px] dark:border-white/30 border-black/30">
                <div className="font-semibold md:text-lg text-md">
                    Chess
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Button>login</Button>
                    <Button>sign up</Button>
                </div>
            </nav>
        </div>
    )
}