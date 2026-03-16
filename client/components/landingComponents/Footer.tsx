import Link from "next/link";
import { IconBrandGithub, IconBrandTwitter, IconBrandDiscord } from "@tabler/icons-react";
import Image from "next/image";

export default function Footer() {
    return (
        <div className="w-full dark:bg-neutral-950 bg-neutral-100 pb-8 pt-4">
            <footer className="py-8 flex flex-col md:flex-row justify-between items-center gap-6 lg:mx-auto mx-5 max-w-6xl px-8 rounded-xl md:rounded-2xl backdrop-blur-md dark:bg-black/30 bg-white/30 shadow-2xl border-[1px] dark:border-white/30 border-black/30">

                {/* Logo and Copyright */}
                <div className="flex flex-col items-center md:items-start gap-2">
                    <div className="font-bold text-2xl dark:text-white flex items-center gap-1">
                        <Image 
                            src="/chessMedia/checkmateLogo.png" 
                            alt="Checkmate Logo" 
                            width={100} 
                            height={100} 
                            className="w-14 h-24 object-contain"
                        />
                        CheckMate
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        © {new Date().getFullYear()} CheckMate. All rights reserved.
                    </p>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                    <Link href="https://github.com/ayush24k/chess" target="_blank" className="p-2 rounded-full border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors text-neutral-600 dark:text-neutral-300">
                        <IconBrandGithub className="w-5 h-5" />
                    </Link>
                    <Link href="#" className="p-2 rounded-full border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors text-neutral-600 dark:text-neutral-300">
                        <IconBrandTwitter className="w-5 h-5" />
                    </Link>
                    <Link href="#" className="p-2 rounded-full border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors text-neutral-600 dark:text-neutral-300">
                        <IconBrandDiscord className="w-5 h-5" />
                    </Link>
                </div>

                {/* Footer Nav */}
                <div className="flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    <Link href="#" className="hover:text-green-500 transition-colors">Terms</Link>
                    <Link href="#" className="hover:text-green-500 transition-colors">Privacy</Link>
                    <Link href="#" className="hover:text-green-500 transition-colors">Contact</Link>
                </div>

            </footer>
        </div>
    );
}
