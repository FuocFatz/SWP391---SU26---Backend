import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiFilter, FiExternalLink } from "react-icons/fi";
import { api } from "../services/api";
import "./DashboardPage.css";

const statusFilters = ["All", "DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "STANDBY", "IN_PROGRESS", "COMPLETED", "REPORT_READY", "OFFICIAL", "CANCELLED"];
const typeFilters = ["All", "SPRINT", "MILE", "MEDIUM", "LONG"];

const statusColors = {
  REGISTRATION_OPEN: "badge-green",
  IN_PROGRESS: "badge-yellow",
  OFFICIAL: "badge-blue",
  COMPLETED: "badge-emerald",
  CANCELLED: "badge-red",
  DRAFT: "badge-gray",
  STANDBY: "badge-yellow",
  REGISTRATION_CLOSED: "badge-orange",
  REPORT_READY: "badge-yellow",
};

function BrowseRacesPage() {
  const [races, setRaces] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        const data = await api.getRaces();
        setRaces(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        console.error("Failed to fetch races:", err);
        if (err.message === 'Request failed' || err.message.includes('403')) {
          setError("Access Denied: You do not have permission to view races.");
        } else {
          setError("Failed to load races. Please try again.");
        }
        setRaces([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRaces();
  }, []);

  const filtered = races.filter((race) => {
    const matchSearch = (race.name || race.raceName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || race.status === statusFilter;
    const matchType = typeFilter === "All" || (race.raceType || race.type) === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="dashboard-page" id="browse-races-page">
      <div className="dash-header">
        <h1 className="dash-title">Browse Races</h1>
        <p className="dash-subtitle">Explore all upcoming, live, and completed races</p>
      </div>

      <section className="workflow-panel">
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <FiSearch style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search races by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.25rem", width: "100%" }}
              id="browse-race-search"
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <FiFilter style={{ alignSelf: "center", color: "var(--text-tertiary)" }} />
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="browse-race-status-filter">
              {statusFilters.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Status" : s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} id="browse-race-type-filter">
              {typeFilters.map((t) => (
                <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="dash-message" style={{ background: "rgba(192,57,43,0.12)", color: "var(--color-primary-light)", borderColor: "var(--color-primary)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading races...</div>
      ) : (
        <>
          <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem", fontSize: "var(--fs-sm)" }}>
            Showing <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong> of {races.length} races
          </p>
          <section className="workflow-panel">
            <div className="workflow-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Race Name</th>
                    <th>Type</th>
                    <th>Distance</th>
                    <th>Date</th>
                    <th>Prize</th>
                    <th>Status</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((race, index) => (
                    <tr key={race.id}>
                      <td style={{ color: "var(--text-tertiary)" }}>{index + 1}</td>
                      <td><strong style={{ color: "var(--text-primary)" }}>{race.name || race.raceName || `Race #${race.id}`}</strong></td>
                      <td><span className="badge badge-gray">{((race.raceType || race.type) || "-").replace(/_/g, " ")}</span></td>
                      <td>{(race.raceDistance || race.distanceM) ? `${race.raceDistance || race.distanceM}m` : "-"}</td>
                      <td>{race.raceDate || "-"}</td>
                      <td>{(race.prizePoints || race.prizePool) ? `${Number(race.prizePoints || race.prizePool).toLocaleString()} pts` : "-"}</td>
                      <td>
                        <span className={`badge ${statusColors[race.status] || "badge-gray"}`}>
                          {(race.status || "Unknown").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <Link to={`/races/${race.id}`} className="btn btn-outline btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <FiExternalLink size={12} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "2rem" }}>
                        No races match your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default BrowseRacesPage;
