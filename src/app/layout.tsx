import type { Metadata } from "next";
import "./globals.css";
import { MetaPixel } from "@/components/MetaPixel";

export const metadata: Metadata = {
  title: "MyInjuryValue.com — Find out what you should be paid",
  description:
    "Estimate your accident case value in minutes. The insurance company doesn't care about you. Find out what you should be paid.",
  metadataBase: new URL(process.env.PUBLIC_BASE_URL || "https://myinjuryvalue.com"),
  openGraph: {
    title: "MyInjuryValue.com — Find out what you should be paid",
    description:
      "The insurance company doesn't care about you. Find out what you should be paid.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
