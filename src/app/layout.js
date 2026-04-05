import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "HomeCare Pro - Healthcare Management System",
  description: "Professional home care management platform for healthcare providers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
