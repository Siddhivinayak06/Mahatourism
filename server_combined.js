const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail'); // Changed to proper import
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Global constants
const PORT = process.env.PORT || 5000;

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Omshri#20',
  database: 'mahatourism1',
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

// NOTIFICATION ROUTES
app.post('/api/send-confirmation-email', (req, res) => {
  const { email, bookingDetails } = req.body;

  sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

  const msg = {
    to: email,
    from: 'mahatourismteam@gmail.com',
    subject: 'Booking Confirmation',
    text: `Your booking was successful! Details: ${JSON.stringify(bookingDetails)}`
  };

  sgMail.send(msg)
    .then(() => {
      res.status(200).json({ message: 'Confirmation email sent!' });
    })
    .catch((error) => {
      console.error('Error sending email:', error);
      res.status(500).json({ 
        message: 'Failed to send confirmation email', 
        error: error.message 
      });
    });
});

app.post('/api/send-confirmation-code', async (req, res) => {
  const { contact } = req.body;

  try {
    const users = await executeQuery('SELECT * FROM users WHERE phone_number = ?', [contact]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Account does not exist' });
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    const expirationTime = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now

    await executeQuery(
      'INSERT INTO confirmation_codes (contact, code, expires_at) VALUES (?, ?, ?)', 
      [contact, confirmationCode, expirationTime]
    );

    // Send the confirmation code via SMS
    const client = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');
    
    await client.messages.create({
      body: `Your confirmation code is: ${confirmationCode}`,
      to: contact,
      from: 'YOUR_TWILIO_PHONE_NUMBER'
    });
    
    res.status(200).json({ message: 'Confirmation code sent!' });
  } catch (error) {
    console.error('Error sending confirmation code:', error);
    res.status(500).json({ 
      message: 'Failed to send confirmation code', 
      error: error.message 
    });
  }
});

// HOTEL ROUTES
app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await executeQuery('SELECT * FROM hotels');
    res.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

app.get('/api/hotels/featured', async (req, res) => {
  try {
    const featuredHotels = await executeQuery(
      'SELECT * FROM hotels WHERE rating >= 4.0 ORDER BY rating DESC LIMIT 10'
    );
    res.json(featuredHotels);
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({ error: 'Failed to fetch featured hotels' });
  }
});

app.get('/api/hotels/search', async (req, res) => {
  const { 
    location, 
    checkIn, 
    checkOut, 
    guests, 
    rooms, 
    priceRange, 
    rating 
  } = req.query;

  try {
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const params = [];

    if (location) {
      query += ' AND (location LIKE ? OR address LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }

    if (rating) {
      query += ' AND rating >= ?';
      params.push(parseFloat(rating));
    }

    if (priceRange) {
      if (priceRange === '$') {
        query += ' AND price_range LIKE ?';
        params.push('$%');
      } else if (priceRange === '$$') {
        query += ' AND price_range LIKE ?';
        params.push('$$%');
      } else if (priceRange === '$$$') {
        query += ' AND price_range LIKE ?';
        params.push('$$$%');
      } else if (priceRange === '$$$$') {
        query += ' AND price_range = ?';
        params.push('$$$$');
      }
    }

    query += ' ORDER BY rating DESC LIMIT 50';

    const hotels = await executeQuery(query, params);
    
    console.log('Search parameters:', req.query);
    console.log('Found', hotels.length, 'hotels matching criteria');
    
    res.json(hotels);
  } catch (error) {
    console.error('Error searching hotels:', error);
    res.status(500).json({ error: 'Failed to search hotels' });
  }
});

app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotels = await executeQuery(
      'SELECT * FROM hotels WHERE hotel_id = ?',
      [req.params.id]
    );

    if (hotels.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json(hotels[0]);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
});

app.post('/api/hotels', async (req, res) => {
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

  try {
    const result = await executeQuery(
      `INSERT INTO hotels 
      (name, location, address, rating, price_range, contact_number, email, website, image_url, latitude, longitude) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, location, address, rating, price_range, contact_number, email, website, image_url, latitude, longitude]
    );

    res.status(201).json({
      message: 'Hotel added successfully',
      hotel_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding hotel:', error);
    res.status(500).json({ error: 'Failed to add hotel' });
  }
});

app.put('/api/hotels/:id', async (req, res) => {
  const { id } = req.params;
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

  try {
    const result = await executeQuery(
      `UPDATE hotels SET
      name = ?,
      location = ?,
      address = ?,
      rating = ?,
      price_range = ?,
      contact_number = ?,
      email = ?,
      website = ?,
      image_url = ?,
      latitude = ?,
      longitude = ?
      WHERE hotel_id = ?`,
      [name, location, address, rating, price_range, contact_number, email, website, image_url, latitude, longitude, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json({ message: 'Hotel updated successfully' });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const result = await executeQuery(
      'DELETE FROM hotels WHERE hotel_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json({ message: 'Hotel deleted successfully' });
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
         LIMIT 1) as thumbnailUrl
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