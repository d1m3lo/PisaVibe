
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/cart-context";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";
import ConditionalHeaderFooter from "@/components/conditional-header-footer";
import Footer from "@/components/footer";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PISA VIBE",
  description: "Loja online de tênis e roupas com estilo minimalista.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
       <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <CartProvider>
                <div className="relative flex min-h-dvh flex-col bg-background">
                  <ConditionalHeaderFooter />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
            </CartProvider>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
         <Script id="access-tracker" strategy="afterInteractive">
          {`
            (function() {
              const hasVisited = sessionStorage.getItem('pisa-vibe-session');
              if (!hasVisited) {
                sessionStorage.setItem('pisa-vibe-session', 'true');
                try {
                   fetch('https://us-central1-studio-4155277971-b1669.cloudfunctions.net/logAccess', {
                      method: 'POST',
                      mode: 'no-cors'
                   });
                } catch (e) {
                   // silently fail
                }
              }
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
