import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabelFlow - AI-Powered Gmail Dashboard",
  description: "Connect your Gmail, filter emails by labels, and analyze conversations with Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 relative font-sans">
        <AuthProvider>
          {children}
          {/* Crafted by Digital Hammerr Floating Badge */}
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/85 backdrop-blur-md border border-slate-200/85 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 group select-none pointer-events-auto">
            <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
              Crafted by <span className="font-semibold text-slate-800">Digital Hammerr</span>
            </span>
            <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-100 flex-shrink-0 bg-white">
              <img
                src="/digital-hammerr-logo.jpg"
                alt="Digital Hammerr Logo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
