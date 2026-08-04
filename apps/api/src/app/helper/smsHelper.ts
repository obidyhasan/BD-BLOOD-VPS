import config from "../config";

const MIM_SMS_URL = "https://api.mimsms.com/api/SmsSending/SMS";
const MIM_SMS_GET_URL = "https://api.mimsms.com/api/SmsSending/Send";

/** Normalize BD numbers to 8801XXXXXXXXX (no + or spaces). */
export const normalizeBdPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  if (digits.startsWith("1") && digits.length === 10) return `880${digits}`;
  return digits;
};

const isSmsConfigured = () =>
  Boolean(
    config.mimsms.username &&
      config.mimsms.api_key &&
      config.mimsms.sender_name,
  );

const sendViaJson = async (mobileNumber: string, message: string) => {
  const body = {
    UserName: config.mimsms.username,
    Apikey: config.mimsms.api_key,
    MobileNumber: mobileNumber,
    SenderName: config.mimsms.sender_name,
    TransactionType: config.mimsms.transaction_type || "T",
    Message: message,
  };

  const res = await fetch(MIM_SMS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = { raw: text };
  }

  const success =
    res.ok &&
    (json.status === "Success" ||
      json.Status === "Success" ||
      json.responseCode === "200" ||
      json.ResponseCode === "200" ||
      String(json.statusCode ?? "") === "200");

  return { success, response: json, status: res.status };
};

const sendViaGet = async (mobileNumber: string, message: string) => {
  const params = new URLSearchParams({
    UserName: config.mimsms.username!,
    Apikey: config.mimsms.api_key!,
    MobileNumber: mobileNumber,
    SenderName: config.mimsms.sender_name!,
    TransactionType: config.mimsms.transaction_type || "T",
    Message: message,
  });

  const res = await fetch(`${MIM_SMS_GET_URL}?${params.toString()}`);
  const text = await res.text();
  return { success: res.ok, response: { raw: text }, status: res.status };
};

const sendSMS = async (to: string, message: string) => {
  const mobileNumber = normalizeBdPhone(to);
  const maskedPhone =
    mobileNumber.length > 4
      ? `${"*".repeat(mobileNumber.length - 4)}${mobileNumber.slice(-4)}`
      : "***";

  if (!isSmsConfigured()) {
    console.log(`[SMS:DEV] ${maskedPhone}: ${message.slice(0, 120)}`);
    return { success: true, message: "SMS sent (development simulation)." };
  }

  try {
    let result = await sendViaJson(mobileNumber, message);
    if (!result.success) {
      result = await sendViaGet(mobileNumber, message);
    }

    if (!result.success) {
      console.error("[SMS:MiM] Failed:", result.response);
      return { success: false, message: "Failed to send SMS via MiM SMS." };
    }

    return { success: true, message: "SMS sent successfully." };
  } catch (error) {
    console.error("[SMS:MiM] Error:", error);
    return { success: false, message: "SMS gateway error." };
  }
};

const sendOtpSms = async (phone: string, otp: string) => {
  const message = `Your BD Blood verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;
  return sendSMS(phone, message);
};

const sendBloodRequestAlertSms = async (
  phone: string,
  payload: { requesterName: string; bloodGroup: string; hospitalName: string },
) => {
  const message = `BD Blood Alert: ${payload.bloodGroup} needed at ${payload.hospitalName} for ${payload.requesterName}. Log in to respond.`;
  return sendSMS(phone, message);
};

const sendDonorBloodRequestAlertSms = async (
  phone: string,
  payload: {
    bloodGroup: string;
    hospitalName: string;
    upazilaName?: string;
  },
) => {
  const location = payload.upazilaName
    ? `${payload.upazilaName}`
    : payload.hospitalName;
  const message = `BD Blood Urgent: ${payload.bloodGroup} needed near ${location} at ${payload.hospitalName}. If you can donate, open BD Blood app.`;
  return sendSMS(phone, message);
};

export const smsHelper = {
  sendSMS,
  sendOtpSms,
  sendBloodRequestAlertSms,
  sendDonorBloodRequestAlertSms,
  normalizeBdPhone,
};
