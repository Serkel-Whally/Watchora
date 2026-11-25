import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Watchora — Find your next favourite",
  description: "Discover remarkable films and series from every corner of the world.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
