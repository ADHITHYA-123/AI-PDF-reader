const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5000;

const API_KEY = 'AIzaSyB3590EwapG554xOXPvlYfwMjtTeqpDSmE';

app.use(express.json());
app.use(cors());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/api/ask-ai', async (req, res) => {
  const { prompt, textToAi, context } = req.body;

  if (!prompt || !textToAi || !context) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const maxContextLength = 10000;
    const trimmedContext = context.length > maxContextLength
      ? context.slice(0, maxContextLength) + '...'
      : context;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      `Context: ${trimmedContext}\nSelected text: ${textToAi}\nQuestion: ${prompt}`
    ]);

    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

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

try {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
} catch (error) {
  console.error(`Failed to start server: ${error.message}`);
}
