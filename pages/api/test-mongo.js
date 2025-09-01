import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', uri);
    
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const database = client.db('financialTracker');
    const transactions = database.collection('transactions');
    
    const count = await transactions.countDocuments({});
    
    console.log('Transaction count:', count);
    
    res.status(200).json({ 
      message: "MongoDB connection successful!",
      transactionCount: count
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
}
