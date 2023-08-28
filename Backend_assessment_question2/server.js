const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.get('/numbers', async (req, res) => {
  const urls = req.query.url; // Get the list of URLs from query parameters
  
  if (!urls) {
    return res.status(400).json({ error: 'URLs parameter is missing' });
  }
  
  const urlList = Array.isArray(urls) ? urls : [urls];
  const results = [];
  
  for (const url of urlList) {
    try {
      const response = await axios.get(url);
      const data = response.data.numbers;
      results.push(...data);
    } catch (error) {
      console.error(`Error fetching data from ${url}: ${error.message}`);
    }
  }
  
  res.json({ numbers: results });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});