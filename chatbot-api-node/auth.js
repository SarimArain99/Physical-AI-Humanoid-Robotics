import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { dash } from "@better-auth/infra";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim()) 
  : [];

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001", ...allowedOrigins],
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
