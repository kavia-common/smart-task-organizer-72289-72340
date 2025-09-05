import React from "react";

/**
 * TaskList displays the list of tasks with completion toggles and selection.
 *
 * Props:
 * - tasks: Array<Task>
 * - onSelect: (task) => void
 * - onToggleComplete: (task) => void
 * - selectedId: string | number | null
 */
export default function TaskList({ tasks = [], onSelect, onToggleComplete, selectedId = null }) {
  return (
    <div className="tasklist">
      {(!tasks || tasks.length === 0) ? (
        <div className="empty">No tasks found</div>
      ) : (
        tasks.map((t) => (
          <div
            key={t.id}
            className={`tasklist-item ${selectedId === t.id ? "selected" : ""}`}
            onClick={() => onSelect && onSelect(t)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect && onSelect(t);
              }
            }}
          >
            <div className="task-main">
              <input
                type="checkbox"
                checked={!!t.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleComplete && onToggleComplete(t);
                }}
                aria-label={`Mark ${t.title} ${t.completed ? "incomplete" : "complete"}`}
              />
              <div className="task-titlegroup">
                <div className={`task-title ${t.completed ? "completed" : ""}`}>{t.title}</div>
                <div className="task-subtitle">
                  {t.priority ? <span className={`pill ${t.priority}`}>{t.priority}</span> : null}
                  {t.due_date ? <span className="meta">Due: {fmtDate(t.due_date)}</span> : null}
                  {t.eta ? <span className="meta">ETA: {t.eta}h</span> : null}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
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
