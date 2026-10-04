import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LGION — Learn with purpose",
  description: "A brighter way to learn, teach, and grow together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
