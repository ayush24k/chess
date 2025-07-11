import Link from "next/link";
import Button from "../ui/Button";

export default function HeroSection() {
    return (
        <section
            className="relative min-h-screen overflow-hidden dark:bg-[#1A1A19] bg-neutral-200 rounded-b-4xl"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <div className="relative max-w-6xl mx-auto py-42">
                <div className="relative flex justify-center items-center gap-5 flex-col z-5">
                    <div className="flex justify-center items-center flex-col gap-3 text-center">
                        <p className="px-4 text-[16px] font-medium py-1 rounded-4xl inline-flex bg-gradient-to-r from-red-400 to-yellow-600 dark:text-neutral-900 shadow-2xl">taking out your anger made easier 🥰</p>
                        <h1 className="font-bold text-7xl max-w-5xl pt-3 tracking-tighter">Play Chess & Abuse Random People Online!</h1>
                        <p className="mt-7 max-3xl text-[16px]">Play and take your anger out on people live in a 1v1 video chat chess lobby</p>
                        <Link href={"/game"} className="my-8 px-8 py-2 bg-green-400 text-2xl font-semibold text-neutral-900 rounded-xl">Start Game</Link>
                    </div>

                    <div className="w-[1080px] h-[580px] bg-gray-500 rounded-lg border"></div>
                </div>
            </div>
            {/* bg gradient blue */}
            <div className="dark:block hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-400 rounded-full blur-[400px]"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500 rounded-full blur-[100px] opacity-60"></div>
            </div>
        </section>
    )
}