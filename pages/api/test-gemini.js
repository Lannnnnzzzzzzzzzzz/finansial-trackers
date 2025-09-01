import { OpenAI } from 'openai';

// Initialize OpenAI with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
});

export default async function handler(req, res) {
  try {
    console.log('Testing OpenRouter API...');
    
    // Test dengan model GPT-3.5 Turbo
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: "Halo, apa kabar?" }],
      max_tokens: 100,
    });
    
    const response = completion.choices[0].message.content;
    
    console.log('OpenRouter response:', response);
    
    res.status(200).json({ 
      message: "OpenRouter API successful!",
      response: response,
      model: "openai/gpt-3.5-turbo"
    });
  } catch (error) {
    console.error('OpenRouter API error:', error);
    res.status(500).json({ error: error.message });
  }
}
