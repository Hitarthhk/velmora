import type { Metadata } from "next";
import { ComingSoon } from "@/sections/ComingSoon";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return <ComingSoon page="Contact" />;
}
