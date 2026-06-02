import nodemailer from "nodemailer"

import { renderBrandedEmail, withPlainEmailSignature } from "@/lib/email-template"

type GallerySubmissionAttachment = {
  filename: string
  contentType: string
  content: Buffer
}

type GallerySubmissionEmailInput = {
  name: string
  email: string
  orderReference?: string
  review: string
  permissionNote: string
  attachments: GallerySubmissionAttachment[]
}

const smtpPort = () => Number(process.env.SMTP_PORT || 587)

const hasSmtpConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

export const sendGallerySubmissionEmail = async ({
  name,
  email,
  orderReference,
  review,
  permissionNote,
  attachments,
}: GallerySubmissionEmailInput) => {
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
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 12000,
  })

  const attachmentNames = attachments.map((attachment) => attachment.filename).join(", ")

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    replyTo: email,
    subject: `Little Legends gallery submission: ${name}`,
    attachments,
    text: withPlainEmailSignature([
      "New Little Legends gallery submission",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      ...(orderReference ? [`Order/reference number: ${orderReference}`] : []),
      `Photos: ${attachmentNames || "None"}`,
      "",
      "Review:",
      review,
      "",
      "Permission:",
      permissionNote,
    ].join("\n")),
    html: renderBrandedEmail({
      preheader: `New gallery submission from ${name}.`,
      title: "New gallery submission",
      intro: `${name} has submitted photos and a review for the Little Legends gallery.`,
      paragraphs: [review, permissionNote, attachmentNames ? `Attached photos: ${attachmentNames}` : "No photos attached."],
      details: [
        { label: "Name", value: name },
        { label: "Email", value: email },
        ...(orderReference ? [{ label: "Reference", value: orderReference }] : []),
        { label: "Photos", value: String(attachments.length) },
      ],
      footerNote: "Review this submission before publishing any customer photo or wording.",
    }),
  })

  return { sent: true, to: toEmail }
}
