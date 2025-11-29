import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoodJob - Job Search CRM",
  description: "Organize your job search with AI-powered tracking and insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
