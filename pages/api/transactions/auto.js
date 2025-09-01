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
  const { command } = req.body;

  try {
    console.log('Processing command:', command);
    
    // Process command with OpenAI via OpenRouter
    const prompt = `
      Anda adalah asisten keuangan. Analisis perintah pengguna dan ekstrak informasi transaksi.
      
      Perintah pengguna: "${command}"
      
      Ekstrak informasi berikut:
      1. type: "income" jika ini pemasukan, "expense" jika pengeluaran
      2. amount: jumlah uang dalam angka (tanpa titik atau koma)
      3. category: kategori transaksi (pilih dari: Makanan & Minuman, Transportasi, Belanja, Hiburan, Kesehatan, Pendidikan, Tagihan, Lainnya)
      4. note: catatan singkat tentang transaksi
      
      Jika tidak ada kategori yang jelas, gunakan "Lainnya".
      Jika tidak ada catatan yang jelas, buat catatan singkat yang sesuai.
      
      Respon harus dalam format JSON saja seperti ini:
      {
        "type": "income/expense",
        "amount": 30000,
        "category": "Kategori",
        "note": "Catatan"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // atau model lain yang tersedia di OpenRouter
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const text = completion.choices[0].message.content;
    console.log('OpenAI response:', text);

    // Parse JSON from OpenAI response
    let transactionData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        transactionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return res.status(400).json({ error: 'Gagal memproses perintah. Silakan coba lagi dengan perintah yang lebih jelas.' });
    }

    // Validate transaction data
    if (!transactionData.type || !transactionData.amount || !transactionData.category) {
      return res.status(400).json({ error: 'Data transaksi tidak lengkap. Pastikan perintah Anda jelas.' });
    }

    console.log('Transaction data:', transactionData);

    // Connect to MongoDB and save transaction
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

    console.log('MongoDB result:', mongoResult);

    res.status(201).json({ 
      success: true, 
      transaction: {
        _id: mongoResult.insertedId,
        ...transactionData
      }
    });
  } catch (error) {
    console.error('Error with auto transaction:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
