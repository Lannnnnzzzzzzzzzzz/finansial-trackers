import { MongoClient } from 'mongodb';
import { OpenAI } from 'openai';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Initialize OpenAI with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
});

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

    // Create prompt for OpenAI
    const prompt = `
      You are a financial assistant AI. Answer the user's question based on their transaction data.
      Here is the user's transaction data in JSON format:
      ${JSON.stringify(formattedData, null, 2)}
      
      User's question: ${message}
      
      Provide a helpful, concise response in Indonesian language.
    `;

    // Get response from OpenAI via OpenRouter
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
