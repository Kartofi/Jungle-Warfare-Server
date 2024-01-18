const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.abv.bg",
  port: 465,
  secure: true,
  auth: {
    user: "junglewarfare@abv.bg",
    pass: "Anatoli7707!",
  },
  tls: { rejectUnauthorized: false },
});

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
