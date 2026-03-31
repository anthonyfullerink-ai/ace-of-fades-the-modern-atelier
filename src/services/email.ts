import emailjs from '@emailjs/browser';

// These should be replaced with actual credentials from EmailJS dashboard
const SERVICE_ID = 'service_jmruj1v';
const TEMPLATE_ID = 'template_a030qzj';
const PUBLIC_KEY = 'Hj4EepXnjISc0sQh-';

export interface EmailParams {
  to_email: string;
  to_name: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  price: string;
  barber_name: string;
}

export const sendBookingConfirmation = async (params: EmailParams) => {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        ...params,
        reply_to: 'aceoffades@example.com',
      },
      PUBLIC_KEY
    );
    console.log('Email sent successfully:', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
