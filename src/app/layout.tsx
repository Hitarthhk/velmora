import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { MotionProvider, MotionUIProvider, SmoothScroll } from "@/animation";
import { AgeGate } from "@/components/AgeGate";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Velmora - Single Malt Whisky", template: "%s — Velmora" },
  description: "Explore the craft and character of single malt whisky through a cinematic Himalayan landscape.",
  applicationName: "Velmora",
  openGraph: { siteName: "Velmora", type: "website", locale: "en_IN" },
  robots: { index: false, follow: false }, // pitch build — keep until launch
};

export const viewport: Viewport = { themeColor: "#07100c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <MotionProvider>
          <MotionUIProvider>
            <SmoothScroll>
              <TransitionProvider>
                <a href="#main" className="skip-link">
                  Skip to content
                </a>
                <AgeGate>
                  <Nav />
                  <main id="main" tabIndex={-1}>{children}</main>
                  <Footer />
                  <SoundToggle />
                </AgeGate>
                <div className="grain" aria-hidden="true" />
              </TransitionProvider>
            </SmoothScroll>
          </MotionUIProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
