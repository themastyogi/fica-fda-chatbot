import React, { useState, useEffect, useCallback } from 'react';
import { User, Lock, Mail, MessageCircle, Send, LogOut, Crown, AlertCircle, Shield } from 'lucide-react';

const MAX_QUERIES_FREE = 5;

// Security: Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
};

// Security: Simple email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('demo'); // demo or premium

  // Demo users - this is where the login info is stored
  const demoUsers = {
    demo: {
      id: 1,
      email: 'demo@example.com',
      password: 'demo123',
      name: 'Demo User',
      isPaid: false,
      queriesUsed: 0,
      maxQueries: MAX_QUERIES_FREE,
    },
    premium: {
      id: 2,
      email: 'premium@example.com', 
      password: 'premium123',
      name: 'Premium User',
      isPaid: true,
      queriesUsed: 0,
      maxQueries: -1,
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ficaFdaToken');
    const savedUserId = localStorage.getItem('ficaFdaUserId');
    
    if (savedToken && savedUserId) {
      const currentUser = Object.values(demoUsers).find(u => u.id === parseInt(savedUserId));
      if (currentUser) {
        setUser(currentUser);
        setAuthToken(savedToken);
        setCurrentView('chat');
      }
    }
  }, []);

  // Fixed input change handler - simplified to avoid re-render issues
  const handleLoginInputChange = (field, value) => {
    setLoginData(prev => ({
      ...prev,
      [field]: sanitizeInput(value)
    }));
  };

  const handleQuickLogin = useCallback((accountType) => {
    const selectedUser = demoUsers[accountType];
    setLoginData({
      email: selectedUser.email,
      password: selectedUser.password
    });
    setSelectedAccountType(accountType);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!loginData.email || !loginData.password) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(loginData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find matching user
      const foundUser = Object.values(demoUsers).find(
        u => u.email === loginData.email && u.password === loginData.password
      );
      
      if (foundUser) {
        // Generate token
        const token = btoa(`${foundUser.id}-${Date.now()}`);
        
        setUser(foundUser);
        setAuthToken(token);
        
        // Store in localStorage - this is where login info is saved
        localStorage.setItem('ficaFdaToken', token);
        localStorage.setItem('ficaFdaUserId', foundUser.id.toString());
        
        setCurrentView('chat');
        setLoginData({ email: '', password: '' });
        
        console.log(`User ${foundUser.email} logged in at ${new Date().toISOString()}`);
      } else {
        alert('Invalid credentials. Try demo@example.com/demo123 or premium@example.com/premium123');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [loginData]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    setCurrentView('login');
    setChatMessages([]);
    setLoginData({ email: '', password: '' });
    
    // Clear localStorage
    localStorage.removeItem('ficaFdaToken');
    localStorage.removeItem('ficaFdaUserId');
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    if (!user.isPaid && user.queriesUsed >= user.maxQueries) {
      alert('You have reached your free query limit. Please upgrade to premium.');
      return;
    }

    const sanitizedMessage = sanitizeInput(inputMessage.trim());
    setIsLoading(true);
    setChatMessages(prev => [...prev, { type: 'user', content: sanitizedMessage }]);
    setInputMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const responses = [
        'Based on FICA-FDA regulations, this requires documentation of compliance procedures...',
        'According to current FDA guidelines, you need to ensure proper validation protocols...',
        'The FICA compliance framework suggests implementing these security measures...',
        'For regulatory compliance, please consider these documentation requirements...'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setChatMessages(prev => [...prev, { type: 'bot', content: randomResponse }]);

      // Update query count
      setUser(prev => ({ ...prev, queriesUsed: prev.queriesUsed + 1 }));
      
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, an error occurred. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, user]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const LoginForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FICA-FDA Compliance</h1>
          <p className="text-gray-300">AI-Powered Compliance Assistant</p>
        </div>

        {/* Quick Login Options */}
        <div className="mb-6 space-y-3">
          <p className="text-white text-sm text-center mb-4">Quick Login Options:</p>
          
          <button
            onClick={() => handleQuickLogin('demo')}
            className={`w-full p-3 rounded-lg border transition-all ${
              selectedAccountType === 'demo'
                ? 'bg-blue-500/30 border-blue-400 text-white'
                : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium">Demo Account</p>
                <p className="text-xs opacity-75">5 free queries • demo@example.com</p>
              </div>
              <User className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => handleQuickLogin('premium')}
            className={`w-full p-3 rounded-lg border transition-all ${
              selectedAccountType === 'premium'
                ? 'bg-purple-500/30 border-purple-400 text-white'
                : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium flex items-center">
                  Premium Account <Crown className="w-4 h-4 text-yellow-400 ml-1" />
                </p>
                <p className="text-xs opacity-75">Unlimited queries • premium@example.com</p>
              </div>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
          </button>
        </div>

        {/* Manual Login Form */}
        <div className="space-y-4 border-t border-white/20 pt-6">
          <p className="text-white text-sm text-center mb-4">Or login manually:</p>
          
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="email"
              placeholder="Email Address"
              value={loginData.email}
              onChange={(e) => handleLoginInputChange('email', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => handleLoginInputChange('password', e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        {/* Login Info Storage Notice */}
        <div className="mt-6 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
          <p className="text-green-200 text-xs">
            <strong>Login Info Storage:</strong> Demo credentials are stored in component state. 
            Your session token is saved in localStorage for persistence.
          </p>
        </div>
      </div>
    </div>
  );

  const ChatInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
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
            <h3 className="text-white text-xl font-semibold mb-2">Welcome to FICA-FDA Compliance Assistant</h3>
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
              ? 'You have reached your free query limit. Please upgrade to premium!'
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
            onChange={(e) => setInputMessage(sanitizeInput(e.target.value))}
            onKeyPress={handleKeyPress}
            placeholder="Ask about FICA-FDA compliance..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || (!user.isPaid && user.queriesUsed >= user.maxQueries)}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim() || (!user.isPaid && user.queriesUsed >= user.maxQueries)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white p-3 rounded-lg transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {currentView === 'login' && <LoginForm />}
      {currentView === 'chat' && user && <ChatInterface />}
    </div>
  );
};

export default App;
