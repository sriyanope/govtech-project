import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; 
import Header from "../components/layout/Header"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parks4People",
  description: "Your smart companion for park exploration in Singapore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <div>
          {children}
        </div>
          
        
      </body>
    </html>
  );
}