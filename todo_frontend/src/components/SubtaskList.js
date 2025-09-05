import React, { useState } from "react";

/**
 * SubtaskList manages subtasks list, add, edit, delete and complete toggle.
 *
 * Props:
 * - subtasks: Array<Subtask>
 * - onAdd: (title) => Promise<void>
 * - onUpdate: (subtask, data) => Promise<void>
 * - onDelete: (subtask) => Promise<void>
 * - onToggleComplete: (subtask) => Promise<void>
 */
export default function SubtaskList({ subtasks = [], onAdd, onUpdate, onDelete, onToggleComplete }) {
  const [newTitle, setNewTitle] = useState("");

  const addDisabled = !newTitle.trim();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (addDisabled) return;
    await onAdd(newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="subtasks">
      <h3>Subtasks</h3>

      <form onSubmit={handleAdd} className="subtask-new">
        <input
          className="input"
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask..."
        />
        <button className="btn btn-primary" type="submit" disabled={addDisabled}>
          Add
        </button>
      </form>

      {subtasks.length === 0 ? (
        <div className="empty">No subtasks</div>
      ) : (
        <div className="subtask-list">
          {subtasks.map((s) => (
            <SubtaskRow
              key={s.id}
              subtask={s}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubtaskRow({ subtask, onUpdate, onDelete, onToggleComplete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title || "");

  const save = async () => {
    await onUpdate(subtask, { title });
    setEditing(false);
  };

  return (
    <div className="subtask-row">
      <input
        type="checkbox"
        checked={!!subtask.completed}
        onChange={() => onToggleComplete(subtask)}
        aria-label={`Mark subtask ${subtask.title} ${subtask.completed ? "incomplete" : "complete"}`}
      />
      {editing ? (
        <>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setTitle(subtask.title || "");
                setEditing(false);
              }
            }}
          />
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setTitle(subtask.title || "");
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className={`subtask-title ${subtask.completed ? "completed" : ""}`}>{subtask.title}</div>
          <div className="row-actions">
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => onDelete(subtask)}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
