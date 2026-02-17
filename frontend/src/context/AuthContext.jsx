import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signIn, 
  signUp, 
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const groups = session.tokens?.idToken?.payload['cognito:groups'] || [];
      
      setUser(currentUser);
      setIdToken(token);
      setUserRole(groups.includes('Admins') ? 'Admin' : 'Member');
    } catch (error) {
      setUser(null);
      setIdToken(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { isSignedIn, nextStep } = await signIn({ 
        username: email, 
        password 
      });

      if (isSignedIn) {
        await checkAuthStatus();
        return { success: true };
      }

      return { 
        success: false, 
        message: 'Sign in incomplete', 
        nextStep 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name
          },
          autoSignIn: true
        }
      });

      return { 
        success: true, 
        userId,
        isSignUpComplete,
        nextStep 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  };

  const confirmRegistration = async (email, code) => {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: code
      });

      return { 
        success: true,
        isSignUpComplete,
        nextStep
      };
    } catch (error) {
      console.error('Confirmation error:', error);
      return { 
        success: false, 
        message: error.message || 'Confirmation failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setIdToken(null);
      setUserRole(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { 
        success: false, 
        message: error.message || 'Logout failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    idToken,
    userRole,
    isAuthenticated: !!user,
    isAdmin: userRole === 'Admin',
    isMember: userRole === 'Member',
    login,
    register,
    confirmRegistration,
    logout,
    refreshAuth: checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
