import React, { useState, useEffect, useCallback } from 'react';
import { User, Lock, Mail, MessageCircle, Send, LogOut, Crown, AlertCircle } from 'lucide-react';

const MAX_QUERIES_FREE = 5;

// Security: Input sanitization helper
const sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Security: Simple email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Security: Password strength check
const isValidPassword = (password) => {
  return password.length >= 6; // Minimum requirement
};

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(null); // Security: Use tokens instead of storing user data

  // Security: Remove passwords from frontend, use demo mode flag
  const [demoUsers] = useState([
    {
      id: 1,
      email: 'demo@example.com',
      name: 'Demo User',
      isPaid: false,
      queriesUsed: 0,
      maxQueries: MAX_QUERIES_FREE,
    },
    {
      id: 2,
      email: 'premium@example.com',
      name: 'Premium User',
      isPaid: true,
      queriesUsed: 0,
      maxQueries: -1,
    },
  ]);

  useEffect(() => {
    // Security: Only store minimal, non-sensitive data
    const savedToken = localStorage.getItem('ficaFdaToken');
    const savedUserId = localStorage.getItem('ficaFdaUserId');
    
    if (savedToken && savedUserId) {
      // In real app: validate token with backend
      const currentUser = demoUsers.find((u) => u.id === parseInt(savedUserId));
      if (currentUser) {
        setUser(currentUser);
        setAuthToken(savedToken);
        setCurrentView('chat');
      }
    }
  }, [demoUsers]);

  const handleInputChange = useCallback((e) => {
    // Security: Sanitize input
    const sanitizedValue = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, [e.target.name]: sanitizedValue }));
  }, []);

  const handleLogin = useCallback(async () => {
    // Security: Input validation
    if (!formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Security: In real app, this would be an API call to backend
    // For demo purposes, we'll simulate authentication
    try {
      // Simulate API delay
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo authentication (replace with real backend call)
      const foundUser = demoUsers.find((u) => u.email === formData.email);
      
      if (foundUser && 
          ((formData.email === 'demo@example.com' && formData.password === 'demo123') ||
           (formData.email === 'premium@example.com' && formData.password === 'premium123'))) {
        
        // Security: Generate a simple token (in real app, this comes from backend)
        const token = btoa(`${foundUser.id}-${Date.now()}`);
        
        setUser(foundUser);
        setAuthToken(token);
        
        // Security: Store only token and user ID, not sensitive data
        localStorage.setItem('ficaFdaToken', token);
        localStorage.setItem('ficaFdaUserId', foundUser.id.toString());
        
        setCurrentView('chat');
        setFormData({ email: '', password: '', name: '' });
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, demoUsers]);

  const handleSignup = useCallback(async () => {
    // Security: Input validation
    if (!formData.email || !formData.password || !formData.name) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!isValidPassword(formData.password)) {
      alert('Password must be at least 6 characters long');
      return;
    }

    // Security: Check for existing user
    const existingUser = demoUsers.find((u) => u.email === formData.email);
    if (existingUser) {
      alert('User already exists');
      return;
    }

    // In real app: Send to backend API for registration
    alert('Signup feature requires backend implementation for security');
    
  }, [formData, demoUsers]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setAuthToken(null);
    // Security: Clear all stored data
    localStorage.removeItem('ficaFdaToken');
    localStorage.removeItem('ficaFdaUserId');
    setCurrentView('login');
    setChatMessages([]);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    // Security: Check authentication
    if (!authToken || !user) {
      alert('Please log in again');
      handleLogout();
      return;
    }

    if (!user.isPaid && user.queriesUsed >= user.maxQueries) {
      alert('You have reached your free query limit. Please upgrade to premium.');
      return;
    }

    // Security: Sanitize input message
    const sanitizedMessage = sanitizeInput(inputMessage.trim());

    setIsLoading(true);
    setChatMessages((prev) => [...prev, { type: 'user', content: sanitizedMessage }]);
    setInputMessage('');

    try {
      // Security: Use HTTPS in production, include auth token
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-api.com/chat'  // Replace with your secure API
        : 'http://localhost:8000/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Security: Include auth token
        },
        body: JSON.stringify({ 
          message: sanitizedMessage,
          timestamp: new Date().toISOString() // Security: Add timestamp
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Security: Sanitize response
      const sanitizedResponse = sanitizeInput(data.reply || 'No response received');
      setChatMessages((prev) => [...prev, { type: 'bot', content: sanitizedResponse }]);

      // Update user queries (in real app, this would be handled by backend)
      const updatedUser = { ...user, queriesUsed: user.queriesUsed + 1 };
      setUser(updatedUser);
      
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        { type: 'bot', content: 'Sorry, an error occurred. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, user, authToken, handleLogout]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleChatInputChange = useCallback((e) => {
    // Security: Sanitize chat input
    const sanitizedValue = sanitizeInput(e.target.value);
    setInputMessage(sanitizedValue);
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
                maxLength="50" /* Security: Limit input length */
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
              maxLength="100" /* Security: Limit input length */
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
              maxLength="50" /* Security: Limit input length */
              className="w-full bg-white/10 border border-white/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            onClick={isLogin ? handleLogin : handleSignup}
            disabled={isLoading}
            type="button"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
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
            onKeyPress={handleKeyPress}
            placeholder="Ask about FICA-FDA compliance..."
            maxLength="500" /* Security: Limit message length */
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
