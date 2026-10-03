import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/lib/store";
import { ThemeProvider, NO_FLASH_THEME_SCRIPT } from "@/lib/theme";
import AuthGate from "@/components/auth/AuthGate";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Comfort Companion",
  description: "Talk to a trained, verified listener — whenever you need one.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <div className="app-frame-outer">
            <div className="app-frame">
              <AppStateProvider>
                <ToastProvider>
                  <AuthGate>{children}</AuthGate>
                </ToastProvider>
              </AppStateProvider>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
