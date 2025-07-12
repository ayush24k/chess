import Link from "next/link";
import Button from "../ui/Button";
import StartAnimation from "../animation/StartAnimation";
import { IconBrandGithub, IconStarFilled } from "@tabler/icons-react";

export default function HeroSection() {
    return (
        <section
            className="relative min-h-screen overflow-hidden dark:bg-black bg-neutral-200 rounded-b-4xl"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <div className="relative max-w-6xl mx-auto py-42 [overflow-anchor:none]">
                <div className="relative flex justify-center items-center gap-5 flex-col z-5">
                    <StartAnimation>
                        <div className="flex items-center flex-col gap-3 text-center px-4">
                            <p className="px-4 md:text-[16px] text-[12px] font-medium py-1 rounded-4xl inline-flex bg-gradient-to-r from-red-400 to-yellow-600 dark:text-neutral-900 shadow-2xl">taking out your anger made easier 🥰</p>
                            <h1 className="font-bold lg:text-7xl md:text-6xl text-5xl max-w-5xl pt-3 tracking-tighter">Play Chess & Abuse Random People Online!</h1>
                            <p className="mt-4 md:max-w-3xl max-w-[300px] md:text-[16px] text-[14px]">Play and take your anger out on people live in a 1v1 video chat chess lobby</p>
                            <div className="flex md:gap-8 gap-6">
                                <Button className="my-8 px-8 py-3 bg-green-500 md:text-2xl text-lg font-semibold text-neutral-900 rounded-xl">
                                    <Link href={"/game"} >Start Game</Link>
                                </Button>
                                <Button className="my-8 px-8 py-3 md:text-2xl text-lg text-neutral-900 rounded-xl">
                                    <Link href={"https://github.com/ayush24k/chess"} target="_blank" className="flex items-center justify-center gap-2" >{<IconStarFilled className="h-4 w-4" />}{<IconBrandGithub />}</Link>
                                </Button>
                            </div>
                        </div>
                    </StartAnimation>
                    {/* screen image  */}
                    <div className="w-[90%] lg:h-[580px] md:h-[480px] sm:h-[380px] h-[280px] p-5 bg-gray-500 rounded-lg border"></div>
                </div>
            </div>
            {/* bg gradient blue */}
            <div className="dark:block hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-400 rounded-full blur-[400px] md:opacity-100 opacity-50"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500 rounded-full blur-[100px] md:opacity-60 opacity-20"></div>
            </div>
        </section >
    )
}