const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();
// const bookingRoutes = require('./routes/bookingRoutes');
const app = express();
app.use(bodyParser.json());
app.use(cors());
// app.use('/api', bookingRoutes);
// Global constants
const PORT = process.env.PORT;
const IP_ADDRESS = process.env.IP_ADDRESS;


// Database configuration
const dbConfig = {
  host: 'sql12.freesqldatabase.com',
  user: 'sql12776306',
  password: 'unJvcacTZJ',
  database: 'sql12776306',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool (best practice for production apps)
const pool = mysql.createPool(dbConfig);

// Utility function for executing queries
const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Test database connection at startup
const testDatabaseConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1); // Exit if can't connect to database
  }
};

app.post('/api/bookings', async (req, res) => {
  try {
    // Get the current timestamp for booking_date
    const bookingDate = new Date().toISOString().split('T')[0];
    
    // Extract and sanitize all fields from request body with default values
    const {
      booking_id,
      user_id,
      package_id,
      package_name,
      package_destination = '',  // Provide defaults for optional fields
      package_duration = '',
      customer_name,
      customer_email,
      customer_phone,
      travel_date,
      adults = 1,
      children = 0,
      special_requests = 'None',
      total_price,
      status = 'confirmed',
      payment_status = 'unpaid'
    } = req.body;

    // Validate required fields
    if (!booking_id || !user_id || !package_id || !package_name || !customer_name || 
        !customer_email || !customer_phone || !travel_date || !total_price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required booking information' 
      });
    }

    // Format travel date if it's an ISO string
    let formattedTravelDate;
    try {
      formattedTravelDate = new Date(travel_date).toISOString().split('T')[0];
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid travel date format'
      });
    }

    const query = `
      INSERT INTO bookings (
        booking_id, user_id, package_id, package_name, package_destination, 
        package_duration, customer_name, customer_email, customer_phone,
        travel_date, adults, children, special_requests, total_price,
        booking_date, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ensure all parameters are defined before the query
    const params = [
      booking_id,
      user_id,
      package_id,
      package_name,
      package_destination,
      package_duration,
      customer_name,
      customer_email,
      customer_phone,
      formattedTravelDate,
      adults,
      children,
      special_requests,
      total_price,
      bookingDate,       // Added booking_date parameter
      status,
      payment_status
    ];

    // Log the parameters for debugging
    console.log('Query parameters:', params);
    
    // Check for any undefined values
    const undefinedParams = params.map((p, i) => p === undefined ? i : null).filter(i => i !== null);
    if (undefinedParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Parameters at positions ${undefinedParams.join(', ')} are undefined`
      });
    }

    const [result] = await pool.execute(query, params);

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: result.insertId,
        booking_id
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// Get booking by ID or booking_id
app.get('/api/bookings/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'booking ID is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    // Return just the data array as expected by the frontend
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

app.get('/api/bookings/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE user_id = ?',
      [userId]
    );

    // Return just the data array as expected by the frontend
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

app.get('/api/hotel-bookings/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Join with hotels table to get hotel name
    const query = `
      SELECT 
        hb.id,
        hb.booking_id,
        hb.hotel_id,
        h.name as hotel_name,
        hb.room_type_id,
        rt.name as room_type,
        hb.user_id,
        hb.guest_name,
        hb.guest_email,
        hb.guest_phone,
        hb.check_in_date,
        hb.check_out_date,
        hb.guests_count,
        hb.total_price,
        hb.special_requests,
        hb.payment_method,
        hb.payment_status,
        hb.booking_status as status,
        hb.created_at,
        hb.updated_at
      FROM 
        hotel_bookings hb
      LEFT JOIN 
        hotels h ON hb.hotel_id = h.hotel_id
      LEFT JOIN
        room_types rt ON hb.room_type_id = rt.id
      WHERE 
        hb.user_id = ?
      ORDER BY 
        hb.created_at DESC
    `;
    
    const [bookings] = await pool.query(query, [userId]);
    
    if (bookings.length === 0) {
      return res.status(200).json([]);
    }
    
    // Format dates for consistent output
    const formattedBookings = bookings.map(booking => {
      return {
        ...booking,
        check_in_date: booking.check_in_date ? new Date(booking.check_in_date).toISOString() : null,
        check_out_date: booking.check_out_date ? new Date(booking.check_out_date).toISOString() : null,
        created_at: booking.created_at ? new Date(booking.created_at).toISOString() : null,
        updated_at: booking.updated_at ? new Date(booking.updated_at).toISOString() : null,
        rooms: booking.guests_count > 1 ? Math.ceil(booking.guests_count / 2) : 1, // Calculate rooms based on guests
      };
    });
    
    return res.status(200).json(formattedBookings);
    
  } catch (error) {
    console.error('Error fetching hotel bookings:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch hotel bookings',
      error: error.message 
    });
  }
});

app.get('/api/flight-bookings/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Query flight bookings with detailed information
    const query = `
      SELECT 
        fb.id,
        fb.user_id,
        fb.flight_number,
        fb.airline,
        fb.departure_airport,
        fb.departure_code,
        fb.arrival_airport,
        fb.arrival_code,
        fb.departure_time,
        fb.arrival_time,
        fb.passengers,
        fb.amount,
        fb.booking_date,
        fb.email,
        fb.transaction_id,
        fb.payment_status,
        fb.created_at,
        fb.updated_at
      FROM 
        flight_bookings fb
      WHERE 
        fb.user_id = ?
      ORDER BY 
        fb.booking_date DESC
    `;
    
    const [bookings] = await pool.query(query, [userId]);
    
    if (bookings.length === 0) {
      return res.status(200).json([]);
    }
    
    // Format dates and parse JSON data for consistent output
    const formattedBookings = bookings.map(booking => {
      // Parse passengers JSON data
      let parsedPassengers = [];
      try {
        if (booking.passengers && typeof booking.passengers === 'string') {
          parsedPassengers = JSON.parse(booking.passengers);
        }
      } catch (err) {
        console.error('Error parsing passengers data:', err);
      }
      
      // Calculate passenger count
      const passengerCount = Array.isArray(parsedPassengers) ? parsedPassengers.length : 1;
      
      return {
        ...booking,
        passengers: parsedPassengers,
        departure_time: booking.departure_time ? new Date(booking.departure_time).toISOString() : null,
        arrival_time: booking.arrival_time ? new Date(booking.arrival_time).toISOString() : null,
        booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString() : null,
        created_at: booking.created_at ? new Date(booking.created_at).toISOString() : null,
        updated_at: booking.updated_at ? new Date(booking.updated_at).toISOString() : null,
        // Additional fields for frontend compatibility
        status: booking.payment_status ? booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1) : 'Pending',
        departure_city: booking.departure_airport || 'Unknown',
        arrival_city: booking.arrival_airport || 'Unknown',
        departure_date: booking.departure_time ? new Date(booking.departure_time).toISOString() : null,
        price: booking.amount,
        booking_id: booking.id,
        passenger_count: passengerCount
      };
    });
    
    return res.status(200).json(formattedBookings);
    
  } catch (error) {
    console.error('Error fetching flight bookings:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch flight bookings',
      error: error.message 
    });
  }
});
// Get bookings by customer email
app.get('/api/bookings/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE customer_email = ? ORDER BY created_at DESC',
      [email]
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching bookings by email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    let query = 'UPDATE bookings SET ';
    const queryParams = [];
    
    if (status) {
      query += 'status = ?';
      queryParams.push(status);
      
      if (payment_status) {
        query += ', payment_status = ?';
        queryParams.push(payment_status);
      }
    } else if (payment_status) {
      query += 'payment_status = ?';
      queryParams.push(payment_status);
    } else {
      return res.status(400).json({
        success: false,
        message: 'No update parameters provided'
      });
    }
    
    query += ' WHERE id = ? OR booking_id = ?';
    queryParams.push(id, id);
    
    const [result] = await pool.execute(query, queryParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
});

// Cancel a booking
app.post('/api/bookings/cancel/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM bookings WHERE booking_id = ?',
      [bookingId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mahatourismteam@gmail.com',
    pass: 'lvql maev qgnv gcxy'
  }
});
async function generateFlightTicketPDF(bookingDetails) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fileName = `flight_ticket_${bookingDetails.transactionId}.pdf`;
      const filePath = `${__dirname}/../temp/${fileName}`;
      
      // Ensure temp directory exists
      if (!fs.existsSync(`${__dirname}/../temp`)) {
        fs.mkdirSync(`${__dirname}/../temp`);
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add content to PDF
      doc.fontSize(20).text('Flight Booking Confirmation', { align: 'center' });
      doc.moveDown();
      
      // Flight details
      doc.fontSize(14).text(`Flight: ${bookingDetails.flightNumber}`, { continued: true })
         .text(`Airline: ${bookingDetails.airline}`, { align: 'right' });
      
      doc.moveDown();
      doc.text(`From: ${bookingDetails.departure}`, { continued: true })
         .text(`To: ${bookingDetails.arrival}`, { align: 'right' });
      
      doc.moveDown();
      doc.text(`Date: ${bookingDetails.date}`, { continued: true })
         .text(`Passengers: ${bookingDetails.passengers.length}`, { align: 'right' });
      
      doc.moveDown(2);
      doc.fontSize(16).text('Passenger Details', { underline: true });
      bookingDetails.passengers.forEach((passenger, index) => {
        doc.moveDown();
        doc.text(`${index + 1}. ${passenger.name} (${passenger.type})`);
      });

      doc.moveDown(2);
      doc.fontSize(16).text('Payment Details', { underline: true });
      doc.moveDown();
      doc.text(`Amount: ₹${bookingDetails.amount.toLocaleString('en-IN')}`);
      doc.text(`Transaction ID: ${bookingDetails.transactionId}`);
      doc.text(`Status: ${bookingDetails.status || 'Confirmed'}`);

      doc.moveDown(2);
      doc.fontSize(12).text('Thank you for booking with us!', { align: 'center' });
      doc.text('For any queries, contact support@mahatourism.com', { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

app.post('/api/send-confirmation-email', async (req, res) => {
  try {
    const { to, name, bookingId, packageName, travelDate, totalPrice } = req.body;
    
    if (!to || !name || !bookingId || !packageName || !travelDate || !totalPrice) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields for email' 
      });
    }
    
    const mailOptions = {
      from: 'mahatourismteam@gmail.com',
      to: to,
      subject: `Booking Confirmation - ${bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #FF5722;">Package Booking Confirmation</h1>
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
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact our customer support team at <a href="mailto:mahatourismteam@gmail.com" style="color: #FF5722;">mahatourismteam@gmail.com</a></p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      success: true, 
      message: 'Package confirmation email sent successfully' 
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

// New flight ticket endpoint
app.post('/api/send-flight-ticket', async (req, res) => {
  try {
    const { email, bookingDetails } = req.body;

    if (!email || !bookingDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and booking details are required' 
      });
    }

    // Generate PDF
    const pdfPath = await generateFlightTicketPDF(bookingDetails);

    // Send email
    const mailOptions = {
      from: 'mahatourismteam@gmail.com',
      to: email,
      subject: `Your Flight Ticket - ${bookingDetails.flightNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #FF5722;">Flight Booking Confirmation</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <p>Dear Customer,</p>
            
            <p>Thank you for booking with us. Here are your flight details:</p>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 5px; border-left: 4px solid #FF5722;">
              <p><strong>Flight:</strong> ${bookingDetails.flightNumber}</p>
              <p><strong>Airline:</strong> ${bookingDetails.airline}</p>
              <p><strong>From:</strong> ${bookingDetails.departure}</p>
              <p><strong>To:</strong> ${bookingDetails.arrival}</p>
              <p><strong>Date:</strong> ${bookingDetails.date}</p>
              <p><strong>Passengers:</strong> ${bookingDetails.passengers.length}</p>
              <p><strong>Amount Paid:</strong> ₹${bookingDetails.amount.toLocaleString('en-IN')}</p>
            </div>
            
            <p>Your ticket is attached to this email. Please present it at the airport.</p>
            
            <p style="margin-top: 30px;">For any queries, contact <a href="mailto:mahatourismteam@gmail.com" style="color: #FF5722;">mahatourismteam@gmail.com</a></p>
          </div>
        </div>
      `,
      attachments: [{
        filename: `flight_ticket_${bookingDetails.transactionId}.pdf`,
        path: pdfPath
      }]
    };

    await transporter.sendMail(mailOptions);

    // Clean up
    fs.unlinkSync(pdfPath);

    res.status(200).json({ 
      success: true, 
      message: 'Flight ticket sent successfully' 
    });

  } catch (error) {
    console.error('Error sending flight ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send flight ticket',
      error: error.message 
    });
  }
});


// USER AUTHENTICATION ROUTES
app.post('/api/login', async (req, res) => {
  const { mobileNumber, password } = req.body;
  console.log('Login attempt with data:', { mobileNumber, password });

  if (!mobileNumber || !password) {
    return res.status(400).json({
      error: 'Mobile number and password are required',
      fields: {
        mobileNumber: !mobileNumber ? 'Mobile number is missing' : null,
        password: !password ? 'Password is missing' : null
      }
    });
  }

  const cleanMobileNumber = mobileNumber.replace(/[^0-9]/g, '');
  
  if (!/^[0-9]{10}$/.test(cleanMobileNumber)) {
    return res.status(400).json({ 
      error: 'Invalid mobile number format. Please provide a 10-digit mobile number.' 
    });
  }

  try {
    const users = await executeQuery('SELECT * FROM users WHERE phone_number = ?', [cleanMobileNumber]);

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'No account found with this mobile number',
        suggestion: 'Please register or check the number entered'
      });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Incorrect password',
        suggestion: 'Double-check your password or use forgot password option'
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        mobileNumber: user.phone_number,
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login process error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login',
      details: error.message 
    });
  }
});

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'First name, email, and password are required.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await executeQuery(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone_number)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, passwordHash, phoneNumber]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      firstName, 
      lastName, 
      email, 
      phoneNumber 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// // NOTIFICATION ROUTES
// app.post('/api/flight-send-confirmation-email', (req, res) => {
//   const { email, bookingDetails } = req.body;

//   sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

//   const msg = {
//     to: email,
//     from: 'siddhivianayaksawant04@gmail.com',
//     subject: 'Booking Confirmation',
//     text: `Your booking was successful! Details: ${JSON.stringify(bookingDetails)}`
//   };

//   sgMail.send(msg)
//     .then(() => {
//       res.status(200).json({ message: 'Confirmation email sent!' });
//     })
//     .catch((error) => {
//       console.error('Error sending email:', error);
//       res.status(500).json({ 
//         message: 'Failed to send confirmation email', 
//         error: error.message 
//       });
//     });
// });

// app.post('/api/send-confirmation-code', async (req, res) => {
//   const { contact } = req.body;

//   try {
//     const users = await executeQuery('SELECT * FROM users WHERE phone_number = ?', [contact]);
    
//     if (users.length === 0) {
//       return res.status(404).json({ message: 'Account does not exist' });
//     }

//     const confirmationCode = Math.floor(100000 + Math.random() * 900000);
//     const expirationTime = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now

//     await executeQuery(
//       'INSERT INTO confirmation_codes (contact, code, expires_at) VALUES (?, ?, ?)', 
//       [contact, confirmationCode, expirationTime]
//     );

//     // Send the confirmation code via SMS
//     const client = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');
    
//     await client.messages.create({
//       body: `Your confirmation code is: ${confirmationCode}`,
//       to: contact,
//       from: 'YOUR_TWILIO_PHONE_NUMBER'
//     });
    
//     res.status(200).json({ message: 'Confirmation code sent!' });
//   } catch (error) {
//     console.error('Error sending confirmation code:', error);
//     res.status(500).json({ 
//       message: 'Failed to send confirmation code', 
//       error: error.message 
//     });
//   }
// });

// HOTEL ROUTES
// Get all hotels 
app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await executeQuery('SELECT * FROM hotels ORDER BY name');
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// Get featured hotels (top rated or most popular)
app.get('/api/hotels/featured', async (req, res) => {
  try {
    // Fetching top 5 hotels by rating
    const hotels = await executeQuery('SELECT * FROM hotels ORDER BY rating DESC LIMIT 5');
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({ error: 'Failed to fetch featured hotels' });
  }
});

// Search hotels by various criteria
app.get('/api/hotels/search', async (req, res) => {
  try {
    const { location, minRating, maxPrice, name } = req.query;
    
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];
    
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    
    if (minRating) {
      query += ' AND rating >= ?';
      params.push(parseFloat(minRating));
    }
    
    if (maxPrice) {
      // Assuming price_range has a format like "$100-$200"
      // This is a simplified approach - a more robust solution would depend on your price_range format
      query += ' AND price_range LIKE ?';
      params.push(`%${maxPrice}%`);
    }
    
    const hotels = await executeQuery(query, params);
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.status(500).json({ error: 'Failed to search hotels' });
  }
});

// API endpoint to create a new booking
app.post('/api/hotel-bookings', async (req, res) => {
  try {
    const { 
      booking_id,
      hotel_id, 
      room_type_id, 
      user_id,
      guest_name, 
      guest_email, 
      guest_phone, 
      check_in_date, 
      check_out_date, 
      guests_count, 
      total_price,
      special_requests ,
      payment_method
    } = req.body;
    
    // Validate required fields
    if (!booking_id || !hotel_id || !room_type_id || !user_id || !guest_name || !guest_email || 
        !check_in_date || !check_out_date || !guests_count || !total_price || !payment_method) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }
    
    // Insert the booking into database
    const result = await executeQuery(
      `INSERT INTO hotel_bookings 
       (booking_id, hotel_id, room_type_id,user_id, guest_name, guest_email, guest_phone, 
        check_in_date, check_out_date, guests_count, total_price, special_requests,payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [booking_id, hotel_id, room_type_id,user_id, guest_name, guest_email, guest_phone, 
       check_in_date, check_out_date, guests_count, total_price, special_requests, payment_method || null]
    );
    
    res.status(201).json({ 
      booking_id: result.insertId,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});
  
// Get hotel by ID
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const hotels = await executeQuery('SELECT * FROM hotels WHERE hotel_id = ?', [hotelId]);
    
    if (hotels.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    
    res.status(200).json(hotels[0]);
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    res.status(500).json({ error: 'Failed to fetch hotel details' });
  }
});


// API endpoint to get hotel amenities by hotel ID
app.get('/api/hotels/:id/amenities', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const amenities = await executeQuery(
      'SELECT * FROM hotel_amenities WHERE hotel_id = ?',
      [hotelId]
    );
    
    res.status(200).json(amenities);
  } catch (error) {
    console.error('Error fetching hotel amenities:', error);
    res.status(500).json({ error: 'Failed to fetch hotel amenities' });
  }
});

// API endpoint to get room types by hotel ID
app.get('/api/hotels/:id/room-types', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const roomTypes = await executeQuery(
      'SELECT * FROM room_types WHERE hotel_id = ?',
      [hotelId]
    );
    
    res.status(200).json(roomTypes);
  } catch (error) {
    console.error('Error fetching room types:', error);
    res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

// API endpoint to get hotel reviews by hotel ID
app.get('/api/hotels/:id/reviews', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const reviews = await executeQuery(
      'SELECT * FROM reviews WHERE hotel_id = ? ORDER BY date DESC',
      [hotelId]
    );
    
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching hotel reviews:', error);
    res.status(500).json({ error: 'Failed to fetch hotel reviews' });
  }
});

// API endpoint to get hotel policies by hotel ID
app.get('/api/hotels/:id/policies', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const policies = await executeQuery(
      'SELECT * FROM hotel_policies WHERE hotel_id = ?',
      [hotelId]
    );
    
    res.status(200).json(policies);
  } catch (error) {
    console.error('Error fetching hotel policies:', error);
    res.status(500).json({ error: 'Failed to fetch hotel policies' });
  }
});

// Get hotels by location
app.get('/api/hotels/location/:location', async (req, res) => {
  try {
    const location = req.params.location;
    const hotels = await executeQuery('SELECT * FROM hotels WHERE location LIKE ?', [`%${location}%`]);
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Error fetching hotels by location:', error);
    res.status(500).json({ error: 'Failed to fetch hotels by location' });
  }
});

// Hotel reviews endpoint (assuming you might add a reviews table later)
app.get('/api/hotels/:id/reviews', async (req, res) => {
  try {
    // For now, this will return placeholder data since the reviews table doesn't exist yet
    // You can implement this properly once you add the reviews table
    const hotelId = req.params.id;
    
    // Placeholder response
    res.status(200).json([
      {
        id: 1,
        hotel_id: hotelId,
        user_name: 'Sample User',
        rating: 4.5,
        comment: 'This is a placeholder review. Implement proper review functionality when you add the reviews table.',
        date: new Date().toISOString()
      }
    ]);
  } catch (error) {
    console.error('Error fetching hotel reviews:', error);
    res.status(500).json({ error: 'Failed to fetch hotel reviews' });
  }
});

// Create a new hotel (would require authentication in production)
app.post('/api/hotels', async (req, res) => {
  try {
    const {
      name,
      location,
      address,
      rating,
      price_range,
      contact_number,
      email,
      website,
      image_url,
      latitude,
      longitude
    } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const result = await executeQuery(
      `INSERT INTO hotels 
      (name, location, address, rating, price_range, contact_number, email, website, image_url, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, location, address, rating, price_range, contact_number, email, website, image_url, latitude, longitude]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Hotel created successfully'
    });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ error: 'Failed to create hotel' });
  }
});

// Update a hotel (would require authentication in production)
app.put('/api/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const {
      name,
      location,
      address,
      rating,
      price_range,
      contact_number,
      email,
      website,
      image_url,
      latitude,
      longitude
    } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const result = await executeQuery(
      `UPDATE hotels SET
      name = ?, location = ?, address = ?, rating = ?, price_range = ?,
      contact_number = ?, email = ?, website = ?, image_url = ?,
      latitude = ?, longitude = ?
      WHERE hotel_id = ?`,
      [name, location, address, rating, price_range, contact_number, email, website, image_url, latitude, longitude, hotelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    
    res.status(200).json({ message: 'Hotel updated successfully' });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

// Delete a hotel (would require authentication in production)
app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const result = await executeQuery('DELETE FROM hotels WHERE hotel_id = ?', [hotelId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    
    res.status(200).json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({ error: 'Failed to delete hotel' });
  }
});
// ITINERARY ROUTES
app.get('/api/itinerary', async (req, res) => {
  try {
    const itineraries = await executeQuery('SELECT * FROM itinerary ORDER BY location_name');
    res.json(itineraries);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

app.get('/api/itinerary/detail/:id', async (req, res) => {
  const itineraryId = req.params.id;
  console.log(`Fetching itinerary with ID: ${itineraryId}`);
  
  try {
    const itineraries = await executeQuery('SELECT * FROM itinerary WHERE id = ?', [itineraryId]);
    
    console.log(`Query results:`, itineraries);
    
    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    res.json(itineraries[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

app.get('/api/itinerary/category/:category', async (req, res) => {
  try {
    const itineraries = await executeQuery(
      'SELECT * FROM itinerary WHERE category = ? ORDER BY location_name',
      [req.params.category]
    );
    res.json(itineraries);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// PACKAGE ROUTES
app.get('/api/packages', async (req, res) => {
  try {
    // Get basic package information with thumbnail
    const packages = await executeQuery(`
      SELECT 
        p.id as id,
        p.title,
        p.destination,
        p.duration_nights,
        p.duration_days,
        p.base_price,
        p.discounted_price,
        p.discount_percentage,
        p.rating,
        p.review_count,
        (SELECT pi.image_url 
         FROM package_images pi 
         WHERE pi.package_id = p.id  
         LIMIT 1) as image_url
      FROM packages p
    `);

    // Fetch inclusions for each package in parallel
    const packagesWithInclusions = await Promise.all(
      packages.map(async (pkg) => {
        const inclusions = await executeQuery(`
          SELECT pi.name, pi.icon
          FROM package_inclusions pi
          WHERE pi.package_id = ?
        `, [pkg.id]);

        return {
          ...pkg,
          duration: {
            nights: pkg.duration_nights,
            days: pkg.duration_days
          },
          inclusions: inclusions.map(inc => ({
            name: inc.name,
            icon: inc.icon
          }))
        };
      })
    );

    res.json(packagesWithInclusions);
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch packages',
      details: error.message 
    });
  } 
});

app.get('/api/packages/:id', async (req, res) => {
  try {
    const packageId = req.params.id;
    const query = `
      SELECT 
        id, 
        title, 
        destination, 
        duration_nights, 
        duration_days,
        base_price,
        discounted_price,
        discount_percentage,
        rating,
        review_count,
        description
      FROM packages 
      WHERE id = ?
    `;
    
    const packages = await executeQuery(query, [packageId]);
    
    if (packages.length === 0) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(packages[0]);
  } catch (error) {
    console.error('Error fetching package details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/images', async (req, res) => {
  try {
    const packageId = req.params.id;
    const images = await executeQuery(
      'SELECT image_url FROM package_images WHERE package_id = ?',
      [packageId]
    );
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/inclusions', async (req, res) => {
  try {
    const packageId = req.params.id;
    const inclusions = await executeQuery(
      'SELECT name, icon FROM package_inclusions WHERE package_id = ?',
      [packageId]
    );
    res.json(inclusions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/exclusions', async (req, res) => {
  try {
    const packageId = req.params.id;
    const exclusions = await executeQuery(
      'SELECT name FROM package_exclusions WHERE package_id = ?',
      [packageId]
    );
    res.json(exclusions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/itinerary', async (req, res) => {
  try {
    const packageId = req.params.id;
    const itinerary = await executeQuery(`
      SELECT 
        day, 
        title, 
        description 
      FROM package_itinerary 
      WHERE package_id = ? 
      ORDER BY day
    `, [packageId]);
    res.json(itinerary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/activities/:day', async (req, res) => {
  try {
    const { id: packageId, day } = req.params;
    const activities = await executeQuery(`
      SELECT activity 
      FROM package_activities 
      WHERE package_id = ? AND day = ?
    `, [packageId, day]);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/accommodations', async (req, res) => {
  try {
    const packageId = req.params.id;
    const accommodations = await executeQuery(`
      SELECT 
        name, 
        location, 
        star_rating, 
        image_url 
      FROM package_accommodations 
      WHERE package_id = ?
    `, [packageId]);
    res.json(accommodations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/packages/:id/faqs', async (req, res) => {
  try {
    const packageId = req.params.id;
    const faqs = await executeQuery(`
      SELECT 
        question, 
        answer 
      FROM package_faqs 
      WHERE package_id = ?
    `, [packageId]);
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// FLIGHT ROUTES
app.get('/api/airports', async (req, res) => {
  try {
    const airports = await executeQuery('SELECT iata_code, name, city FROM airports');
    res.json(airports);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error occurred' });
  }
});
// Get all destinations
app.get('/api/destinations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM destinations');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Get destinations by category
app.get('/api/destinations/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [rows] = await pool.query('SELECT * FROM destinations WHERE category = ?', [categoryId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching destinations by category:', error);
    res.status(500).json({ error: 'Failed to fetch destinations by category' });
  }
});

// Search destinations by name or location
app.get('/api/destinations/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchQuery = `%${query}%`;
    const [rows] = await pool.query(
      'SELECT * FROM destinations WHERE name LIKE ? OR location LIKE ?', 
      [searchQuery, searchQuery]
    );
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error searching destinations:', error);
    res.status(500).json({ error: 'Failed to search destinations' });
  }
});
// GET destination by ID
app.get('/api/destinations/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.execute(
      'SELECT * FROM destinations WHERE destination_id = ?',
      [req.params.id]
    );
    connection.release();
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching destination details:', err);
    res.status(500).json({ error: 'Failed to fetch destination details' });
  }
});

// Get recommended destinations (example: highest rated or most popular)
app.get('/api/destinations/recommended', async (req, res) => {
  try {
    // For this example, just getting the top 5 destinations with the highest entry fee
    // You might want to customize this based on your business logic (ratings, views, etc.)
    const [rows] = await pool.query(
      'SELECT * FROM destinations WHERE entry_fee IS NOT NULL ORDER BY entry_fee DESC LIMIT 5'
    );
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recommended destinations:', error);
    res.status(500).json({ error: 'Failed to fetch recommended destinations' });
  }
});

// Add a new destination (requires authentication in production)
app.post('/api/destinations', async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      category,
      address,
      open_hours,
      entry_fee,
      image_url,
      latitude,
      longitude
    } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO destinations 
      (name, description, location, category, address, open_hours, entry_fee, image_url, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, location, category, address, open_hours, entry_fee, image_url, latitude, longitude]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Destination created successfully' 
    });
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ error: 'Failed to create destination' });
  }
});

// Update a destination (requires authentication in production)
app.put('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      location,
      category,
      address,
      open_hours,
      entry_fee,
      image_url,
      latitude,
      longitude
    } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }
    
    const [result] = await pool.query(
      `UPDATE destinations SET
      name = ?, description = ?, location = ?, category = ?, 
      address = ?, open_hours = ?, entry_fee = ?, image_url = ?,
      latitude = ?, longitude = ?
      WHERE destination_id = ?`,
      [name, description, location, category, address, open_hours, entry_fee, image_url, latitude, longitude, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    
    res.status(200).json({ message: 'Destination updated successfully' });
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ error: 'Failed to update destination' });
  }
});

// Delete a destination (requires authentication in production)
app.delete('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM destinations WHERE destination_id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    
    res.status(200).json({ message: 'Destination deleted successfully' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ error: 'Failed to delete destination' });
  }
});



// API endpoint to save flight booking
app.post('/save-booking', async (req, res) => {
  try {
    const {
      userId,
      flightNumber,
      airline,
      departureAirport,
      departureCode,
      arrivalAirport,
      arrivalCode,
      departureTime,
      arrivalTime,
      passengers,
      amount,
      bookingDate,
      email,
      transactionId,
      paymentStatus
    } = req.body;

    // Validate required fields
    if (!userId || !flightNumber || !transactionId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required booking information' 
      });
    }

    // Insert booking into database
    const [result] = await pool.execute(
      `INSERT INTO flight_bookings 
       (user_id, flight_number, airline, departure_airport, departure_code, 
        arrival_airport, arrival_code, departure_time, arrival_time, 
        passengers, amount, booking_date, email, transaction_id, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        flightNumber,
        airline,
        departureAirport,
        departureCode,
        arrivalAirport,
        arrivalCode,
        departureTime,
        arrivalTime,
        passengers,
        amount,
        bookingDate,
        email,
        transactionId,
        paymentStatus
      ]
    );

    console.log('Booking saved successfully:', result);

    res.status(201).json({
      success: true,
      message: 'Flight booking saved successfully',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save booking',
      error: error.message
    });
  }
});



// API endpoint to get a specific booking
app.get('/flight-bookings/:bookingId', async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM flight_bookings WHERE id = ?',
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      booking: rows[0]
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
});

// API endpoint to send flight ticket email
app.post('/send-flight-ticket', async (req, res) => {
  try {
    const { email, bookingDetails } = req.body;

    // Validate required fields
    if (!email || !bookingDetails) {
      return res.status(400).json({
        success: false,
        message: 'Email and booking details are required'
      });
    }

    // Format passengers for email
    const passengerList = bookingDetails.passengers
      .map((p, index) => `${index + 1}. ${p.firstName} ${p.lastName}`).join('\n');

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Flight Booking Confirmation - ${bookingDetails.flightNumber}`,
      text: `
Dear Traveler,

Your flight booking has been confirmed!

Booking Reference: ${bookingDetails.transactionId}
Flight: ${bookingDetails.flightNumber}
Airline: ${bookingDetails.airline}

From: ${bookingDetails.departure}
To: ${bookingDetails.arrival}
Date: ${new Date(bookingDetails.date).toDateString()}

Passengers:
${passengerList}

Total Amount Paid: ₹${bookingDetails.amount}

Thank you for booking with us!

Safe travels,
MahaTourism Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
  <h2 style="color: #FF671F;">Flight Booking Confirmation</h2>
  <p>Dear Traveler,</p>
  <p>Your flight booking has been confirmed!</p>
  
  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p><strong>Booking Reference:</strong> ${bookingDetails.transactionId}</p>
    <p><strong>Flight:</strong> ${bookingDetails.flightNumber}</p>
    <p><strong>Airline:</strong> ${bookingDetails.airline}</p>
    <p><strong>From:</strong> ${bookingDetails.departure}</p>
    <p><strong>To:</strong> ${bookingDetails.arrival}</p>
    <p><strong>Date:</strong> ${new Date(bookingDetails.date).toDateString()}</p>
  </div>
  
  <h3>Passengers:</h3>
  <ul>
    ${bookingDetails.passengers.map(p => `<li>${p.firstName} ${p.lastName}</li>`).join('')}
  </ul>
  
  <p><strong>Total Amount Paid:</strong> ₹${bookingDetails.amount}</p>
  
  <p>Thank you for booking with us!</p>
  <p>Safe travels,<br>MahaTourism Team</p>
</div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Flight ticket email sent successfully'
    });
  } catch (error) {
    console.error('Error sending flight ticket email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send flight ticket email',
      error: error.message
    });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const [rows] = await pool.execute(
      'SELECT user_id, first_name,last_name, email, phone_number, address, city, state, zip_code FROM users WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { first_name,last_name, email, mobile, address, city, state, zip_code } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    await pool.execute(
      'UPDATE users SET first_name = ?,last_name = ?, email = ?, phone_number = ?, address = ?, city = ?, state = ?, zip_code = ? WHERE user_id = ?',
      [first_name,last_name, email, mobile, address || null, city || null, state || null, zip_code || null, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});
app.delete('/api/users/:userId',async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Start a transaction for data consistency
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      
      // Finally, delete the user from users table
      const [result] = await connection.execute(
        'DELETE FROM users WHERE user_id = ?',
        [userId]
      );
      
      if (result.affectedRows === 0) {
        // Rollback the transaction if user not found
        await connection.rollback();
        connection.release();
        
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Commit the transaction if everything succeeded
      await connection.commit();
      connection.release();
      
      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
      
    } catch (error) {
      // Rollback the transaction in case of any error
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('Error deleting user account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});


// Initialize the application
const startServer = async () => {
  try {
    // Test database connection
    await testDatabaseConnection();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

// Start the application
startServer();
