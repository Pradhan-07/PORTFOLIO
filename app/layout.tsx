import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karan Kumar Pradhan — BTech CSE @ VIT-AP",
  description:
    "Personal portfolio of Karan Kumar Pradhan: 2nd-year BTech CSE student at VIT-AP University. Grinding C++ DSA, web development, IoT and computer vision.",
  keywords: [
    "Karan Kumar Pradhan",
    "VIT-AP",
    "BTech CSE",
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
    title: "Karan Kumar Pradhan — BTech CSE @ VIT-AP",
    description:
      "Learning to build things that work. C++ DSA, full-stack web development, and IoT telemetry.",
    siteName: "Karan Kumar Pradhan Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karan Kumar Pradhan — BTech CSE @ VIT-AP",
    description:
      "Learning to build things that work. C++ DSA, full-stack web development, and IoT telemetry.",
    creator: "@pradhankar65796",
  },
  icons: {
    icon: "/favicon.ico",
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
        {/* Anti-flash script ensuring dark theme default without hydration flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('kp_theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fcfcfc] dark:bg-[#0a0a0a] text-neutral-900 dark:text-[#ededed] transition-colors duration-200">
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
