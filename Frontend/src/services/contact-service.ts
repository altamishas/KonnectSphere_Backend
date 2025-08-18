import axiosInstance from "@/lib/axios";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}

export const contactService = {
  // Submit contact form
  submitContactForm: async (
    data: ContactFormData
  ): Promise<ContactFormResponse> => {
    const response = await axiosInstance.post("/contact", data);
    return response.data;
  },
};
