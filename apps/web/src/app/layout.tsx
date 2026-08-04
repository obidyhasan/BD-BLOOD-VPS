import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import ReduxProvider from "../redux/providers/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: "BD Blood - Bangladesh No.1 Blood Bank",
  description: "Created By Code2Launch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("text-base antialiased", inter.className)}>
        <ReduxProvider>
          <Toaster richColors position="top-right" />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
