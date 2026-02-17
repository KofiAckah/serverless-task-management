import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { 
  Calendar, 
  Flag, 
  CheckCircle2, 
  XCircle,
  Edit3,
  Trash2,
  Play,
  User,
  MoreVertical,
  Eye
} from 'lucide-react';
import './TaskCard.css';

const TaskCard = ({ task, onUpdate, isAdmin }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status
  });

  const handleViewDetails = () => {
    navigate(`/tasks/${task.taskId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      OPEN: { text: 'Open', className: 'badge-open' },
      IN_PROGRESS: { text: 'In Progress', className: 'badge-progress' },
      CLOSED: { text: 'Closed', className: 'badge-closed' }
    };
    return badges[status] || badges.OPEN;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      LOW: { text: 'Low', className: 'priority-low' },
      MEDIUM: { text: 'Medium', className: 'priority-medium' },
      HIGH: { text: 'High', className: 'priority-high' }
    };
    return badges[priority] || badges.MEDIUM;
  };

  const handleStatusChange = async (newStatus) => {
    if (task.status === 'CLOSED') return;

    setLoading(true);
    let result;

    if (newStatus === 'CLOSED') {
      result = await taskService.closeTask(task.taskId);
    } else {
      result = await taskService.updateTask(task.taskId, { status: newStatus });
    }

    if (result.success) {
      onUpdate();
    }
    setLoading(false);
    setShowMenu(false);
  };

  const handleUpdate = async () => {
    setLoading(true);
    const result = await taskService.updateTask(task.taskId, editData);
    if (result.success) {
      setEditing(false);
      onUpdate();
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusBadge = getStatusBadge(task.status);
  const priorityBadge = getPriorityBadge(task.priority);

  if (editing) {
    return (
      <div className="task-card editing">
        <input
          type="text"
          className="edit-input"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          placeholder="Task title"
        />
        <textarea
          className="edit-textarea"
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          placeholder="Task description"
          rows="3"
        />
        <div className="edit-controls">
          <select
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
          <select
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div className="edit-actions">
          <button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-card ${task.status.toLowerCase()}`}>
      <div className="task-card-header">
        <div className="task-badges">
          <span className={`status-badge ${statusBadge.className}`}>
            {statusBadge.text}
          </span>
          <span className={`priority-badge ${priorityBadge.className}`}>
            <Flag size={12} />
            {priorityBadge.text}
          </span>
        </div>
        
        {task.status !== 'CLOSED' && (
          <div className="task-menu">
            <button
              className="menu-trigger"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                {task.status === 'OPEN' && (
                  <button onClick={() => handleStatusChange('IN_PROGRESS')}>
                    <Play size={16} />
                    Start Task
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button onClick={() => handleStatusChange('CLOSED')}>
                    <CheckCircle2 size={16} />
                    Close Task
                  </button>
                )}
                <button onClick={() => { setEditing(true); setShowMenu(false); }}>
                  <Edit3 size={16} />
                  Edit Task
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="task-card-body">
        <h3 className="task-title">{task.title}</h3>
        <p className="task-description">{task.description || 'No description provided'}</p>
      </div>

      <div className="task-card-footer">
        <div className="task-meta">
          <div className="meta-item">
            <Calendar size={14} />
            <span>{formatDate(task.dueDate)}</span>
          </div>
          <div className="meta-item">
            <User size={14} />
            <span>Created by: {task.createdByName || task.createdByEmail}</span>
          </div>
          {task.closedByName && (
            <div className="meta-item">
              <User size={14} />
              <span>Closed by: {task.closedByName}</span>
            </div>
          )}
        </div>
        <button className="view-details-btn" onClick={handleViewDetails}>
          <Eye size={16} />
          View Details
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
