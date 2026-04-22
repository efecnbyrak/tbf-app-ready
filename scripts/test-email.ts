import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testEmail() {
    console.log("--- SMTP Test Script ---");
    console.log("Host:", process.env.SMTP_HOST);
    console.log("Port:", process.env.SMTP_PORT);
    console.log("User:", process.env.SMTP_USER);
    console.log("Pass:", process.env.SMTP_PASS ? "**** (set)" : "(not set)");
    console.log("From:", process.env.SMTP_FROM);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error("ERROR: SMTP_USER or SMTP_PASS not found in .env");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("Connection verified successfully!");

        console.log("Sending test email to status check address...");
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.SMTP_USER,
            subject: "BKS SMTP Test",
            text: "SMTP test successful.",
            html: "<b>SMTP test successful.</b>",
        });

        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error("FAILED to send email:");
        console.error(error);
    }
}

testEmail();
