import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { 
  LogOut, 
  Plus, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo
} from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, userRole, isAdmin, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    // Store token in sessionStorage for API client
    const storeToken = async () => {
      try {
        const { fetchAuthSession } = await import('@aws-amplify/auth');
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          sessionStorage.setItem('idToken', token);
        }
      } catch (error) {
        console.error('Error storing token:', error);
      }
    };
    storeToken();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const result = await taskService.getTasks();
    if (result.success) {
      setTasks(result.data.tasks || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'OPEN').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    closed: tasks.filter(t => t.status === 'CLOSED').length
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <nav className="dashboard-nav">
            <div className="dashboard-logo">
              <div className="dashboard-logo-icon">
                <ListTodo size={24} />
              </div>
              <span>Task Manager</span>
            </div>

            <div className="dashboard-user">
              <div className="user-info">
                <div className="user-name">{user?.signInDetails?.loginId || user?.username}</div>
                <div className="user-role">
                  <span className={`role-badge ${userRole?.toLowerCase()}`}>
                    {userRole}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="container">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card" onClick={() => setFilterStatus('ALL')}>
              <div className="stat-icon total">
                <ListTodo size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => setFilterStatus('OPEN')}>
              <div className="stat-icon open">
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.open}</div>
                <div className="stat-label">Open</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => setFilterStatus('IN_PROGRESS')}>
              <div className="stat-icon progress">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => setFilterStatus('CLOSED')}>
              <div className="stat-icon closed">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.closed}</div>
                <div className="stat-label">Closed</div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-actions">
              <div className="filter-group">
                <Filter size={18} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Tasks</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {isAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={18} />
                  Create Task
                </button>
              )}
            </div>
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--gray-200)', borderTopColor: 'var(--primary)' }}></div>
              <p>Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <ListTodo size={64} strokeWidth={1} />
              <h3>No tasks found</h3>
              <p>
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your search or filter'
                  : isAdmin
                  ? 'Create your first task to get started'
                  : 'No tasks have been assigned to you yet'}
              </p>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  onUpdate={handleTaskUpdated}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
