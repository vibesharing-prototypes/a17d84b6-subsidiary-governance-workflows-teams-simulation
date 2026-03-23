import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERG — Microsoft Teams Simulation",
  description: "Enterprise Risk Governance workflow simulated in Microsoft Teams",
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
