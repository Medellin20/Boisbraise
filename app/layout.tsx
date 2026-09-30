import type { Metadata } from "next";
import "../client/src/index.css";

export const metadata: Metadata = {
  title: "Holz & Glut",
  description: "Trockenes Brennholz mit zuverlässiger Lieferung.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
