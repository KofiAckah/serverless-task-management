/**
 * Register Page
 * New user registration with email confirmation
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/helpers';
import { USER_ROLES } from '../../config';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { signup, confirmSignup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.MEMBER,
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    
    const { confirmPassword, ...signupData } = formData;
    const result = await signup(signupData);
    setLoading(false);

    if (result.success) {
      setNeedsConfirmation(true);
    } else {
      setErrors({ general: result.error });
    }
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();
    
    if (!confirmationCode) {
      setErrors({ confirmation: 'Confirmation code is required' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    const result = await confirmSignup(formData.email, confirmationCode);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setErrors({ confirmation: result.error });
    }
  };

  // Success state
  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-message">
            <h2>✓ Account Confirmed!</h2>
            <p>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation code entry
  if (needsConfirmation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Verify Your Email</h1>
          <p className="auth-subtitle">
            We've sent a verification code to <strong>{formData.email}</strong>
          </p>

          {errors.confirmation && (
            <div className="error-message">{errors.confirmation}</div>
          )}

          <form onSubmit={handleConfirmation}>
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="123456"
                className={errors.confirmation ? 'error' : ''}
                autoFocus
              />
              {errors.confirmation && (
                <span className="error-text">{errors.confirmation}</span>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <p className="auth-footer">
            Didn't receive the code? Check your spam folder or{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setNeedsConfirmation(false); }}>
              try again
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join the task management system</p>

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@amalitech.com"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
            <small style={{ color: '#718096', fontSize: '12px' }}>
              Use @amalitech.com or @amalitechtraining.org
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value={USER_ROLES.MEMBER}>Member</option>
              <option value={USER_ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
