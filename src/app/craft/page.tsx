import type { Metadata } from "next";
import { ComingSoon } from "@/sections/ComingSoon";

export const metadata: Metadata = { title: "Our Craft" };

export default function Page() {
  return <ComingSoon page="Our Craft" />;
}
