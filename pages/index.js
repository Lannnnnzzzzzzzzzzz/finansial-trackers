import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Dashboard</h1>
      
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
