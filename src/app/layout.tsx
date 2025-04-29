'use client';

import { usePathname } from 'next/navigation';
// Remove unused Metadata import
// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "@/components/cnc/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Note: export const metadata doesn't work in Client Components.
// Metadata should be defined in page.tsx or layout.tsx that are Server Components.
// We might need to move this metadata export back to page.tsx or create a nested Server Component layout.
// For now, we'll comment it out here to make the component client-side.
// export const metadata: Metadata = {
//   title: "CNC Cut - Custom Timber Components",
//   description: "Design, visualise, price, and order custom timber parts instantly.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {pathname !== '/' && <Header />}
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
