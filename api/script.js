const apiKey = 'AIzaSyB3590EwapG554xOXPvlYfwMjtTeqpDSmE';

async function testApiKey() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      role: "user",
      parts: [{ text: "Hello, Gemini!" }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API key is valid');
      console.log(data);
    } else {
      console.log('❌ API key is invalid');
      console.log(data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApiKey();
