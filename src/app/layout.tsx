
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/context/cart-context";
import { FirebaseClientProvider } from "@/firebase";
import { ThemeProvider } from "@/components/theme-provider";
import ConditionalHeaderFooter from "@/components/conditional-header-footer";
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
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
       <head>
        {/* EfiPay Script */}
        <Script
          id="efipay-script"
          strategy="beforeInteractive"
          src={isProduction 
            ? "https://cdn.efipay.com.br/checkout/prod/efipay.min.js" 
            : "https://cdn.efipay.com.br/checkout/sandbox/efipay.min.js"}
        />
      </head>
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
              <ConditionalHeaderFooter>
                {children}
              </ConditionalHeaderFooter>
            </CartProvider>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
