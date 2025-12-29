import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      subject,
      message,
    }: {
      name: string;
      email: string;
      phone?: string;
      subject?: string;
      message: string;
    } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }

    // 1) Save to database
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || null,
        message,
      },
    });

    // 2) Send email to organisation
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.warn(
        "SMTP env vars are not fully set. Skipping email sending for contact form."
      );
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true", // usually false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const orgEmail =
        process.env.ORG_CONTACT_EMAIL || "info@bhaktasammilan.org";

      const emailSubject =
        subject && subject.trim().length > 0
          ? `[Bhakta Sammilan Contact] ${subject}`
          : `[Bhakta Sammilan Contact] New query from ${name}`;

      const plainText = `
New contact query from Bhakta Sammilan website

Name:    ${name}
Email:   ${email}
Phone:   ${phone || "-"}

Subject: ${subject || "-"}

Message:
${message}
`.trim();

      const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
          <h2 style="margin-bottom: 12px; color: #111827;">New contact query from Bhakta Sammilan website</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "-"}</p>
          <p><strong>Subject:</strong> ${subject || "-"}</p>
          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="white-space: pre-wrap;"><strong>Message:</strong><br />${message}</p>
          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">
            This message was sent from the Bhakta Sammilan contact form.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from:
          process.env.SMTP_FROM_EMAIL ||
          `Bhakta Sammilan <${process.env.SMTP_USER}>`,
        to: orgEmail,
        replyTo: email,
        subject: emailSubject,
        text: plainText,
        html,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling contact form:", error);
    return NextResponse.json(
      { error: "Something went wrong while submitting your query." },
      { status: 500 }
    );
  }
}
