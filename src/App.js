import React, { useState, useEffect, useCallback } from 'react';
import { User, Lock, Mail, MessageCircle, Send, LogOut, Crown, AlertCircle } from 'lucide-react';

const MAX_QUERIES_FREE = 5;

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [users, setUsers] = useState([
    {
      id: 1,
      email: 'demo@example.com',
      password: 'demo123',
      name: 'Demo User',
      isPaid: false,
      queriesUsed: 0,
      maxQueries: MAX_QUERIES_FREE,
    },
    {
      id: 2,
      email: 'premium@example.com',
      password: 'premium123',
      name: 'Premium User',
      isPaid: true,
      queriesUsed: 0,
      maxQueries: -1,
    },
  ]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ficaFdaUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const currentUser = users.find((u) => u.id === userData.id);
      if (currentUser) {
        setUser(currentUser);
        setCurrentView('chat');
      }
    }
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleLogin = useCallback(() => {
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }
    const foundUser = users.find(
      (u) => u.email === formData.email && u.password === formData.password
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('ficaFdaUser', JSON.stringify(foundUser));
      setCurrentView('chat');
      setFormData({ email: '', password: '', name: '' });
    } else {
      alert('Invalid credentials');
    }
  }, [formData, users]);

  const handleSignup = useCallback(() => {
    if (!formData.email || !formData.password || !formData.name) {
      alert('Please fill in all fields');
      return;
    }
    const existingUser = users.find((u) => u.email === formData.email);
    if (existingUser) {
      alert('User already exists');
      return;
    }

    const newUser = {
      id: users.length + 1,
      email: formData.email,
      password: formData.password,
      name: formData.name,
      isPaid: false,
      queriesUsed: 0,
      maxQueries: MAX_QUERIES_FREE,
    };

    setUsers([...users, newUser]);
    setUser(newUser);
    localStorage.setItem('ficaFdaUser', JSON.stringify(newUser));
    setCurrentView('chat');
    setFormData({ email: '', password: '', name: '' });
  }, [formData, users]);

  const handleSubmit = useCallback((e) => {
  e.preventDefault();
  if (currentView === 'login') {
    handleLogin();
  } else if (currentView === 'signup') {
    handleSignup();
  }
}, [currentView, handleLogin, handleSignup]);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ficaFdaUser');
    setCurrentView('login');
    setChatMessages([]);
  }, []);
// ✅ sendMessage rewritten (important part for keystroke bug fix)
const sendMessage = useCallback(async () => {
  if (!inputMessage.trim()) return;

  if (!user.isPaid && user.queriesUsed >= user.maxQueries) {
    alert("You have reached your free query limit. Please upgrade to premium.");
    return;
  }

  // ✅ Keystroke bug FIX — clear input immediately
  setChatMessages((prev) => [
    ...prev,
    { type: "user", content: inputMessage },
  ]);
  setInputMessage(""); // Keystroke bug FIX

  try {
    setIsLoading(true);

    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inputMessage }),
    });

    if (!response.ok) throw new Error("Backend response failed");

    const data = await response.json();

    setChatMessages((prev) => [
      ...prev,
      { type: "bot", content: data.reply },
    ]);

    const updatedUser = { ...user, queriesUsed: user.queriesUsed + 1 };
    setUser(updatedUser);
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === user.id ? updatedUser : u))
    );
    localStorage.setItem("ficaFdaUser", JSON.stringify(updatedUser));
  } catch (error) {
    console.error(error);
    setChatMessages((prev) => [
      ...prev,
      { type: "bot", content: "Sorry, an error occurred. Please try again." },
    ]);
  } finally {
    setIsLoading(false);
  }
}, [inputMessage, user]);

// ✅ Added a new function to replace old onKeyPress
const handleKeyDown = useCallback(
  (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  },
  [sendMessage]
);

  const handleChatInputChange = useCallback((e) => {
    setInputMessage(e.target.value);
  }, []);

  const AuthForm = ({ isLogin }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FICA-FDA Compliance</h1>
          <p className="text-gray-300">AI-Powered Compliance Assistant</p>
        </div>

        <div className="space-y-6">
          {!isLogin && (
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // ✅ Keystroke bug FIX — call submit handler directly
                    sendMessage();
                  }
                }}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // ✅ Keystroke bug FIX
                  sendMessage();
                }
              }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // ✅ Keystroke bug FIX
                  handleSubmit(e);
                }
              }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            onClick={isLogin ? handleLogin : handleSignup}
            type="button"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setCurrentView(isLogin ? 'signup' : 'login')}
              className="ml-2 text-blue-400 hover:text-blue-300 font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-sm text-blue-200 mb-2">Demo Accounts:</p>
            <p className="text-xs text-blue-300">Free: demo@example.com / demo123</p>
            <p className="text-xs text-blue-300">Premium: premium@example.com / premium123</p>
          </div>
        )}
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold">FICA-FDA Compliance Assistant</h1>
            <p className="text-gray-300 text-sm">AI-Powered Regulatory Guidance</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-white font-medium flex items-center">
              {user.isPaid && <Crown className="w-4 h-4 text-yellow-400 mr-1" />}
              {user.name}
            </p>
            <p className="text-gray-300 text-sm">
              {user.isPaid ? 'Premium User' : `${user.queriesUsed}/${user.maxQueries} queries used`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white text-xl font-semibual mb-2">Welcome to FICA-FDA Compliance Assistant</h3>
            <p className="text-gray-300 max-w-md mx-auto">
              Ask me anything about FICA-FDA compliance, regulatory requirements, or related guidelines.
            </p>
          </div>
        )}

        {chatMessages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">Thinking...</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Query Limit Warning */}
      {!user.isPaid && user.queriesUsed >= user.maxQueries - 1 && (
        <div className="mx-6 mb-4 p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <p className="text-orange-200 text-sm">
            {user.queriesUsed >= user.maxQueries
              ? 'You have reached your free query limit. Upgrade to premium for unlimited access!'
              : `You have ${user.maxQueries - user.queriesUsed} free queries remaining.`}
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={handleChatInputChange}
            onKeyDown={handleKeyDown}   
            placeholder="Ask about FICA-FDA compliance..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || (!user.isPaid && user.queriesUsed >= user.maxQueries)}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim() || (!user.isPaid && user.queriesUsed >= user.maxQueries)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white p-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentView === 'login' && <AuthForm isLogin />}
      {currentView === 'signup' && <AuthForm isLogin={false} />}
      {currentView === 'chat' && user && <ChatInterface />}
    </>
  );
};

export default App;
