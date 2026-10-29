import { PolicyPage } from "@/components/PolicyPage";
export const metadata = { title: "Terms" };
export default function Terms() {
  return <PolicyPage title="Terms of this preview">
    <section><h2>A concept for review</h2><p>This website demonstrates a neutral whisky experience. Bottle designs, tasting profiles and craft scenes are illustrative. They do not identify a commercial product or establish its origin, production details or availability.</p></section>
    <section><h2>Adults only</h2><p>The whisky experience is intended for visitors of legal drinking age in their place of residence. This preview does not offer online purchases or establish product availability in any market.</p></section>
    <section><h2>Before launch</h2><p>The website operator must provide its identity, contact details and approved terms for each intended market. These preview notes do not replace those terms.</p></section>
  </PolicyPage>;
}
