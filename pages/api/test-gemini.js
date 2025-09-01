import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export default async function handler(req, res) {
  try {
    console.log('Testing Gemini API...');
    
    // Gunakan model name yang benar
    const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });
    const result = await model.generateContent("Halo, apa kabar?");
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);
    
    res.status(200).json({ 
      message: "Gemini API successful!",
      response: text
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: error.message });
  }
}
