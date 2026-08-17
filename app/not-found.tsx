// app/not-found.tsx
'use client';
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

export default function NotFound() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [remainingTime, setRemainingTime] = useState(10);

    // Auto-redirect after 10 seconds
    useEffect(() => {
        // countdown timer
        const interval = setInterval(() => {
            setRemainingTime((prev) => (prev > 1 ? prev - 1 : 0));
        }, 1000);

        timeoutRef.current = setTimeout(() => {
            history.back(); // Go back automatically
        }, 10000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            clearInterval(interval);
        };
    }, []);

    const handleBackbutton = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        history.back(); // Go back manually
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 bg-gradient-to-br from-slate-100 via-white to-slate-300 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700 text-center text-gray-900 dark:text-white overflow-hidden">

            {/* 🔔 Attractive Countdown in Right Corner */}
            <div className="absolute top-5 right-5 flex flex-col items-center space-y-2">
                <div
                    className={`w-20 h-20 flex items-center justify-center rounded-full text-3xl font-extrabold text-white shadow-lg transition-all duration-500 animate-pulse`}
                    style={{
                        backgroundColor: [
                            "#ef4444", // red
                            "#f97316", // orange
                            "#eab308", // yellow
                            "#22c55e", // green
                            "#3b82f6", // blue
                            "#6366f1", // indigo
                            "#8b5cf6", // violet
                            "#ec4899", // pink
                            "#14b8a6", // teal
                            "#f43f5e", // rose
                        ][(remainingTime - 1) % 10],
                    }}
                >
                    {remainingTime}
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reloading...
                </p>
            </div>

            {/* Main Illustration */}
            <img
                src="/logo.png"
                alt="Under Construction"
                className="w-full max-w-xl h-auto mb-8 drop-shadow-xl"
                style={{
                    animation: 'slideDown 7s ease-in-out 2s infinite',
                }}
            />

            <style jsx>{`
              @keyframes slideDown {
                0% {
                  transform: translateY(-100%);
                  opacity: 0;
                }
                10% {
                  transform: translateY(0);
                  opacity: 1;
                }
                100% {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>

            {/* Big Heading */}
            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 text-transparent bg-clip-text mb-4">
                This Page Currently Under Development
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl">
                We're working hard to bring you a better experience. <br />
                Our devs are at the keyboard as we speak 🧑‍💻🛠️
            </p>

            {/* Decorative Icons */}
            <div className="flex flex-wrap justify-center gap-6 mt-10">
                <img src="https://img.icons8.com/color/96/html-5--v1.png" alt="HTML5" />
                <img src="https://img.icons8.com/color/96/css3.png" alt="CSS3" />
                <img src="https://img.icons8.com/color/96/javascript.png" alt="JavaScript" />
                <img src="https://img.icons8.com/color/96/react-native.png" alt="React" />
                <img src="https://img.icons8.com/color/96/tailwind_css.png" alt="Tailwind" />
                <img src="https://img.icons8.com/color/96/nodejs.png" alt="Node.js" />
            </div>

            {/* Support Message */}
            <div className="mt-10 text-sm text-red-600 dark:text-red-300">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                    />
                </svg>
                <h1 className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl">
                    This feature is not yet available. For urgent needs, please contact the
                    <span className="font-semibold"> Autovyn Support Team</span>.
                </h1>
            </div>

            {/* CTA Button */}
            <Button variant="print" size={"lg"} className="mt-5" onClick={handleBackbutton} >
                🔙 Back to Home
            </Button>
        </div>
    );
}
