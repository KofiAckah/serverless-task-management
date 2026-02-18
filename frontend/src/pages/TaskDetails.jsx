import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import {
  ArrowLeft,
  Calendar,
  User,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Flag
} from 'lucide-react';
import './TaskDetails.css';

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedTask, setEditedTask] = useState({});
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadTask();
    if (isAdmin) {
      loadUsers();
    }
  }, [id, isAdmin]);

  const loadTask = async () => {
    setLoading(true);
    const result = await taskService.getTasks();
    if (result.success) {
      const foundTask = result.data.tasks.find(t => t.taskId === id);
      if (foundTask) {
        setTask(foundTask);
        setEditedTask(foundTask);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const result = await userService.getUsers();
    if (result.success) {
      setUsers(result.data.users || []);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setSaving(true);
    const result = await taskService.updateTask(id, { status: newStatus });
    if (result.success) {
      setTask({ ...task, status: newStatus });
    } else {
      alert(result.message || 'Failed to update status');
    }
    setSaving(false);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    const updates = {
      title: editedTask.title,
      description: editedTask.description,
      priority: editedTask.priority,
      dueDate: editedTask.dueDate,
      status: editedTask.status
    };

    // Include assignments if admin
    if (isAdmin) {
      updates.assignedTo = selectedUsers;
    }

    const result = await taskService.updateTask(id, updates);
    if (result.success) {
      setTask(editedTask);
      setEditMode(false);
      // Reset selected users after save
      setSelectedUsers([]);
    } else {
      alert(result.message || 'Failed to save changes');
    }
    setSaving(false);
  };

  const handleUserSelection = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const selected = options.map(option => option.value);
    setSelectedUsers(selected);
  };

  const handleCancelEdit = () => {
    setEditedTask(task);
    setEditMode(false);
  };

  const handleCloseTask = async () => {
    if (window.confirm('Are you sure you want to close this task?')) {
      setSaving(true);
      const result = await taskService.closeTask(id);
      if (result.success) {
        setTask({ ...task, status: 'CLOSED' });
      } else {
        alert(result.message || 'Failed to close task');
      }
      setSaving(false);
    }
  };

  const isAssignedToUser = () => {
    if (!task || !user) return false;
    const userEmail = user.signInDetails?.loginId || user.username;
    return task.assignedTo?.includes(userEmail);
  };

  const canUpdateStatus = () => {
    return isAdmin || isAssignedToUser();
  };

  const canEditTask = () => {
    return isAdmin;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'IN_PROGRESS': return 'status-progress';
      case 'CLOSED': return 'status-closed';
      default: return '';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="task-details-loading">
        <div className="spinner"></div>
        <p>Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-details-error">
        <p>Task not found</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="task-details">
      <div className="task-details-container">
        {/* Header */}
        <div className="task-details-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="header-actions">
            {!editMode && canEditTask() && (
              <button
                onClick={() => setEditMode(true)}
                className="btn btn-secondary"
                disabled={saving}
              >
                <Edit2 size={18} />
                Edit Task
              </button>
            )}
            {editMode && (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Task Content */}
        <div className="task-details-content">
          {/* Title Section */}
          <div className="task-section">
            {editMode ? (
              <input
                type="text"
                className="task-title-input"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                placeholder="Task title"
              />
            ) : (
              <h1 className="task-title">{task.title}</h1>
            )}
          </div>

          {/* Meta Information */}
          <div className="task-meta">
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              {editMode ? (
                <select
                  className={`status-badge ${getStatusColor(editedTask.status)}`}
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="CLOSED">Closed</option>
                </select>
              ) : (
                <span className={`status-badge ${getStatusColor(task.status)}`}>
                  {task.status === 'IN_PROGRESS' ? 'In Progress' : task.status}
                </span>
              )}
            </div>

            <div className="meta-item">
              <span className="meta-label">Priority:</span>
              {editMode ? (
                <select
                  className={`priority-badge ${getPriorityColor(editedTask.priority)}`}
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              ) : (
                <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                  <Flag size={14} />
                  {task.priority}
                </span>
              )}
            </div>

            <div className="meta-item">
              <Calendar size={16} />
              <span className="meta-label">Due Date:</span>
              {editMode ? (
                <input
                  type="date"
                  className="date-input"
                  value={editedTask.dueDate || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                />
              ) : (
                <span>{formatDate(task.dueDate)}</span>
              )}
            </div>

            <div className="meta-item">
              <User size={16} />
              <span className="meta-label">Created by:</span>
              <span>{task.createdByName || task.createdByEmail || 'Unknown'}</span>
            </div>

            {task.closedByName && (
              <div className="meta-item">
                <User size={16} />
                <span className="meta-label">Closed by:</span>
                <span>{task.closedByName}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="task-section">
            <h2 className="section-title">Description</h2>
            {editMode ? (
              <textarea
                className="task-description-input"
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                placeholder="Task description"
                rows={6}
              />
            ) : (
              <p className="task-description">{task.description || 'No description provided'}</p>
            )}
          </div>

          {/* Assignment Management - Admin in Edit Mode */}
          {editMode && isAdmin && (
            <div className="task-section">
              <h2 className="section-title">
                <Users size={18} />
                Assign To Users
              </h2>
              <select
                multiple
                className="form-input"
                style={{ minHeight: '150px', width: '100%' }}
                value={selectedUsers}
                onChange={handleUserSelection}
                disabled={saving}
              >
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.name} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
              <small style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
                Hold Ctrl (Cmd on Mac) to select multiple users. Leave empty to unassign all users.
              </small>
            </div>
          )}

          {/* Assignees */}
          {!editMode && task.assignedTo && task.assignedTo.length > 0 && (
            <div className="task-section">
              <h2 className="section-title">
                <Users size={18} />
                Assigned To
              </h2>
              <div className="assignees-list">
                {task.assignedTo.map((email, index) => (
                  <div key={index} className="assignee-item">
                    <User size={16} />
                    <span>{email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Actions */}
          {!editMode && canUpdateStatus() && task.status !== 'CLOSED' && (
            <div className="task-section">
              <h2 className="section-title">Update Status</h2>
              <div className="status-actions">
                {task.status === 'OPEN' && (
                  <button
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    className="btn btn-status"
                    disabled={saving}
                  >
                    <Clock size={18} />
                    Start Task
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus('OPEN')}
                      className="btn btn-status"
                      disabled={saving}
                    >
                      <AlertCircle size={18} />
                      Move to Open
                    </button>
                    {isAdmin && (
                      <button
                        onClick={handleCloseTask}
                        className="btn btn-success"
                        disabled={saving}
                      >
                        <CheckCircle2 size={18} />
                        {saving ? 'Closing...' : 'Close Task'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="task-timestamps">
            <div className="timestamp-item">
              <span className="timestamp-label">Created:</span>
              <span>{new Date(task.createdAt).toLocaleString()}</span>
            </div>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <div className="timestamp-item">
                <span className="timestamp-label">Last Updated:</span>
                <span>{new Date(task.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
