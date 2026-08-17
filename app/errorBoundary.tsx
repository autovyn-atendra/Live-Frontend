'use client';

import Link from "next/link";
import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    remainingTime: number; // countdown seconds
}

export default class ErrorBoundary extends Component<Props, State> {
    private reloadTimeout: NodeJS.Timeout | null = null;
    private countdownInterval: NodeJS.Timeout | null = null;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, remainingTime: 10 };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true, remainingTime: 10 };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    componentDidUpdate(_: Props, prevState: State) {
        if (this.state.hasError && !prevState.hasError) {
            // Start countdown
            this.countdownInterval = setInterval(() => {
                this.setState((prev) => {
                    if (prev.remainingTime > 1) {
                        return { remainingTime: prev.remainingTime - 1 };
                    } else {
                        clearInterval(this.countdownInterval!);
                        return { remainingTime: 0 };
                    }
                });
            }, 1000);

            // Auto reload after 10s
            this.reloadTimeout = setTimeout(() => {
                console.log("Auto-reloading after 10 seconds...");
                window.location.reload();
            }, 10000);
        }
    }

    componentWillUnmount() {
        if (this.reloadTimeout) clearTimeout(this.reloadTimeout);
        if (this.countdownInterval) clearInterval(this.countdownInterval);
    }

    handleReload = () => {
        this.setState({ hasError: false, remainingTime: 10 });
        if (this.reloadTimeout) clearTimeout(this.reloadTimeout);
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        window.location.reload();
    };



    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 py-12 bg-gradient-to-br from-slate-100 via-white to-slate-300 
                dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700 text-center text-gray-900 dark:text-white overflow-hidden">



                    {/* Main Illustration */}
                    <img
                        src="/logo.png"
                        alt="Under Construction"
                        className="w-full max-w-xl h-auto mb-8 drop-shadow-xl"
                        style={{
                            animation: 'slideDown 1s ease-out infinite',
                            animationDelay: '0s',
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-out',
                            animationFillMode: 'forwards',
                            animationDirection: 'normal',
                            animationDuration: '7s',
                            animationName: 'slideDown',
                            animationTimingFunction: 'ease-in-out',
                            animationDelay: '2s' // wait 14s after each animation
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




                    {/* <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-orange-600 via-red-500 to-pink-500 text-transparent bg-clip-text mb-4">
                        <p className="text-lg font-semibold">Fetching fresh data...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">Hang tight, this may take a few seconds.</p>
                    </h1>

                    <h2 className="text-2xl font-bold">Oops! We hit a snag.</h2>
                
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl">
                        We're working hard to bring you a better experience. <br />
                        Our devs are at the keyboard as we speak 🧑‍💻🛠️
                    </p> */}

                    {/* 🔔 Attractive Countdown in Right Corner */}
                    <div className="absolute top-30 right-40 flex flex-col items-center space-y-2">
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
                                ][(this.state.remainingTime - 1) % 10], // different bg each number
                            }}
                        >
                            {this.state.remainingTime}
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reloading...
                        </p>
                    </div>


                    <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-yellow-500 via-orange-600 to-red-500 text-transparent bg-clip-text mb-4">
                        Connection Issue Detected ⚡
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                        Looks like your <span className="font-semibold text-red-600">internet connection is slow</span> or
                        <span className="font-semibold text-red-500"> temporarily down</span>.
                        <br />
                        Please check your network and try again in a few moments. 🚀
                    </p>



                    {/* Decorative Icons/Tools */}
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

                        <p className="text-lg md:text-xl text-gray-900 dark:text-gray-300 max-w-2xl">
                            <h1>  This feature is not yet available. For urgent needs, please contact the <span className="font-semibold">Autovyn Support Team</span>.</h1></p>
                    </div>

                    {/* CTA Button */}
                    <Link href="/" className="mt-10">
                        <Button variant="print" className="w-full" size={"lg"}
                            onClick={this.handleReload}
                        >
                            Reload

                        </Button>
                    </Link>
                </div>
            );
        }

        return this.props.children;
    }
}






