import Link from "next/link";
import ThemeToggle from "../tools/ThemeToggle";
import Button from "../ui/Button";
import Image from "next/image";

export default function Navbar() {
    return (
        <div className="fixed top-0 left-0 w-full z-50 py-4">
            <nav className="py-4 flex items-center justify-between lg:mx-auto mx-5 max-w-6xl px-5 rounded-xl md:rounded-2xl backdrop-blur-md dark:bg-black/30 bg-white/30 shadow-2xl border-[1px] dark:border-white/30 border-black/30">
                <div className="font-bold md:text-2xl text-xl flex items-center gap-1">
                    <Image 
                        src="/chessMedia/checkmateLogo.png" 
                        alt="Checkmate Logo" 
                        width={120} 
                        height={120} 
                        className="w-12 h-12 object-contain"
                    />
                    CheckMate
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Button className="rounded-xl md:rounded-2xl">
                        <Link href={'/lobby'}>Play</Link>
                    </Button>
                </div>
            </nav>
        </div>
    )
}