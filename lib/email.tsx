import nodemailer from "nodemailer"

// Configure your email service here
// For Gmail: https://myaccount.google.com/apppasswords
// For other services, use your SMTP credentials

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "dwikysetiawan61@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "xtqz bztz tmlr xesv",  
  },
})
// xtqz bztz tmlr xesv
export async function sendNotificationEmail(
  adminEmail: string,
  adminName: string,
  ticketTitle: string,
  userName: string,
  userDivision: string,
  ticketId: number,
) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `Tiket Baru: ${ticketTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Tiket Baru Masuk</h2>
          <p>Halo <strong>${adminName}</strong>,</p>
          <p>Ada tiket baru yang masuk di sistem Helpdesk Anda.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>ID Tiket:</strong> #${ticketId}</p>
            <p><strong>Judul:</strong> ${ticketTitle}</p>
            <p><strong>Dari:</strong> ${userName}</p>
            <p><strong>Divisi:</strong> ${userDivision}</p>
            <p><strong>Tanggal:</strong> ${new Date().toLocaleString("id-ID")}</p>
          </div>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/dashboard" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Lihat Tiket
            </a>
          </p>
          
          <p>Terima kasih,<br/>Tim Helpdesk</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`[v0] Email notification sent to ${adminEmail}`)
  } catch (error) {
    console.error("[v0] Error sending email:", error)
  }
}
