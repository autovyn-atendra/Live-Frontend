import React from "react";
import "./global.css";
import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { SessionProvider } from "next-auth/react";
import { auth } from "./auth";
import { Toaster } from "@/components/ui/toaster";
import { PrimeReactProvider, PrimeReactContext } from "primereact/api";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ErrorBoundary from "./errorBoundary";
import PageHistoryTracker from "./PageHistoryTracker";
import AuthSync from "./asyncAuth";
import CustomerHelp from "./HELPCENTERCOMP";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <SessionProvider session={session} refetchOnWindowFocus={true}>
      <AuthSync>
        <html lang="en">
          <title>Autovyn</title>
          <body className="dark:bg-black" suppressHydrationWarning={true}>
            <Providers>
              <PrimeReactProvider>
                <PageHistoryTracker />
                <NextTopLoader />
                <Toaster />
                <CustomerHelp/>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </PrimeReactProvider>
            </Providers>
          </body>
        </html>
      </AuthSync>
    </SessionProvider>
  );
}
