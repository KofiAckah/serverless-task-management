import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { X, Plus, Calendar, Flag, FileText, Users } from 'lucide-react';
import './CreateTaskModal.css';

const CreateTaskModal = ({ onClose, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const result = await userService.getUsers();
    if (result.success) {
      setUsers(result.data.users || []);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUserSelection = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const selected = options.map(option => option.value);
    setSelectedUsers(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || '',
      priority: formData.priority,
      status: 'OPEN',
      assignedTo: selectedUsers
    };

    if (formData.dueDate) {
      taskData.dueDate = new Date(formData.dueDate).toISOString();
    }

    const result = await taskService.createTask(taskData);

    if (result.success) {
      onTaskCreated();
    } else {
      setError(result.message || 'Failed to create task');
    }

    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <FileText size={16} />
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={16} />
                Description
              </label>
              <textarea
                name="description"
                className="form-input"
                placeholder="Enter task description (optional)"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Users size={16} />
                Assign To (optional)
              </label>
              <select
                multiple
                className="form-input"
                style={{ minHeight: '100px' }}
                value={selectedUsers}
                onChange={handleUserSelection}
                disabled={loading}
              >
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <small style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Hold Ctrl (Cmd on Mac) to select multiple users
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <Flag size={16} />
                  Priority
                </label>
                <select
                  name="priority"
                  className="form-input"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} />
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  name="dueDate"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={handleChange}
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
