"use client";

import { useId, useState, type FormEvent } from "react";
import { contact } from "@/content/site";
import styles from "./EnquiryForm.module.css";

/** Set at build time once a real submission service exists. */
const ENDPOINT = process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT;

type Field = "name" | "email" | "type" | "message";
type Status = { kind: "idle" | "sending" | "sent" | "error" | "preview"; text?: string };

const validate = (data: Record<Field, string>) => {
  const errors: Partial<Record<Field, string>> = {};
  if (!data.name.trim()) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "Please enter a valid email address.";
  if (!data.type) errors.type = "Please choose an enquiry type.";
  if (data.message.trim().length < 10) errors.message = "Please write a short message (at least 10 characters).";
  return errors;
};

/**
 * Enquiry form. It only claims to send when a submission endpoint is
 * configured and responds successfully; in this preview nothing is sent or
 * stored, and the form says so before and after submitting.
 */
export function EnquiryForm() {
  const id = useId();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<Field, string>;
    const found = validate(data);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (!ENDPOINT) {
      setStatus({ kind: "preview", text: "This preview is not connected to an inbox yet, so your enquiry has not been sent. Nothing you entered has been stored." });
      return;
    }
    setStatus({ kind: "sending", text: "Sending…" });
    try {
      const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error(String(response.status));
      form.reset();
      setStatus({ kind: "sent", text: "Thank you. Your enquiry has been sent." });
    } catch {
      setStatus({ kind: "error", text: "Your enquiry could not be sent. Please try again later." });
    }
  };

  const field = (name: Field) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    onInput: () => errors[name] && setErrors((e) => ({ ...e, [name]: undefined })),
  });
  const error = (name: Field) =>
    errors[name] ? (
      <span id={`${id}-${name}-error`} className={styles.error}>
        {errors[name]}
      </span>
    ) : null;

  return (
    <form className={styles.form} onSubmit={submit} noValidate aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className={`display ${styles.title}`}>
        Make an enquiry
      </h3>
      {!ENDPOINT && (
        <p className={styles.notice}>
          Preview: this form is not yet connected to a submission service. Enquiries are not sent or stored.
        </p>
      )}
      <div className={styles.row}>
        <label className={styles.field} htmlFor={`${id}-name`}>
          <span>Name</span>
          <input type="text" autoComplete="name" {...field("name")} />
          {error("name")}
        </label>
        <label className={styles.field} htmlFor={`${id}-email`}>
          <span>Email</span>
          <input type="email" autoComplete="email" inputMode="email" {...field("email")} />
          {error("email")}
        </label>
      </div>
      <label className={styles.field} htmlFor={`${id}-type`}>
        <span>Enquiry type</span>
        <select defaultValue="" {...field("type")}>
          <option value="" disabled>
            Choose one
          </option>
          {contact.enquiryTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        {error("type")}
      </label>
      <label className={styles.field} htmlFor={`${id}-message`}>
        <span>Message</span>
        <textarea rows={5} {...field("message")} />
        {error("message")}
      </label>
      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={status.kind === "sending"} data-cursor="Send">
          <span>Send enquiry</span>
          <svg viewBox="0 0 24 10" aria-hidden="true">
            <path d="M0 5h22M18 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <p className={styles.status} role="status" aria-live="polite" data-kind={status.kind}>
          {status.text}
        </p>
      </div>
    </form>
  );
}
