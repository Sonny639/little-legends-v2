import nodemailer from "nodemailer"

import { renderBrandedEmail, withPlainEmailSignature } from "@/lib/email-template"

type ContactEmailInput = {
  name: string
  email: string
  orderReference?: string
  subject: string
  message: string
}

const smtpPort = () => Number(process.env.SMTP_PORT || 587)

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

export const sendContactEmail = async ({ name, email, orderReference, subject, message }: ContactEmailInput) => {
  if (!hasSmtpConfig()) {
    return { sent: false, reason: "SMTP is not configured" }
  }

  const port = smtpPort()
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "hello@littlelegendsstory.com"
  const fromName = process.env.SMTP_FROM_NAME || "Little Legends Story"
  const toEmail = process.env.CONTACT_TO_EMAIL || "hello@littlelegendsstory.com"

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    replyTo: email,
    subject: `Little Legends contact: ${subject}`,
    text: withPlainEmailSignature([
      `New Little Legends contact enquiry`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      ...(orderReference ? [`Order/reference number: ${orderReference}`] : []),
      `Subject: ${subject}`,
      ``,
      message,
    ].join("\n")),
    html: renderBrandedEmail({
      preheader: `New contact enquiry from ${name}.`,
      title: "New contact enquiry",
      intro: `${name} has sent a message through the Little Legends contact form.`,
      paragraphs: [message],
      details: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        ...(orderReference ? [{ label: "Reference", value: orderReference }] : []),
        { label: "Subject", value: subject },
      ],
      footerNote: "This notification was sent from the Little Legends Story contact form.",
    }),
  })

  return { sent: true, to: toEmail }
}
