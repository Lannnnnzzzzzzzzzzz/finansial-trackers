import { MongoClient } from 'mongodb';
import { OpenAI } from 'openai';

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {},
    tests: {}
  };

  // Test 1: Check Environment Variables
  results.environment = {
    MONGODB_URI: process.env.MONGODB_URI ? "✓ Present" : "✗ Missing",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✓ Present" : "✗ Missing",
    OPENAI_API_BASE: process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1"
  };

  // Test 2: MongoDB Connection
  try {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    
    await client.connect();
    const database = client.db('financialTracker');
    const transactions = database.collection('transactions');
    
    const count = await transactions.countDocuments({});
    
    results.tests.mongodb = {
      status: "✓ Connected",
      transactionCount: count
    };
    
    await client.close();
  } catch (error) {
    results.tests.mongodb = {
      status: "✗ Failed",
      error: error.message
    };
  }

  // Test 3: OpenAI API via OpenRouter
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
    });
    
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: "Halo, apa kabar?" }],
      max_tokens: 100,
    });
    
    const response = completion.choices[0].message.content;
    
    results.tests.openai = {
      status: "✓ Working",
      response: response.substring(0, 100) + "..."
    };
  } catch (error) {
    results.tests.openai = {
      status: "✗ Failed",
      error: error.message
    };
  }

  // Test 4: Auto Transaction
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || 'https://openrouter.ai/api/v1',
    });
    
    const prompt = `
      Anda adalah asisten keuangan. Analisis perintah pengguna dan ekstrak informasi transaksi.
      
      Perintah pengguna: "nabung 30000"
      
      Ekstrak informasi berikut:
      1. type: "income" jika ini pemasukan, "expense" jika pengeluaran
      2. amount: jumlah uang dalam angka
      3. category: kategori transaksi
      4. note: catatan singkat tentang transaksi
      
      Respon harus dalam format JSON saja seperti ini:
      {
        "type": "income",
        "amount": 30000,
        "category": "Lainnya",
        "note": "Nabung"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    const text = completion.choices[0].message.content;

    // Parse JSON from OpenAI response
    let transactionData;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      transactionData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No valid JSON found in response');
    }

    // Test MongoDB insert
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db('financialTracker');
    const transactions = database.collection('transactions');

    const mongoResult = await transactions.insertOne({
      type: transactionData.type,
      amount: parseFloat(transactionData.amount),
      category: transactionData.category,
      date: new Date(),
      note: transactionData.note || ''
    });

    await client.close();

    results.tests.autoTransaction = {
      status: "✓ Working",
      transaction: {
        _id: mongoResult.insertedId,
        ...transactionData
      }
    };
  } catch (error) {
    results.tests.autoTransaction = {
      status: "✗ Failed",
      error: error.message
    };
  }

  res.status(200).json(results);
}
