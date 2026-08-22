import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { dash } from "@better-auth/infra";
import pg from "pg";
const { Pool } = pg;

import nodemailer from "nodemailer";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim().replace(/\/$/, "")) 
  : [];

const trustedOrigins = ["http://localhost:3000", "http://localhost:3001", ...allowedOrigins];
console.log("Better Auth: Configured Trusted Origins ->", trustedOrigins);

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[PASSWORD RESET REQUEST] for ${user.email}. Link: ${url}`);
      
      if (process.env.SMTP_HOST) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });
          
          const mailOptions = {
            from: process.env.SMTP_FROM || `"Physical AI Textbook" <noreply@yourdomain.com>`,
            to: user.email,
            subject: "Reset Your Password - Physical AI Textbook",
            html: `
              <h2>Password Reset Request</h2>
              <p>Hello ${user.name || "Student"},</p>
              <p>We received a request to reset the password for your Physical AI & Humanoid Robotics Textbook account.</p>
              <p>Click the link below to set a new password. This link is valid for 1 hour:</p>
              <a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
              <br/><br/>
              <p>If you didn't request this, you can safely ignore this email.</p>
            `
          };
          
          await transporter.sendMail(mailOptions);
          console.log(`Reset email sent successfully to ${user.email}`);
        } catch (mailError) {
          console.error(`Failed to send password reset email to ${user.email}:`, mailError);
        }
      }
    }
  },
  trustedOrigins: trustedOrigins,
  advanced: {
    useSecureCookies: true,
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        attributes: {
          sameSite: "None",
          secure: true,
        }
      }
    }
  },
  user: {
    additionalFields: {
      softwareBg: {
        type: "string",
        required: false,
      },
      hardwareBg: {
        type: "string",
        required: false,
      }
    }
  },
  plugins: [
    dash(),
    admin(),
  ]
});
