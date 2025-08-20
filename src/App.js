import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  MessageCircle,
  Send,
  LogOut,
  Crown,
  AlertCircle,
  Shield,
  Settings,
  Users,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';

const MAX_QUERIES_EXPLORER = 5;

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
  const [currentView, setCurrentView] = useState('login'); // login, chat, admin, upgrade
  const [user, setUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  // User database - stored in component state
  const [userDatabase, setUserDatabase] = useState([
    {
      id: 1,
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      queriesUsed: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'explorer@example.com',
      password: 'explorer123',
      name: 'Explorer User',
      role: 'explorer',
      queriesUsed: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      email: 'pro@example.com',
      password: 'pro123',
      name: 'Pro User',
      role: 'pro',
      queriesUsed: 15,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Get user limits based on role
  const getUserLimits = (role) => {
    switch (role) {
      case 'admin':
        return { maxQueries: -1, canManageUsers: true };
      case 'pro':
        return { maxQueries: -1, canManageUsers: false };
      case 'explorer':
      default:
        return { maxQueries: MAX_QUERIES_EXPLORER, canManageUsers: false };
    }
  };

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(signupEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (signupPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (userDatabase.find((u) => u.email === signupEmail.toLowerCase())) {
      alert('User with this email already exists');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser = {
        id: Date.now(),
        email: signupEmail.toLowerCase(),
        password: signupPassword,
        name: signupName.trim(),
        role: 'explorer',
        queriesUsed: 0,
        createdAt: new Date().toISOString(),
      };

      setUserDatabase((prev) => [...prev, newUser]);
      setUser(newUser);
      setCurrentView('chat');

      // Clear signup form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');

      console.log(`New explorer user created: ${newUser.email}`);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidEmail(loginEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const foundUser = userDatabase.find(
        (u) => u.email === loginEmail.toLowerCase() && u.password === loginPassword
      );

      if (foundUser) {
        setUser(foundUser);
        setCurrentView('chat');

        // Clear login form
        setLoginEmail('');
        setLoginPassword('');

        console.log(`User ${foundUser.email} logged in as ${foundUser.role}`);
      } else {
        alert('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    setChatMessages([]);
    setLoginEmail('');
    setLoginPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
  };

  const handleUpgradeRequest = () => {
    setCurrentView('upgrade');
  };

  const processUpgrade = async () => {
    setIsLoading(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update user role to pro
      const updatedUser = { ...user, role: 'pro' };
      setUser(updatedUser);

      // Update in database
      setUserDatabase((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

      alert('Congratulations! You have been upgraded to Pro. You now have unlimited queries!');
      setCurrentView('chat');
    } catch (error) {
      alert('Upgrade failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = (userId, newRole) => {
    setUserDatabase((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    if (user && user.id === userId) {
      setUser((prev) => ({ ...prev, role: newRole }));
    }

    alert(`User role updated to ${newRole}`);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userLimits = getUserLimits(user.role);
    if (userLimits.maxQueries !== -1 && user.queriesUsed >= userLimits.maxQueries) {
      alert('You have reached your query limit. Please upgrade to Pro for unlimited access.');
      return;
    }

    const sanitizedMessage = sanitizeInput(inputMessage.trim());
    setIsLoading(true);
    setChatMessages((prev) => [...prev, { type: 'user', content: sanitizedMessage }]);
    setInputMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const responses = [
        'Based on FICA-FDA regulations, this requires documentation of compliance procedures and thorough validation protocols.',
        'According to current FDA guidelines, you need to ensure proper validation protocols are implemented with detailed documentation.',
        'The FICA compliance framework suggests implementing robust security measures with regular auditing and monitoring.',
        'For regulatory compliance, please consider comprehensive documentation requirements and staff training programs.',
        'FDA regulations require systematic approach to quality management and continuous monitoring of compliance metrics.',
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages((prev) => [...prev, { type: 'bot', content: randomResponse }]);

      // Update query count
      const updatedUser = { ...user, queriesUsed: user.queriesUsed + 1 };
      setUser(updatedUser);

      setUserDatabase((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: 'Sorry, an error occurred. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-red-400';
      case 'pro':
        return 'text-yellow-400';
      case 'explorer':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Settings className="w-4 h-4" />;
      case 'pro':
        return <Crown className="w-4 h-4" />;
      case 'explorer':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // LOGIN/SIGNUP VIEW
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">FICA-FDA Compliance</h1>
            <p className="text-gray-300">AI-Powered Compliance Assistant</p>
          </div>
          {showSignup ? (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="w-full mb-3 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full mb-3 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full mb-5 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg mb-2 transition duration-200"
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>
              <p
                className="text-sm text-gray-300 mt-2 cursor-pointer hover:underline"
                onClick={() => setShowSignup(false)}
              >
                Already have an account? Log In
              </p>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full mb-3 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full mb-5 p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg mb-2 transition duration-200"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
              <p
                className="text-sm text-gray-300 mt-2 cursor-pointer hover:underline"
                onClick={() => setShowSignup(true)}
              >
                Don't have an account? Sign Up
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // UPGRADE VIEW
  if (currentView === 'upgrade') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Upgrade to Pro</h2>
          <p className="text-gray-300 mb-6">
            Get unlimited queries, advanced AI features, and priority support.
          </p>
          <button
            onClick={processUpgrade}
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg mb-3 transition duration-200"
          >
            {isLoading ? 'Processing...' : 'Upgrade to Pro ₹399 / month'}
          </button>
          <button
            onClick={() => setCurrentView('chat')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  if (currentView === 'admin') {
    const canManageUsers = getUserLimits(user.role).canManageUsers;

    return (
      <div className="min-h-screen bg-gray-900 p-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
        {canManageUsers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userDatabase.map((u) => (
              <div
                key={u.id}
                className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  {getRoleIcon(u.role)}
                  <span className={`font-bold ${getRoleColor(u.role)}`}>{u.name}</span>
                </div>
                <p className="text-gray-300 text-sm">{u.email}</p>
                <p className="text-gray-400 text-xs">Role: {u.role}</p>
                <p className="text-gray-400 text-xs">
                  Queries Used: {u.queriesUsed}{' '}
                  {getUserLimits(u.role).maxQueries !== -1
                    ? `/ ${getUserLimits(u.role).maxQueries}`
                    : '/ Unlimited'}
                </p>
                <div className="flex gap-2 mt-2">
                  {['explorer', 'pro', 'admin'].map((roleOption) => (
                    <button
                      key={roleOption}
                      onClick={() => updateUserRole(u.id, roleOption)}
                      className={`px-2 py-1 rounded text-sm ${
                        u.role === roleOption
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      }`}
                    >
                      {roleOption}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You do not have permission to manage users.</p>
        )}
      </div>
    );
  }

  // CHAT VIEW
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <span className="font-bold">{user.name}</span>
          <span className={`ml-2 ${getRoleColor(user.role)}`}>{user.role.toUpperCase()}</span>
        </div>
        <div className="flex gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm font-bold"
            >
              Admin
            </button>
          )}
          {user.role === 'explorer' && (
            <button
              onClick={handleUpgradeRequest}
              className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded-lg text-sm font-bold"
            >
              Upgrade
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-xl p-3 rounded-lg ${
              msg.type === 'user' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="max-w-xl p-3 rounded-lg bg-gray-600 self-start animate-pulse">
            Thinking...
          </div>
        )}
      </main>
      <footer className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          className="flex-1 p-3 rounded-lg bg-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg"
        >
          <Send className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
};

export default App;
