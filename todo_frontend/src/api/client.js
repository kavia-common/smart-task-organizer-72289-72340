//
// Frontend API Client for Todo App
// - Configurable base URL via REACT_APP_API_BASE
// - Session-aware requests using fetch with credentials
// - PUBLIC_INTERFACE methods for login/logout/current user
// - PUBLIC_INTERFACE CRUD for tasks and subtasks, including mark-complete
//

/**
 * Error type returned by ApiClient on non-2xx responses or parsing failures.
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} [status] - HTTP status code (if available)
   * @param {any} [data] - Parsed response body
   */
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Helper to build query string from an object while skipping null/undefined values.
 * @param {Record<string, any>} params
 * @returns {string}
 */
function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.set(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : "";
}

/**
 * A minimal session-aware API client for the Todo backend.
 * - Uses fetch with credentials: 'include' to support cookie-based sessions.
 * - Reads base URL from process.env.REACT_APP_API_BASE. Fallbacks to '/api'.
 * - Normalizes JSON requests/responses and throws ApiError on error responses.
 */
export class ApiClient {
  /**
   * @param {string} [baseUrl]
   */
  constructor(baseUrl) {
    const envBase = typeof process !== "undefined" ? process.env.REACT_APP_API_BASE : undefined;
    // Use provided baseUrl, else env var, else default '/api'
    this.baseUrl = (baseUrl || envBase || "/api").replace(/\/+$/, "");
  }

  /**
   * Internal: Build a full URL for an API path.
   * @param {string} path
   * @returns {string}
   * @private
   */
  _url(path) {
    const cleaned = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleaned}`;
  }

  /**
   * Internal: Perform a fetch with standard options and JSON handling.
   * @param {string} path - API path starting with "/"
   * @param {RequestInit & { expectJson?: boolean }} [options]
   * @returns {Promise<any>} Parsed JSON or raw text depending on response content-type and expectJson flag.
   * @private
   */
  async _request(path, options = {}) {
    const { expectJson = true, headers, body, ...rest } = options;
    const finalHeaders = new Headers(headers || {});
    // When sending an object body, default to JSON.
    let finalBody = body;
    if (body && typeof body === "object" && !(body instanceof FormData) && !finalHeaders.has("Content-Type")) {
      finalHeaders.set("Content-Type", "application/json");
      finalBody = JSON.stringify(body);
    }
    // Always prefer JSON responses
    if (!finalHeaders.has("Accept")) {
      finalHeaders.set("Accept", "application/json");
    }

    const resp = await fetch(this._url(path), {
      method: "GET",
      credentials: "include",
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });

    const contentType = resp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let data;
    try {
      if (isJson) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        data = expectJson ? { message: text } : text;
      }
    } catch (err) {
      // Response body parse failed
      if (!resp.ok) {
        throw new ApiError(`Request failed with status ${resp.status}`, resp.status);
      }
      throw new ApiError("Failed to parse server response", resp.status);
    }

    if (!resp.ok) {
      const message = (data && (data.message || data.error)) || `Request failed with status ${resp.status}`;
      throw new ApiError(message, resp.status, data);
    }

    return data;
  }

  // =========================
  // Authentication
  // =========================

  // PUBLIC_INTERFACE
  /**
   * Log in the user. Expects backend to set session cookie. Uses credentials: 'include'.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{user: any}>} The current user payload (as provided by backend).
   */
  async login(username, password) {
    return this._request("/auth/login", {
      method: "POST",
      body: { username, password },
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Log out the current session.
   * @returns {Promise<{success: boolean} | any>}
   */
  async logout() {
    return this._request("/auth/logout", {
      method: "POST",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Fetch the currently authenticated user.
   * @returns {Promise<any>} The current user object or null if not authenticated.
   */
  async currentUser() {
    return this._request("/auth/me", {
      method: "GET",
    });
  }

  // =========================
  // Tasks
  // =========================

  // PUBLIC_INTERFACE
  /**
   * Get a list of tasks with optional search/sort/filter query params.
   * @param {Object} [params]
   * @param {string} [params.search]
   * @param {string} [params.sort] - e.g., 'priority', 'due_date', 'eta'
   * @param {string|string[]} [params.priority] - One or more priorities
   * @param {number} [params.due_within_days] - For filtering by due date within X days
   * @returns {Promise<any[]>}
   */
  async getTasks(params = {}) {
    return this._request(`/tasks${toQueryString(params)}`, {
      method: "GET",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single task by ID.
   * @param {string|number} id
   * @returns {Promise<any>}
   */
  async getTask(id) {
    return this._request(`/tasks/${encodeURIComponent(id)}`, {
      method: "GET",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new task.
   * @param {Object} data - Task payload
   * @returns {Promise<any>}
   */
  async createTask(data) {
    return this._request("/tasks", {
      method: "POST",
      body: data,
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Update a task by ID.
   * @param {string|number} id
   * @param {Object} data - Partial task payload (fields to update)
   * @returns {Promise<any>}
   */
  async updateTask(id, data) {
    return this._request(`/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: data,
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a task by ID.
   * @param {string|number} id
   * @returns {Promise<{success: boolean} | any>}
   */
  async deleteTask(id) {
    return this._request(`/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Mark task completion state. Uses dedicated route if available; falls back to updating 'completed' field.
   * @param {string|number} id
   * @param {boolean} [completed=true]
   * @returns {Promise<any>}
   */
  async markTaskComplete(id, completed = true) {
    try {
      // Try dedicated complete endpoint
      return await this._request(`/tasks/${encodeURIComponent(id)}/complete`, {
        method: "POST",
        body: { completed },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Fallback to patching the task
        return this.updateTask(id, { completed });
      }
      throw err;
    }
  }

  // =========================
  // Subtasks
  // =========================

  // PUBLIC_INTERFACE
  /**
   * List subtasks for a task.
   * @param {string|number} taskId
   * @returns {Promise<any[]>}
   */
  async listSubtasks(taskId) {
    return this._request(`/tasks/${encodeURIComponent(taskId)}/subtasks`, {
      method: "GET",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single subtask.
   * @param {string|number} taskId
   * @param {string|number} subtaskId
   * @returns {Promise<any>}
   */
  async getSubtask(taskId, subtaskId) {
    return this._request(`/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, {
      method: "GET",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Create a subtask for the given task.
   * @param {string|number} taskId
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async createSubtask(taskId, data) {
    return this._request(`/tasks/${encodeURIComponent(taskId)}/subtasks`, {
      method: "POST",
      body: data,
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Update a subtask.
   * @param {string|number} taskId
   * @param {string|number} subtaskId
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async updateSubtask(taskId, subtaskId, data) {
    return this._request(`/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, {
      method: "PATCH",
      body: data,
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a subtask.
   * @param {string|number} taskId
   * @param {string|number} subtaskId
   * @returns {Promise<{success: boolean} | any>}
   */
  async deleteSubtask(taskId, subtaskId) {
    return this._request(`/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`, {
      method: "DELETE",
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Mark a subtask as complete/incomplete. Uses dedicated endpoint when available; falls back to update.
   * @param {string|number} taskId
   * @param {string|number} subtaskId
   * @param {boolean} [completed=true]
   * @returns {Promise<any>}
   */
  async markSubtaskComplete(taskId, subtaskId, completed = true) {
    try {
      return await this._request(
        `/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}/complete`,
        { method: "POST", body: { completed } }
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return this.updateSubtask(taskId, subtaskId, { completed });
      }
      throw err;
    }
  }
}

// PUBLIC_INTERFACE
/**
 * Default API client instance configured from environment.
 * Usage:
 *   import api from './api/client';
 *   await api.login('user', 'pass');
 */
const api = new ApiClient();
export default api;
