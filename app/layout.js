import "./globals.css";
import Navbar from "@/components/Navbar";
import IntroSplash from "@/components/IntroSplash";

export const metadata = {
  title: "Plain water",
  description: "Plain water. Nothing to explain.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body>
        <IntroSplash />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
