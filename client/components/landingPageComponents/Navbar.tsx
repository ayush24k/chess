import Link from "next/link";
import ThemeToggle from "../tools/ThemeToggle";
import Button from "../ui/Button";

export default function Navbar() {
    return (
        <div className="fixed top-0 left-0 w-full z-50 pt-4">
            <nav className="py-3 flex items-center justify-between max-w-6xl mx-auto md:px-5 rounded-xl md:rounded-2xl backdrop-blur-md dark:bg-black/30 bg-white/30 shadow-2xl">
                <div className="font-semibold text-lg">
                    Chess
                </div>
                <div className="flex items-center gap-3">
                    <div>
                        <a>about</a>
                    </div>
                    <ThemeToggle />
                    <Button>login</Button>
                    <Button>sign up</Button>
                </div>
            </nav>
        </div>
    )
}