/**
 * Dashboard Page
 * Main landing page after login
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Task Management System</h1>
          <div className="user-menu">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome back, {user?.name}!</h2>
          <p>You are logged in as <span className="role-badge">{user?.role || user?.customRole}</span></p>
        </div>

        <div className="action-cards">
          {isAdmin() && (
            <div className="action-card" onClick={() => navigate('/tasks')}>
              <div className="card-icon">📋</div>
              <h3>All Tasks</h3>
              <p>View and manage all tasks in the system</p>
            </div>
          )}

          <div className="action-card" onClick={() => navigate('/tasks/assigned')}>
            <div className="card-icon">✅</div>
            <h3>My Tasks</h3>
            <p>View tasks assigned to you</p>
          </div>

          {isAdmin() && (
            <div className="action-card" onClick={() => navigate('/tasks/create')}>
              <div className="card-icon">➕</div>
              <h3>Create Task</h3>
              <p>Create a new task and assign to team members</p>
            </div>
          )}
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <h4>Your Role</h4>
            <p className="stat-value">{user?.role || user?.customRole}</p>
          </div>
          <div className="stat-card">
            <h4>Email</h4>
            <p className="stat-value">{user?.email}</p>
          </div>
          <div className="stat-card">
            <h4>User ID</h4>
            <p className="stat-value">{user?.userId?.substring(0, 8)}...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
