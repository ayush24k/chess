import Navbar from "@/components/landingPageComponents/Navbar";
import ThemeToggle from "@/components/tools/ThemeToggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <Navbar />
      <ThemeToggle />
      <div className="text-center">
        <h1>Chess game</h1>
        <Link href={'/game'} className="bg-green-500 text-neutral-900 px-2 py-1 rounded-lg">Join Game</Link>
      </div>
    </div>
  );
}
