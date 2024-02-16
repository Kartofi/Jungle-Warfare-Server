const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.smtpHost,
  port: process.env.smtpPort,
  secure: process.env.smtpSecure,
  auth: {
    user: process.env.authUser,
    pass: process.env.authPass,
  },
  tls: { rejectUnauthorized: false },
});
console.log("Connected to SMTP server");
async function SendEmail(to, message) {
  console.log("Sending email to " + to);
  try {
    const info = await transporter.sendMail({
      from: '"Jungle Warfare 🐵" <junglewarfare@abv.bg>',
      to: to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    console.log("Message sent to " + to + ": %s", info.messageId);
  } catch (e) {
    console.log("Error when sending email to " + to);
  }
}
module.exports = {
  SendEmail,
};
