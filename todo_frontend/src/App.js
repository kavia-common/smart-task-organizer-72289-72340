import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import api, { ApiError } from "./api/client";
import Login from "./components/Login";
import TaskFilters from "./components/TaskFilters";
import TaskList from "./components/TaskList";
import TaskDetail from "./components/TaskDetail";
import TaskForm from "./components/TaskForm";

// PUBLIC_INTERFACE
/**
 * App is the main entrypoint responsible for:
 * - Session handling (login/logout/me)
 * - Fetching and rendering tasks with search/sort/filter
 * - CRUD actions for tasks and subtasks
 * - Responsive layout: sidebar (filters/list) + main panel (details/form)
 * - Dark theme support via data-theme
 */
function App() {
  // Theme state (default to dark per project requirements)
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Session and app states
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState(null);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    sort: "",
    priorities: [],
    dueWithinDays: "",
  });

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  // Helpers
  const showError = (e) => {
    const message =
      e instanceof ApiError
        ? e.data?.message || e.message || "Request failed"
        : e?.message || "Something went wrong";
    setError(message);
    clearAfter(() => setError(null), 4000);
  };

  const showFlash = (msg) => {
    setFlash(msg);
    clearAfter(() => setFlash(null), 2500);
  };

  function clearAfter(fn, ms) {
    setTimeout(fn, ms);
  }

  // Session: load current user
  useEffect(() => {
    (async () => {
      try {
        const me = await api.currentUser();
        if (me && me.user) {
          setUser(me.user);
        } else if (me) {
          setUser(me);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  // Load tasks based on filters
  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: filters.search || undefined,
        sort: filters.sort || undefined,
        priority: (filters.priorities || []).length ? filters.priorities : undefined,
        due_within_days:
          filters.dueWithinDays === "" ? undefined : Number(filters.dueWithinDays),
      };
      const list = await api.getTasks(params);
      setTasks(Array.isArray(list) ? list : list?.items || []);
      // if selected no longer exists, clear selection
      if (selectedTaskId && !list.find?.((t) => t.id === selectedTaskId)) {
        setSelectedTaskId(null);
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [user, filters, selectedTaskId]);

  // When user or filters change, refresh
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, loadTasks]);

  // Load subtasks for selected task
  const loadSubtasks = useCallback(async () => {
    if (!selectedTaskId) {
      setSubtasks([]);
      return;
    }
    try {
      const items = await api.listSubtasks(selectedTaskId);
      setSubtasks(Array.isArray(items) ? items : items?.items || []);
    } catch (e) {
      showError(e);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (selectedTaskId) {
      loadSubtasks();
    }
  }, [selectedTaskId, loadSubtasks]);

  // Auth Handlers
  // PUBLIC_INTERFACE
  const handleLogin = async (username, password) => {
    setAuthError(null);
    try {
      await api.login(username, password);
      const me = await api.currentUser();
      setUser(me?.user || me || null);
      showFlash("Welcome back!");
    } catch (e) {
      setAuthError(
        e instanceof ApiError && e.status === 401
          ? "Invalid credentials"
          : e.message || "Login failed"
      );
    }
  };

  // PUBLIC_INTERFACE
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setTasks([]);
      setSelectedTaskId(null);
      setSubtasks([]);
      setShowTaskForm(false);
      setEditingTask(null);
    }
  };

  // Filter change
  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));

  // Task Actions
  const startCreateTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const startEditTask = () => {
    if (!selectedTask) return;
    setEditingTask(selectedTask);
    setShowTaskForm(true);
  };

  const cancelForm = () => {
    setEditingTask(null);
    setShowTaskForm(false);
  };

  const saveTask = async (data) => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, data);
        showFlash("Task updated");
      } else {
        await api.createTask(data);
        showFlash("Task created");
      }
      setShowTaskForm(false);
      setEditingTask(null);
      await loadTasks();
    } catch (e) {
      showError(e);
    }
  };

  const deleteTask = async () => {
    if (!selectedTask) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.deleteTask(selectedTask.id);
      showFlash("Task deleted");
      setSelectedTaskId(null);
      await loadTasks();
      setSubtasks([]);
    } catch (e) {
      showError(e);
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      await api.markTaskComplete(task.id, !task.completed);
      await loadTasks();
      if (selectedTaskId === task.id) await loadSubtasks();
    } catch (e) {
      showError(e);
    }
  };

  // Subtask actions
  const addSubtask = async (title) => {
    if (!selectedTask) return;
    try {
      await api.createSubtask(selectedTask.id, { title });
      await loadSubtasks();
      showFlash("Subtask added");
    } catch (e) {
      showError(e);
    }
  };

  const updateSubtask = async (subtask, data) => {
    if (!selectedTask) return;
    try {
      await api.updateSubtask(selectedTask.id, subtask.id, data);
      await loadSubtasks();
      showFlash("Subtask updated");
    } catch (e) {
      showError(e);
    }
  };

  const deleteSubtask = async (subtask) => {
    if (!selectedTask) return;
    if (!window.confirm("Delete this subtask?")) return;
    try {
      await api.deleteSubtask(selectedTask.id, subtask.id);
      await loadSubtasks();
      showFlash("Subtask deleted");
    } catch (e) {
      showError(e);
    }
  };

  const toggleSubtaskComplete = async (subtask) => {
    if (!selectedTask) return;
    try {
      await api.markSubtaskComplete(selectedTask.id, subtask.id, !subtask.completed);
      await loadSubtasks();
    } catch (e) {
      showError(e);
    }
  };

  // UI
  if (loadingUser) {
    return <div className="App loading-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="App">
        <header className="topbar">
          <div className="brand">Smart Task Organizer</div>
          <div className="topbar-actions">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </header>
        <Login onLogin={handleLogin} loading={false} error={authError} />
      </div>
    );
  }

  return (
    <div className="App">
      <header className="topbar">
        <div className="brand">Smart Task Organizer</div>
        <div className="topbar-actions">
          <span className="user">Hi, {user.username || user.name || "User"}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <div className="layout">
        <TaskFilters
          filters={filters}
          onChange={updateFilters}
          onCreateTask={startCreateTask}
          onRefresh={loadTasks}
        />

        <section className="content">
          <div className="panel">
            <div className="panel-header">
              <h2>Tasks</h2>
              {loading ? <div className="spinner" aria-label="loading" /> : null}
            </div>
            <TaskList
              tasks={tasks}
              selectedId={selectedTaskId}
              onSelect={(t) => setSelectedTaskId(t.id)}
              onToggleComplete={toggleTaskComplete}
            />
          </div>

          <div className="panel">
            {showTaskForm ? (
              <TaskForm initial={editingTask} onCancel={cancelForm} onSave={saveTask} />
            ) : (
              <TaskDetail
                task={selectedTask}
                onEdit={startEditTask}
                onDelete={deleteTask}
                onToggleComplete={() => selectedTask && toggleTaskComplete(selectedTask)}
                subtasks={subtasks}
                subtaskHandlers={{
                  onAdd: addSubtask,
                  onUpdate: updateSubtask,
                  onDelete: deleteSubtask,
                  onToggleComplete: toggleSubtaskComplete,
                }}
              />
            )}
          </div>
        </section>
      </div>

      {error ? <div className="toast error">{error}</div> : null}
      {flash ? <div className="toast success">{flash}</div> : null}
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="btn btn-secondary"
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default App;
