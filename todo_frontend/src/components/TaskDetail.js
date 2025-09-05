import React from "react";
import SubtaskList from "./SubtaskList";

/**
 * TaskDetail shows task content, metadata and subtasks with actions.
 *
 * Props:
 * - task: Task | null
 * - onEdit: () => void
 * - onDelete: () => void
 * - onToggleComplete: () => void
 * - subtasks: Array<Subtask>
 * - subtaskHandlers: { onAdd, onUpdate, onDelete, onToggleComplete }
 */
export default function TaskDetail({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  subtasks = [],
  subtaskHandlers = {},
}) {
  if (!task) {
    return (
      <div className="main-panel empty-state">
        <div>Select a task to view details</div>
      </div>
    );
  }

  const { onAdd, onUpdate, onDelete: onDeleteSub, onToggleComplete: onToggleSub } = subtaskHandlers;

  return (
    <div className="main-panel">
      <header className="detail-header">
        <div className="detail-title-block">
          <h2 className={`detail-title ${task.completed ? "completed" : ""}`}>{task.title}</h2>
          <div className="detail-meta">
            {task.priority ? <span className={`pill ${task.priority}`}>{task.priority}</span> : null}
            {task.due_date ? <span className="meta">Due: {fmtDate(task.due_date)}</span> : null}
            {task.eta ? <span className="meta">ETA: {task.eta}h</span> : null}
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
          <button className="btn btn-primary" onClick={onToggleComplete}>
            {task.completed ? "Mark Incomplete" : "Mark Complete"}
          </button>
        </div>
      </header>

      {task.description ? <p className="detail-desc">{task.description}</p> : null}

      <SubtaskList
        subtasks={subtasks}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDeleteSub}
        onToggleComplete={onToggleSub}
      />
    </div>
  );
}

function fmtDate(d) {
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString();
  } catch {
    return String(d);
  }
}
