import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "../src/components/ui/styles.css";
import SupabaseAuthProvider from "../components/providers/SupabaseAuthProvider";
import SolanaProviders from "../components/providers/solanaProviders";
import ClientNavWrapper from "../components/ClientNavWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Proven",
  description: "bet on yourself, get rewarded",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <SupabaseAuthProvider>
          <SolanaProviders>
            <main className="flex justify-center h-screen overflow-hidden">
              <div className="relative w-full max-w-[450px] h-full flex flex-col bg-black text-white">
                {/* Main Content Area - scrollable with padding for nav */}
                <div className="flex-1 overflow-y-auto pb-16">
                  {children}
                </div>
                {/* Fixed navigation at bottom - hidden on home page */}
                <ClientNavWrapper />
              </div>
            </main>
          </SolanaProviders>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
