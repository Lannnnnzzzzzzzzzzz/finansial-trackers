import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

export default async function handler(req, res) {
  const { message } = req.body;

  try {
    // Get transactions data
    await client.connect();
    const database = client.db('financialTracker');
    const transactions = database.collection('transactions');
    const transactionsData = await transactions.find({}).toArray();

    // Format data for AI
    const formattedData = transactionsData.map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date.toISOString().split('T')[0],
      note: t.note
    }));

    // Create prompt for Gemini
    const prompt = `
      You are a financial assistant AI. Answer the user's question based on their transaction data.
      Here is the user's transaction data in JSON format:
      ${JSON.stringify(formattedData, null, 2)}
      
      User's question: ${message}
      
      Provide a helpful, concise response in Indonesian language.
    `;

    // Get response from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ response: text });
  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
