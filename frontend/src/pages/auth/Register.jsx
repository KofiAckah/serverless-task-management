import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Key } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('register'); // 'register' or 'confirm'
  const [confirmationCode, setConfirmationCode] = useState('');
  
  const { register, confirmRegistration, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Email domain validation
    const validDomains = ['amalitech.com', 'amalitechtraining.org'];
    const emailDomain = formData.email.split('@')[1];
    if (!validDomains.includes(emailDomain)) {
      setError('Please use your @amalitech.com or @amalitechtraining.org email');
      setLoading(false);
      return;
    }

    const result = await register(formData.email, formData.password, formData.name);
    
    if (result.success) {
      setSuccess('Registration successful! Please check your email for confirmation code.');
      setStep('confirm');
    } else {
      setError(result.message || 'Registration failed');
    }
    
    setLoading(false);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!confirmationCode) {
      setError('Please enter the confirmation code');
      setLoading(false);
      return;
    }

    const result = await confirmRegistration(formData.email, confirmationCode);
    
    if (result.success) {
      setSuccess('Email confirmed successfully! Logging you in...');
      // Auto-login after confirmation
      const loginResult = await login(formData.email, formData.password);
      if (loginResult.success) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError('Confirmation successful. Please login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } else {
      setError(result.message || 'Confirmation failed');
    }
    
    setLoading(false);
  };

  if (step === 'confirm') {
    return (
      <div className="auth-container app">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Key size={32} />
            </div>
            <h1 className="auth-title">Confirm Your Email</h1>
            <p className="auth-subtitle">Enter the code sent to {formData.email}</p>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleConfirm}>
            <div className="form-group">
              <label className="form-label" htmlFor="code">
                Confirmation Code
              </label>
              <input
                id="code"
                type="text"
                className="form-input"
                placeholder="Enter 6-digit code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                disabled={loading}
                maxLength="6"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Confirm Email
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container app">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlus size={32} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the task management system</p>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-message" style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              <User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              className="form-input"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <Mail size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="your.name@amalitech.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
              required
            />
            <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
              Use your @amalitech.com or @amalitechtraining.org email
            </small>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className="form-input"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
