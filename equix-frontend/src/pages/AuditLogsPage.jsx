import { useState, useEffect } from "react";
import { api } from "../services/api";
import { FiFilter } from "react-icons/fi";
import "./DashboardPage.css";

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ entityType: "", userId: "" });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.userId) params.userId = filters.userId;
      const data = await api.getAuditLogs(params);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const actionBadge = (action) => {
    if (!action) return "badge-gray";
    const a = action.toUpperCase();
    if (a.includes("CREATE") || a.includes("ADD")) return "badge-green";
    if (a.includes("DELETE") || a.includes("REMOVE")) return "badge-red";
    if (a.includes("UPDATE") || a.includes("EDIT")) return "badge-yellow";
    return "badge-gray";
  };

  return (
    <div className="dashboard-page" id="audit-logs-page">
      <div className="dash-header">
        <h1 className="dash-title">Audit Logs</h1>
        <p className="dash-subtitle">Track all system actions and recorded changes</p>
      </div>

      {/* Filter Panel */}
      <section className="workflow-panel">
        <div className="workflow-panel-heading">
          <h3>Filters</h3>
          <FiFilter />
        </div>
        <div style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}>
          {/* Entity Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: "1 1 200px" }}>
            <label style={{
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-medium)",
              color: "var(--text-secondary)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}>
              Entity Type
            </label>
            <input
              type="text"
              name="entityType"
              value={filters.entityType}
              onChange={handleFilterChange}
              placeholder="e.g. USER, RACE, HORSE..."
              className="form-input"
            />
          </div>

          {/* User ID */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: "1 1 200px" }}>
            <label style={{
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-medium)",
              color: "var(--text-secondary)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}>
              User ID
            </label>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="e.g. 1, 2, 3..."
              className="form-input"
            />
          </div>

          {/* Clear */}
          <button
            className="btn btn-outline"
            style={{ alignSelf: "flex-end" }}
            onClick={() => setFilters({ entityType: "", userId: "" })}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          Loading audit logs...
        </div>
      )}

      {error && (
        <div className="dash-message" style={{
          background: "rgba(192,57,43,0.12)",
          color: "var(--color-primary-light)",
          borderColor: "var(--color-primary)",
        }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Log Entries ({logs.length})</h3>
          </div>
          <div className="workflow-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: "var(--text-tertiary)" }}>{log.id}</td>
                    <td>{log.userId}</td>
                    <td>
                      <span className={`badge ${actionBadge(log.actionType)}`}>
                        {log.actionType || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">{log.entityType || "-"}</span>
                    </td>
                    <td>{log.entityId || "-"}</td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: "var(--fs-sm)" }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "2.5rem" }}>
                      No audit logs found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default AuditLogsPage;
