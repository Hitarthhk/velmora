import { PolicyPage } from "@/components/PolicyPage";
export const metadata = { title: "Responsible Drinking" };
export default function Responsibility() {
  return <PolicyPage title="Enjoy responsibly">
    <section><h2>For adults of legal drinking age</h2><p>Follow the drinking-age requirements and alcohol restrictions where you live. Do not share alcohol marketing content with anyone under the legal drinking age.</p></section>
    <section><h2>Never drink and drive</h2><p>Do not drive or operate machinery after drinking. Choosing not to drink is always welcome.</p></section>
    <section><h2>Final brand guidance</h2><p>The brand’s approved responsibility statement and market-specific support resources must be supplied before public launch.</p></section>
  </PolicyPage>;
}
