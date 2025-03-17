const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5000;

// ✅ Directly add your API key here
const API_KEY = 'AIzaSyB3590EwapG554xOXPvlYfwMjtTeqpDSmE';

// ✅ Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Handle preflight requests
app.options('/api/ask-ai', (req, res) => {
  res.sendStatus(200);
});

// ✅ Initialize Gemini API for Flash model
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/ask-ai', async (req, res) => {
  const { prompt, selectedText, context } = req.body;

  if (!prompt || !selectedText || !context) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ✅ Use the correct Gemini Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // ✅ Prepare the input format
    const result = await model.generateContent({
      contents: [
        {
          parts: [
            { text: `Context: ${context}\nSelected text: ${selectedText}\nQuestion: ${prompt}` }
          ]
        }
      ]
    });

    // ✅ Extract the response
    const responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }

    console.log('AI Response:', responseText);

    res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
