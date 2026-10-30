import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karan Kumar Pradhan — CSE @ VIT-AP",
  description:
    "Personal portfolio of Karan Kumar Pradhan: 2nd-year CSE student at VIT-AP University. Grinding C++ DSA, web engineering, IoT and building in public.",
  keywords: [
    "Karan Kumar Pradhan",
    "VIT-AP",
    "CSE",
    "25BCE7526",
    "Portfolio",
    "C++ DSA",
    "Web Developer",
    "Next.js",
  ],
  authors: [{ name: "Karan Kumar Pradhan", url: "https://github.com/Pradhan-07" }],
  creator: "Karan Kumar Pradhan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://karan-pradhan.vercel.app",
    title: "Karan Kumar Pradhan — CSE @ VIT-AP",
    description:
      "Learning to build things that work. C++ DSA, full-stack web development, and IoT telemetry.",
    siteName: "Karan Kumar Pradhan Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karan Kumar Pradhan — CSE @ VIT-AP",
    description:
      "Learning to build things that work. C++ DSA, full-stack web development, and IoT telemetry.",
    creator: "@pradhankar65796",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f4f2ec" media="(prefers-color-scheme: light)" />
        {/* Blocking inline script to eliminate flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('kp-theme');
                  var theme = stored;
                  if (!theme || theme === 'system') {
                    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                    theme = prefersLight ? 'light' : 'dark';
                  }
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.style.colorScheme = 'light';
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.style.colorScheme = 'dark';
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
