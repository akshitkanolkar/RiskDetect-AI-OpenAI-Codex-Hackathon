import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/providers";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://riskdetect.ai"),
  title: {
    default: "RiskDetect AI — See digital risks before they become disasters",
    template: "%s | RiskDetect AI",
  },
  description:
    "RiskDetect AI helps you identify privacy leaks, phishing attempts, scams, exposed credentials, malicious URLs, and digital footprint risks using AI and public threat intelligence.",
  keywords: [
    "privacy",
    "security",
    "phishing detection",
    "credential monitoring",
    "malicious URL scanner",
    "digital footprint",
    "AI security",
    "threat intelligence",
    "RiskDetect",
  ],
  authors: [{ name: "RiskDetect AI" }],
  creator: "RiskDetect AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://riskdetect.ai",
    siteName: "RiskDetect AI",
    title: "RiskDetect AI — See digital risks before they become disasters",
    description:
      "Identify privacy leaks, phishing attempts, exposed credentials, and digital footprint risks with AI-powered threat intelligence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RiskDetect AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RiskDetect AI — See digital risks before they become disasters",
    description:
      "Identify privacy leaks, phishing attempts, exposed credentials, and digital footprint risks with AI-powered threat intelligence.",
    images: ["/og-image.png"],
    creator: "@riskdetectai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-svh font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
