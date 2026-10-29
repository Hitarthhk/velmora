import { PolicyPage } from "@/components/PolicyPage";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return <PolicyPage title="Privacy in this preview">
    <section><h2>Age confirmation on your device</h2><p>The age gate asks for confirmation on every page reload. Confirmation lasts only while the current page remains open and is not saved in browser storage. It does not collect your date of birth or location.</p></section>
    <section><h2>Enquiry form</h2><p>The enquiry form component is available for future use. Without a configured submission service, what you type is not sent anywhere or stored, and the form says so when you submit it. If a submission service is connected before launch, this notice must be updated to describe it.</p></section>
    <section><h2>Current application features</h2><p>The prototype contains no account registration, checkout or application analytics integration.</p></section>
    <section><h2>Hosting and final policy</h2><p>Hosting providers may process request information. The final operator must document its hosting arrangements, data practices, retention periods and privacy contact before launch. Those details have not been supplied for this preview.</p></section>
  </PolicyPage>;
}
