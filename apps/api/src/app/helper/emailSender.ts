import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import config from "../config";

const emailSender = async (
  email: string,
  subject: string,
  templateName: string,
  data: Record<string, any> = {},
) => {
  const port = Number(config.email.smtp_port);
  if (
    !config.email.smtp_host ||
    !Number.isFinite(port) ||
    !config.email.smtp_user ||
    !config.email.smtp_pass ||
    !config.email.smtp_from
  ) {
    throw new Error("SMTP is not fully configured.");
  }

  const transporter = nodemailer.createTransport({
    secure: port === 465,
    auth: {
      user: config.email.smtp_user,
      pass: config.email.smtp_pass,
    },
    port,
    host: config.email.smtp_host,
    tls: {
      rejectUnauthorized: config.node_env === "production",
    },
  });

  const templatePath = path.join(
    __dirname,
    `../views/email/${templateName}.ejs`,
  );
  const html = await ejs.renderFile(templatePath, data);

  await transporter.sendMail({
    from: `${config.email.smtp_from}`,
    to: email,
    subject,
    html,
  });
};

export default emailSender;
