/**
 * Generates a random numeric OTP of specified length
 * @param length Length of the OTP
 * @returns Random numeric OTP
 */
export const generateOTP = (length = 6): string => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

/**
 * Calculates OTP expiration time (default: 10 minutes from now)
 * @param expiryMinutes Minutes until OTP expires
 * @returns Date object representing expiration time
 */
export const calculateOTPExpiry = (expiryMinutes = 10): Date => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
  return expiryTime;
};
