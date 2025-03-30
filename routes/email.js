const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or another service like 'outlook', 'yahoo', etc.
    auth: {
      user: 'mahatourismteam@gmail.com',
      pass: 'rbyw izcu uvuq hupj'
    }
  });
  // API endpoint to send confirmation email
  router.post('/send-confirmation-email', async (req, res) => {
    try {
      const { to, name, bookingId, packageName, travelDate, totalPrice } = req.body;
      
      if (!to || !name || !bookingId || !packageName || !travelDate || !totalPrice) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for email' 
        });
      }
      
      // Email content
      const mailOptions = {
        from: 'mahatourismteam@gmail.com',
        to: to,
        subject: `Booking Confirmation - ${bookingId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #FF5722;">Booking Confirmation</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
              <p style="margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
              
              <p>Thank you for booking with us! Your travel package has been confirmed. Below are your booking details:</p>
              
              <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 5px; border-left: 4px solid #FF5722;">
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Package:</strong> ${packageName}</p>
                <p><strong>Travel Date:</strong> ${travelDate}</p>
                <p><strong>Total Amount:</strong> ₹${totalPrice}</p>
              </div>
              
              <p>You can view your complete booking details by logging into your account on our website or mobile app.</p>
              
              <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our customer support team at <a href="mailto:support@yourtravelcompany.com" style="color: #FF5722;">mahatourismteam@gmail.co</a> or call us at +1-234-567-8900.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Your Travel Company. All rights reserved.</p>
            </div>
          </div>
        `
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      
      res.status(200).json({ 
        success: true, 
        message: 'Confirmation email sent successfully' 
      });
      
    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send confirmation email',
        error: error.message 
      });
    }
  });
  module.exports = router;