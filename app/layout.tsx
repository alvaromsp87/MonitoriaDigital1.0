"use client";

import Footer from './components/footer';
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import FloatingChat from "./components/FloatingChat";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-[92vh] flex flex-col">
              <main className="flex-grow">
                {children}
              </main>
              <FloatingChat />
            </div>
            <Footer />
            <Script src="https://meet.jit.si/external_api.js" strategy="lazyOnload" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
