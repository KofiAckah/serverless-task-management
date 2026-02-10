/**
 * Task List Page
 * Display all tasks or assigned tasks based on route
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { formatDate, getStatusColor, getPriorityColor, truncateText, getInitials } from '../../utils/helpers';
import { TASK_STATUS } from '../../config';
import './TaskList.css';

export default function TaskList() {
  const navigate = useNavigate();
  const { type } = useParams(); // 'all' or 'assigned'
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [type]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = type === 'assigned' 
        ? await tasksAPI.getAssigned()
        : await tasksAPI.getAll();
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map(task => 
        task.taskId === taskId ? { ...task, status: newStatus } : task
      ));
      if (selectedTask?.taskId === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleCloseTask = async (taskId) => {
    if (!confirm('Are you sure you want to close this task?')) return;
    
    try {
      await tasksAPI.close(taskId);
      setTasks(tasks.map(task => 
        task.taskId === taskId ? { ...task, status: TASK_STATUS.CLOSED } : task
      ));
      if (selectedTask?.taskId === taskId) {
        setSelectedTask({ ...selectedTask, status: TASK_STATUS.CLOSED });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close task');
    }
  };

  if (loading) {
    return (
      <div className="task-list-container">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      <header className="task-list-header">
        <div className="header-content">
          <div>
            <button onClick={() => navigate('/dashboard')} className="btn-back">
              ← Back to Dashboard
            </button>
            <h1>{type === 'assigned' ? 'My Tasks' : 'All Tasks'}</h1>
            <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
          </div>
          {isAdmin() && type !== 'assigned' && (
            <button onClick={() => navigate('/tasks/create')} className="btn-create">
              + Create Task
            </button>
          )}
        </div>
      </header>

      <main className="task-list-main">
        {error && (
          <div className="error-message">{error}</div>
        )}

        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.taskId} className="task-card" onClick={() => setSelectedTask(task)}>
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <div className="task-badges">
                    <span 
                      className="badge priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                    <span 
                      className="badge status-badge"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>

                <p className="task-description">{truncateText(task.description, 100)}</p>

                <div className="task-footer">
                  <div className="task-meta">
                    <span>📅 {formatDate(task.dueDate)}</span>
                    {task.assignedTo && (
                      <span>👤 {task.assignedToName || 'Assigned'}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTask(null)}>×</button>
            
            <h2>{selectedTask.title}</h2>
            
            <div className="modal-badges">
              <span 
                className="badge priority-badge"
                style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
              >
                {selectedTask.priority}
              </span>
              <span 
                className="badge status-badge"
                style={{ backgroundColor: getStatusColor(selectedTask.status) }}
              >
                {selectedTask.status}
              </span>
            </div>

            <div className="modal-section">
              <h4>Description</h4>
              <p>{selectedTask.description}</p>
            </div>

            <div className="modal-section">
              <h4>Details</h4>
              <div className="detail-grid">
                <div><strong>Due Date:</strong> {formatDate(selectedTask.dueDate)}</div>
                <div><strong>Created:</strong> {formatDate(selectedTask.createdAt)}</div>
                {selectedTask.assignedTo && (
                  <div><strong>Assigned To:</strong> {selectedTask.assignedToName || selectedTask.assignedTo}</div>
                )}
              </div>
            </div>

            {/* Status Update (for members) */}
            {selectedTask.status !== TASK_STATUS.CLOSED && !isAdmin() && (
              <div className="modal-actions">
                <h4>Update Status</h4>
                <div className="status-buttons">
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.taskId, TASK_STATUS.OPEN)}
                    disabled={selectedTask.status === TASK_STATUS.OPEN}
                    className="btn-status"
                  >
                    Open
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.taskId, TASK_STATUS.IN_PROGRESS)}
                    disabled={selectedTask.status === TASK_STATUS.IN_PROGRESS}
                    className="btn-status"
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.taskId, TASK_STATUS.DONE)}
                    disabled={selectedTask.status === TASK_STATUS.DONE}
                    className="btn-status"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Close Task (for admins) */}
            {isAdmin() && selectedTask.status !== TASK_STATUS.CLOSED && (
              <div className="modal-actions">
                <button 
                  onClick={() => handleCloseTask(selectedTask.taskId)}
                  className="btn-danger"
                >
                  Close Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
