import React, { useMemo } from "react";

/**
 * TaskFilters renders sidebar controls for searching, sorting and filtering tasks.
 *
 * Props:
 * - filters: { search: string, sort: string, priorities: string[], dueWithinDays: number | '' }
 * - onChange: (partialFilters) => void
 * - onCreateTask: () => void
 * - onRefresh: () => void
 */
export default function TaskFilters({ filters, onChange, onCreateTask, onRefresh }) {
  const { search = "", sort = "", priorities = [], dueWithinDays = "" } = filters || {};

  const sortOptions = useMemo(
    () => [
      { value: "", label: "— No sorting —" },
      { value: "priority", label: "Priority" },
      { value: "due_date", label: "Due date" },
      { value: "eta", label: "Est. time" },
    ],
    []
  );

  const allPriorities = ["low", "medium", "high", "critical"];

  const togglePriority = (p) => {
    const set = new Set(priorities);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    onChange({ priorities: Array.from(set) });
  };

  const handleDueDays = (v) => {
    const n = v === "" ? "" : Math.max(0, Number(v) || 0);
    onChange({ dueWithinDays: n });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Filters</h2>
        <div className="sidebar-actions">
          <button className="btn btn-secondary" onClick={onRefresh} aria-label="Refresh tasks">
            ⟳
          </button>
          <button className="btn btn-primary" onClick={onCreateTask}>
            + New Task
          </button>
        </div>
      </div>

      <div className="filter-group">
        <label className="input-label">
          Search
          <input
            className="input"
            type="text"
            value={search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search tasks..."
          />
        </label>
      </div>

      <div className="filter-group">
        <label className="input-label">
          Sort by
          <select
            className="input"
            value={sort}
            onChange={(e) => onChange({ sort: e.target.value })}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-group">
        <div className="input-label">Priority</div>
        <div className="priority-chips">
          {allPriorities.map((p) => {
            const active = priorities.includes(p);
            return (
              <button
                type="button"
                key={p}
                className={`chip ${p} ${active ? "active" : ""}`}
                onClick={() => togglePriority(p)}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-group">
        <label className="input-label">
          Due within (days)
          <input
            className="input"
            type="number"
            min="0"
            value={dueWithinDays}
            onChange={(e) => handleDueDays(e.target.value)}
            placeholder="e.g. 7"
          />
        </label>
      </div>
    </aside>
  );
}
