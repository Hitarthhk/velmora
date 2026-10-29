import { notFound } from "next/navigation";
import { SceneRenderer } from "./SceneRenderer";

/** Development only: renders the procedural scenes for scripts/render-scenes.mjs. */
export default function ScenesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SceneRenderer />;
}
