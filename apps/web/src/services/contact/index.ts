"use server";

import { serverFetch } from "@/helper/server-fetch";

export const submitContactMessage = async (data: {
  name: string;
  email: string;
  message: string;
}) => {
  try {
    const res = await serverFetch.post("/contact", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
