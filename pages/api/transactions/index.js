import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const database = client.db('financialTracker');
    const transactions = database.collection('transactions');

    if (req.method === 'GET') {
      // Get all transactions
      const result = await transactions.find({}).toArray();
      res.status(200).json(result);
    } else if (req.method === 'POST') {
      // Create new transaction
      const { type, amount, category, date, note } = req.body;
      const result = await transactions.insertOne({
        type,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        note
      });
      res.status(201).json(result);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
