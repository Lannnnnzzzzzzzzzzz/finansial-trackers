import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await client.connect();
    const database = client.db('financialTracker');
    const transactions = database.collection('transactions');

    if (req.method === 'PUT') {
      // Update transaction
      const { type, amount, category, date, note } = req.body;
      const result = await transactions.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            type,
            amount: parseFloat(amount),
            category,
            date: new Date(date),
            note
          }
        }
      );
      res.status(200).json(result);
    } else if (req.method === 'DELETE') {
      // Delete transaction
      const result = await transactions.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json(result);
    } else {
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
