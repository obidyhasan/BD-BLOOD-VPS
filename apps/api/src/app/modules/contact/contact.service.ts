import { ContactMessageStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";

const createContactMessage = async (payload: {
  name: string;
  email: string;
  message: string;
}) => {
  return prisma.contactMessage.create({
    data: {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      message: payload.message.trim(),
    },
  });
};

const getRecentContactMessages = async (limit = 20) => {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 50),
  });
};

const updateContactMessageStatus = async (
  id: string,
  status: ContactMessageStatus,
) => {
  return prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
};

export const ContactService = {
  createContactMessage,
  getRecentContactMessages,
  updateContactMessageStatus,
};
