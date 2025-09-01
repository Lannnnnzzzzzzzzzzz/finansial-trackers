import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Halo! Saya adalah asisten keuangan Anda. Tanyakan apa saja tentang transaksi Anda.", 
      sender: 'ai' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user'
    };
    
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Send message to AI API
      const response = await axios.post('/api/ai', {
        message: inputText
      });
      
      // Add AI response
      const aiMessage = {
        id: messages.length + 2,
        text: response.data.response,
        sender: 'ai'
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.",
        sender: 'ai'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuestion = (question) => {
    setInputText(question);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">AI Assistant</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow h-[400px] md:h-[500px] flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold">Chat dengan AI Assistant</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`mb-4 ${message.sender === 'user' ? 'text-right' : ''}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg max-w-[80%] ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="mb-4">
                  <div className="inline-block p-3 rounded-lg bg-gray-700 text-white">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={handleSubmit} className="flex">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik pertanyaan Anda..."
                  className="flex-1 p-2 rounded-l-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                  disabled={isLoading}
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Contoh Pertanyaan</h2>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleExampleQuestion("Pengeluaran terbesar bulan ini apa?")}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                >
                  Pengeluaran terbesar bulan ini apa?
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleExampleQuestion("Kalau saya mengurangi pengeluaran 20%, tabungan saya jadi berapa?")}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                >
                  Kalau saya mengurangi pengeluaran 20%, tabungan saya jadi berapa?
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleExampleQuestion("Kasih tips hemat buat bulan depan.")}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                >
                  Kasih tips hemat buat bulan depan.
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleExampleQuestion("Berapa persentase pengeluaran untuk makanan dari total pengeluaran?")}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                >
                  Berapa persentase pengeluaran untuk makanan dari total pengeluaran?
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleExampleQuestion("Analisis tren keuangan saya untuk 3 bulan terakhir.")}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
                >
                  Analisis tren keuangan saya untuk 3 bulan terakhir.
                </button>
              </li>
            </ul>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="font-semibold mb-2">Tentang AI Assistant</h3>
              <p className="text-sm text-gray-400">
                AI Assistant menggunakan teknologi Google Gemini untuk menganalisis data transaksi Anda dan memberikan wawasan keuangan yang personal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
