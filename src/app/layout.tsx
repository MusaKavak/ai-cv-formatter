import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI CV Formatter",
  description: "Format your CV with AI",
  manifest: "/manifest.json",
  authors: [{ name: "Musa" }],
  keywords: ["AI", "CV", "Formatter", "Resume"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-title" content="AI CV Formatter" />
      </head>
      <body>{children}</body>
    </html>
  );
}
