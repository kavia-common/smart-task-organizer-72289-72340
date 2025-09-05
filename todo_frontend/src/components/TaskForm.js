import React, { useEffect, useState } from "react";

/**
 * TaskForm handles create and edit of tasks.
 *
 * Props:
 * - initial: Task | null
 * - onCancel: () => void
 * - onSave: (data) => Promise<void>
 */
export default function TaskForm({ initial = null, onCancel, onSave }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    eta: "",
    due_date: "",
    completed: false,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        description: initial.description || "",
        priority: initial.priority || "medium",
        eta: initial.eta ?? "",
        due_date: initial.due_date ? toInputDate(initial.due_date) : "",
        completed: !!initial.completed,
      });
    }
  }, [initial]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      eta: form.eta === "" ? null : Number(form.eta),
      due_date: form.due_date || null,
    };
    await onSave(payload);
  };

  const isEdit = !!initial;

  return (
    <form className="task-form" onSubmit={submit}>
      <h3>{isEdit ? "Edit Task" : "New Task"}</h3>
      <label className="input-label">
        Title
        <input
          className="input"
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Task title"
          required
        />
      </label>
      <label className="input-label">
        Description
        <textarea
          className="input textarea"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Describe the task..."
          rows={4}
        />
      </label>
      <div className="grid-2">
        <label className="input-label">
          Priority
          <select
            className="input"
            value={form.priority}
            onChange={(e) => update({ priority: e.target.value })}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
        </label>
        <label className="input-label">
          ETA (hours)
          <input
            className="input"
            type="number"
            min="0"
            step="0.5"
            value={form.eta}
            onChange={(e) => update({ eta: e.target.value })}
            placeholder="e.g. 2"
          />
        </label>
      </div>
      <div className="grid-2">
        <label className="input-label">
          Due date
          <input
            className="input"
            type="date"
            value={form.due_date}
            onChange={(e) => update({ due_date: e.target.value })}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.completed}
            onChange={(e) => update({ completed: e.target.checked })}
          />
          Completed
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {isEdit ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </form>
  );
}

function toInputDate(d) {
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    // Format yyyy-mm-dd
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}
