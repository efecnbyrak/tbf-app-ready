import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendVerificationEmail(to: string, code: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not set. Email simulation:");
        console.log(`To: ${to}, Code: ${code}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"TBF Hakem Sistemi" <noreply@tbf.org.tr>',
            to,
            subject: 'TBF Hakem Sistemi - Doğrulama Kodu',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #c00;">TBF Hakem Sistemi</h2>
                    <p>Giriş yapmak için doğrulama kodunuz:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${code}</h1>
                    <p>Bu kod 5 dakika süreyle geçerlidir.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Bu e-postayı siz istemediyseniz lütfen dikkate almayınız.</p>
                </div>
            `,
        });
        console.log(`Verification email sent to ${to}`);
    } catch (error) {
        console.error("Error sending email:", error);
        // Fallback or re-throw depending on requirements. 
        // For now, log and allow login flow to proceed (user might be blocked if strict)
        // Ideally should throw to inform user email failed.
        throw new Error("E-posta gönderilemedi.");

    }
}
