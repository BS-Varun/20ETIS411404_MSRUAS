const cors = require('cors');
const axios = require('axios');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory user registration data
const registeredUsers = [];

// Function to generate random access code
function generateAccessCode() {
  const accessCode = Math.random().toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 8).toUpperCase();
  return accessCode;
}

// Middleware to validate access code and set authenticated user
function authenticateUser(req, res, next) {
  const accessCode = req.headers.authorization;
  const user = registeredUsers.find(u => u.accessCode === accessCode);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
}

// User registration endpoint
app.post('/register', (req, res) => {
  const { companyName, ownerName, ownerEmail, rollNo } = req.body;
  const accessCode = generateAccessCode();

  const newUser = {
    companyName,
    ownerName,
    ownerEmail,
    rollNo,
    accessCode,
  };

  registeredUsers.push(newUser);
  res.status(201).json({ message: 'Registration successful', accessCode });
});

// API to fetch and sort train data
app.get('/trains', authenticateUser, async (req, res) => {
  try {
    const AUTH_TKN = req.user.accessCode;
    const headers = {
      Authorization: `Bearer ${AUTH_TKN}`,
    };

    const response = await axios.get("http://20.244.56.144/train/trains", { headers });
    const trainsData = response.data;

    const currentTime = Date.now();
    const next12Hours = currentTime + 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    const validTrains = trainsData.filter(train => {
      const departureTimeWithDelay = train.departureTime.getTime() + 30 * 60 * 1000; // 30 minutes in milliseconds
      return train.departureTime > currentTime && train.departureTime < next12Hours && departureTimeWithDelay > currentTime;
    });

    const sortedTrains = validTrains.sort((a, b) => {
      const priceComp = a.prices.AC - b.prices.AC;
      if (priceComp !== 0) {
        return priceComp;
      }
      const seatsAvailableComp = b.seatAvailability.AC - a.seatAvailability.AC;
      if (seatsAvailableComp !== 0) {
        return seatsAvailableComp;
      }
      return b.departureTime - a.departureTime;
    });

    res.json(sortedTrains);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(8000, () => {
  console.log("Server is running on port http://localhost:8000");
});
