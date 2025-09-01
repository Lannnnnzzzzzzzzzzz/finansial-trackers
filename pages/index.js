import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [autoCommand, setAutoCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions');
      const data = response.data;
      setTransactions(data);
      
      // Calculate summary
      const income = data
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = data
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setSummary({
        income,
        expense,
        balance: income - expense
      });
      
      // Prepare category data for pie chart
      const categoryMap = {};
      data
        .filter(t => t.type === 'expense')
        .forEach(t => {
          if (categoryMap[t.category]) {
            categoryMap[t.category] += t.amount;
          } else {
            categoryMap[t.category] = t.amount;
          }
        });
      
      const categoryDataArray = Object.keys(categoryMap).map(category => ({
        name: category,
        value: categoryMap[category]
      }));
      
      setCategoryData(categoryDataArray);
      
      // Prepare monthly trend data
      const monthlyMap = {};
      data.forEach(t => {
        const month = format(new Date(t.date), 'MMM yyyy');
        if (!monthlyMap[month]) {
          monthlyMap[month] = { income: 0, expense: 0 };
        }
        
        if (t.type === 'income') {
          monthlyMap[month].income += t.amount;
        } else {
          monthlyMap[month].expense += t.amount;
        }
      });
      
      const monthlyDataArray = Object.keys(monthlyMap).map(month => ({
        month,
        income: monthlyMap[month].income,
        expense: monthlyMap[month].expense,
        balance: monthlyMap[month].income - monthlyMap[month].expense
      }));
      
      setMonthlyTrend(monthlyDataArray);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleAutoCommand = async (e) => {
    e.preventDefault();
    
    if (!autoCommand.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('/api/transactions/auto', {
        command: autoCommand
      });
      
      if (response.data.success) {
        // Reset command input
        setAutoCommand('');
        // Refresh transactions
        fetchTransactions();
        // Show success notification
        setNotification({
          show: true,
          message: `Transaksi berhasil ditambahkan: ${response.data.transaction.type === 'income' ? '+' : '-'}Rp ${response.data.transaction.amount.toLocaleString('id-ID')}`,
          type: 'success'
        });
      } else {
        setNotification({
          show: true,
          message: 'Gagal menambahkan transaksi: ' + response.data.error,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error with auto command:', error);
      setNotification({
        show: true,
        message: 'Terjadi kesalahan: ' + (error.response?.data?.error || error.message),
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exampleCommands = [
    "nabung 30rb",
    "beli makanan 25000",
    "bayar tagihan listrik 150000",
    "kasih orang tua 500000",
    "isi pulsa 30000"
  ];

  return (
    <div>
      {/* Notification */}
      {notification.show && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
        }`}>
          {notification.message}
        </div>
      )}
      
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Dashboard</h1>
      
      {/* Quick Transaction Section */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Tambah Transaksi Cepat</h2>
        <p className="text-gray-400 mb-4">Ketik perintah seperti "nabung 30rb" untuk menambah transaksi secara otomatis</p>
        
        <form onSubmit={handleAutoCommand} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={autoCommand}
              onChange={(e) => setAutoCommand(e.target.value)}
              placeholder="Contoh: nabung 30rb"
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? 'Memproses...' : 'Tambah Otomatis'}
            </button>
          </div>
        </form>
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Contoh Perintah:</h3>
          <div className="flex flex-wrap gap-2">
            {exampleCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => setAutoCommand(cmd)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Total Pemasukan</h2>
          <p className="text-2xl md:text-3xl text-green-400">Rp {summary.income.toLocaleString('id-ID')}</p>
        </div>
        
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Total Pengeluaran</h2>
          <p className="text-2xl md:text-3xl text-red-400">Rp {summary.expense.toLocaleString('id-ID')}</p>
        </div>
        
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Saldo</h2>
          <p className={`text-2xl md:text-3xl ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Rp {summary.balance.toLocaleString('id-ID')}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Pengeluaran per Kategori</h2>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Jumlah']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Tren Bulanan</h2>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrend}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#00C49F" name="Pemasukan" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="expense" stroke="#FF8042" name="Pengeluaran" />
                <Line type="monotone" dataKey="balance" stroke="#0088FE" name="Saldo" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
