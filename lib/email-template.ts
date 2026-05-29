type EmailCta = {
  label: string
  url: string
}

type EmailDetail = {
  label: string
  value: string
}

type BrandedEmailOptions = {
  preheader: string
  eyebrow?: string
  title: string
  intro: string
  paragraphs?: string[]
  details?: EmailDetail[]
  cta?: EmailCta
  secondaryCta?: EmailCta
  footerNote?: string
}

const isLocalUrl = (value: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value)

const brandUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

  if (configuredUrl && !(process.env.NODE_ENV === "production" && isLocalUrl(configuredUrl))) {
    return configuredUrl.replace(/\/$/, "")
  }

  if (process.env.NODE_ENV === "production") {
    return "https://www.littlelegendsstory.com"
  }

  return "http://localhost:3003"
}

export const plainEmailSignature = () =>
  [
    ``,
    `Warm wishes,`,
    `Little Legends Story`,
    `Personalised magical storybooks made for little heroes.`,
    brandUrl(),
  ].join("\n")

export const withPlainEmailSignature = (text: string) => `${text.trimEnd()}${plainEmailSignature()}`

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const renderParagraph = (paragraph: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#312e81;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`

const renderButton = (cta: EmailCta, tone: "primary" | "secondary" = "primary") => {
  const background = tone === "primary" ? "#ec4899" : "#fff7ed"
  const border = tone === "primary" ? "#f9a8d4" : "#facc15"
  const color = tone === "primary" ? "#ffffff" : "#4c1d95"

  return `
    <a href="${escapeHtml(cta.url)}" style="display:inline-block;border:2px solid ${border};border-radius:999px;background:${background};color:${color};font-size:15px;font-weight:900;line-height:1.2;text-decoration:none;padding:14px 22px;">
      ${escapeHtml(cta.label)}
    </a>
  `
}

export const renderBrandedEmail = ({
  preheader,
  eyebrow = "Little Legends Story",
  title,
  intro,
  paragraphs = [],
  details = [],
  cta,
  secondaryCta,
  footerNote,
}: BrandedEmailOptions) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5eefb;font-family:Georgia,'Times New Roman',Arial,sans-serif;color:#130820;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5eefb;margin:0;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf8;border:1px solid #ead7ff;border-radius:26px;overflow:hidden;">
            <tr>
              <td style="background:#08031b;background-image:linear-gradient(135deg,#08031b 0%,#261052 58%,#4c123e 100%);padding:26px 24px 24px;text-align:left;">
                <div style="font-size:12px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#f8d66d;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(eyebrow)}</div>
                <div style="margin-top:8px;font-size:30px;font-weight:900;line-height:1.08;color:#ffffff;">${escapeHtml(title)}</div>
                <div style="margin-top:12px;font-size:15px;line-height:1.6;color:#fce7f3;font-family:Arial,Helvetica,sans-serif;">Personalised magical storybooks for bedtime moments worth keeping.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 20px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #f9c8e3;border-radius:20px;">
                  <tr>
                    <td style="padding:22px 20px 8px;">
                      <p style="margin:0 0 18px;font-size:18px;line-height:1.65;color:#130820;font-weight:700;">${escapeHtml(intro).replace(/\n/g, "<br>")}</p>
                      ${paragraphs.map(renderParagraph).join("")}
                    </td>
                  </tr>
                </table>
                ${
                  details.length
                    ? `
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border-collapse:separate;border-spacing:0 8px;">
                        ${details
                          .map(
                            (detail) => `
                              <tr>
                                <td style="width:38%;padding:11px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px 0 0 14px;font-size:12px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#9a3412;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(detail.label)}</td>
                                <td style="padding:11px 12px;background:#ffffff;border:1px solid #fed7aa;border-left:0;border-radius:0 14px 14px 0;font-size:14px;font-weight:700;color:#1e1b4b;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(detail.value)}</td>
                              </tr>
                            `,
                          )
                          .join("")}
                      </table>
                    `
                    : ""
                }
                ${
                  cta || secondaryCta
                    ? `
                      <div style="margin:22px 0 20px;text-align:left;">
                        ${cta ? renderButton(cta) : ""}
                        ${secondaryCta ? `<span style="display:inline-block;width:8px;"></span>${renderButton(secondaryCta, "secondary")}` : ""}
                      </div>
                    `
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:10px 20px 22px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#08031b;border:2px solid #1e1b4b;border-radius:18px;overflow:hidden;">
                  <tr>
                    <td style="padding:18px 18px 0;">
                      <div style="font-size:11px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:#f8d66d;font-family:Arial,Helvetica,sans-serif;">Little Legends Story</div>
                      <div style="margin-top:8px;font-size:22px;font-weight:900;line-height:1.15;color:#ffffff;">The Little Legends Story Team</div>
                      <div style="margin-top:8px;font-size:14px;line-height:1.6;color:#fce7f3;font-family:Arial,Helvetica,sans-serif;">Creating magical stories, made just for your child.</div>
                      <div style="margin-top:14px;font-size:13px;line-height:1.8;color:#e0f2fe;font-family:Arial,Helvetica,sans-serif;">
                        <a href="mailto:hello@littlelegendsstory.com" style="color:#e0f2fe;text-decoration:none;">hello@littlelegendsstory.com</a><br>
                        <a href="${escapeHtml(brandUrl())}" style="color:#f8d66d;text-decoration:none;">littlelegendsstory.com</a>
                      </div>
                      <div style="margin-top:14px;border-top:1px solid #51436e;padding-top:12px;font-size:15px;font-weight:900;line-height:1.5;color:#ffffff;">Turning your child into <span style="color:#f8d66d;">the hero</span> of their very own story.</div>
                      ${
                        footerNote
                          ? `<div style="padding:12px 0 14px;font-size:12px;line-height:1.5;color:#cbd5e1;">${escapeHtml(footerNote)}</div>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
