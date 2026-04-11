import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcomGenius Intelligence",
  description: "TikTok Shop analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-[#0d1117] text-[#e6edf3] antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1c2128",
              border: "1px solid #30363d",
              color: "#e6edf3",
            },
          }}
        />
      </body>
    </html>
  );
}
