/* eslint-disable @typescript-eslint/no-explicit-any */
import dns from "node:dns";
import ejs from "ejs";
import status from "http-status";
import nodemailer from "nodemailer";
import path from "path";
import { envVars } from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";

// Explicitly configure DNS resolution to prefer IPv4 addresses over IPv6
dns.setDefaultResultOrder("ipv4first");

let transporter: nodemailer.Transporter | null = null;
if (envVars.EMAIL_PROVIDER === "smtp") {
    transporter = nodemailer.createTransport({
        host: envVars.EMAIL_SENDER.SMTP_HOST,
        secure: true,
        auth: {
            user: envVars.EMAIL_SENDER.SMTP_USER,
            pass: envVars.EMAIL_SENDER.SMTP_PASS,
        },
        port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
        tls: {
            servername: envVars.EMAIL_SENDER.SMTP_HOST,
        },
    });
}

interface SendEmailOptions {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
}

const sendEmailViaSmtp = async ({
    to,
    subject,
    html,
    attachments,
}: {
    to: string;
    subject: string;
    html: string;
    attachments?: SendEmailOptions["attachments"];
}) => {
    if (!transporter) {
        throw new Error("SMTP transporter is not initialized");
    }

    const info = await transporter.sendMail({
        from: envVars.EMAIL_SENDER.SMTP_FROM,
        to: to,
        subject: subject,
        html: html,
        attachments: attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: attachment.content,
            ...(attachment.contentType && { contentType: attachment.contentType }),
        })),
    });

    console.log(`Email sent to ${to} : ${info.messageId}`);
};

const sendEmailViaBrevo = async ({
    to,
    subject,
    html,
    attachments,
}: {
    to: string;
    subject: string;
    html: string;
    attachments?: SendEmailOptions["attachments"];
}) => {
    const payload: Record<string, any> = {
        sender: {
            name: "WMS",
            email: envVars.EMAIL_SENDER.EMAIL_FROM || envVars.EMAIL_SENDER.SMTP_FROM,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
    };

    if (attachments && attachments.length > 0) {
        payload.attachment = attachments.map((attachment) => ({
            name: attachment.filename,
            content: Buffer.isBuffer(attachment.content)
                ? attachment.content.toString("base64")
                : Buffer.from(attachment.content).toString("base64"),
        }));
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": envVars.BREVO_API_KEY!,
            "content-type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            if (errorData?.message) {
                errorMessage = errorData.message;
            }
        } catch {
            // Not a JSON response
        }
        throw new Error(`Brevo API error: ${errorMessage}`);
    }

    const data = await response.json().catch(() => ({}));
    console.log(`Email sent to ${to} via Brevo : ${data?.messageId || "success"}`);
};

export const sendEmail = async ({
    subject,
    templateData,
    templateName,
    to,
    attachments,
}: SendEmailOptions) => {
    try {
        const templatePath = path.resolve(
            process.cwd(),
            `src/app/templates/${templateName}.ejs`,
        );

        const html = await ejs.renderFile(templatePath, templateData);

        if (envVars.EMAIL_PROVIDER === "brevo") {
            await sendEmailViaBrevo({ to, subject, html, attachments });
        } else {
            await sendEmailViaSmtp({ to, subject, html, attachments });
        }
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }
        console.log("Email Sending Error", error.message);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
    }
};
