import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { GiHorseHead } from "react-icons/gi";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import "./DashboardPage.css";

const healthColors = {
  HEALTHY: "badge-green",
  INJURED: "badge-red",
  RECOVERING: "badge-yellow",
  RETIRED: "badge-gray",
};

function MyHorsesPage() {
  const { user } = useAuth();
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [horseForm, setHorseForm] = useState({
    horseName: "",
    breed: "Thoroughbred",
    age: 4,
    speed: 80,
    stamina: 80,
    gender: "",
  });
  const [saving, setSaving] = useState(false);

  const loadHorses = async () => {
    try {
      setLoading(true);
      const data = user?.role === "HORSE_OWNER" ? await api.getHorsesByOwner() : await api.getHorses();
      setHorses(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch horses:", err);
      setError("Failed to load horses.");
      setHorses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHorses();
  }, [user]);

  const handleCreateHorse = async (e) => {
    e.preventDefault();
    if (!horseForm.gender) {
      setMessage("Please select a gender for the horse.");
      return;
    }
    try {
      setSaving(true);
      setMessage("");
      await api.createHorse({
        ...horseForm,
        ownerId: user?.id,
        healthStatus: "HEALTHY",
      });
      setMessage("Horse created successfully!");
      setHorseForm({ horseName: "", breed: "Thoroughbred", age: 4, speed: 80, stamina: 80, gender: "" });
      setShowForm(false);
      loadHorses();
    } catch (err) {
      setMessage(err.message || "Failed to create horse.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page" id="my-horses-page">
      <div className="dash-header dash-header-row">
        <div>
          <h1 className="dash-title">My Horses</h1>
          <p className="dash-subtitle">Manage your registered horses</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-outline" onClick={loadHorses} disabled={loading}>
            <FiRefreshCw /> Refresh
          </button>
          {user?.role === "HORSE_OWNER" && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              <FiPlus /> {showForm ? "Cancel" : "Add Horse"}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`dash-message ${message.includes("success") ? "success" : ""}`}>{message}</div>
      )}

      {showForm && user?.role === "HORSE_OWNER" && (
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Create New Horse</h3>
            <GiHorseHead />
          </div>
          <form className="workflow-form" onSubmit={handleCreateHorse}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                className="form-input"
                placeholder="Horse name"
                value={horseForm.horseName}
                onChange={(e) => setHorseForm({ ...horseForm, horseName: e.target.value })}
                required
              />
              <input
                className="form-input"
                placeholder="Breed (e.g. Thoroughbred)"
                value={horseForm.breed}
                onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <select
                className="form-select md:col-span-2"
                value={horseForm.gender}
                onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value })}
                required
              >
                <option value="" disabled>Select Gender</option>
                <option value="STALLION">Stallion</option>
                <option value="MARE">Mare</option>
                <option value="GELDING">Gelding</option>
              </select>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="Age"
                value={horseForm.age}
                onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })}
              />
              <input
                className="form-input"
                type="number"
                min="1"
                max="100"
                placeholder="Speed"
                value={horseForm.speed}
                onChange={(e) => setHorseForm({ ...horseForm, speed: Number(e.target.value) })}
              />
            </div>
            <div className="mb-4">
              <input
                className="form-input"
                type="number"
                min="1"
                max="100"
                placeholder="Stamina"
                value={horseForm.stamina}
                onChange={(e) => setHorseForm({ ...horseForm, stamina: Number(e.target.value) })}
                style={{ width: "25%" }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Horse"}
            </button>
          </form>
        </section>
      )}

      {error && (
        <div className="dash-message" style={{ background: "rgba(192,57,43,0.12)", color: "var(--color-primary-light)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>Loading horses...</div>
      ) : (
        <section className="workflow-panel">
          <div className="workflow-panel-heading">
            <h3>Horses ({horses.length})</h3>
            <GiHorseHead />
          </div>
          <div className="workflow-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Breed</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Speed</th>
                  <th>Stamina</th>
                  <th>Health</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {horses.map((horse, index) => (
                  <tr key={horse.id}>
                    <td style={{ color: "var(--text-tertiary)" }}>{index + 1}</td>
                    <td><strong style={{ color: "var(--text-primary)" }}>{horse.horseName || horse.name}</strong></td>
                    <td>{horse.breed || "-"}</td>
                    <td>{horse.gender || "-"}</td>
                    <td>{horse.age || "-"}</td>
                    <td>{horse.speed || "-"}</td>
                    <td>{horse.stamina || "-"}</td>
                    <td>
                      <span className={`badge ${healthColors[horse.healthStatus] || "badge-gray"}`}>
                        {horse.healthStatus || "Unknown"}
                      </span>
                    </td>
                    <td>{horse.totalPoints || 0}</td>
                  </tr>
                ))}
                {horses.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "2rem" }}>
                      No horses found. {user?.role === "HORSE_OWNER" ? "Add your first horse above!" : ""}
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

export default MyHorsesPage;
