import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Venue Seek",
  description: "Find performance venues for solo classical guitarists",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-on-surface">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
