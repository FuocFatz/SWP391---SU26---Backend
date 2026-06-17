import { Link } from "react-router-dom";

function HomePage() {
    return (
        <div style={{ textAlign: "center", padding: "50px" }}>
            <h1>🏇 EquiX</h1>

            <h3>Horse Racing Tournament Management System</h3>

            <p>
                Register horses, join tournaments, hire jockeys and manage races.
            </p>

            <div style={{ marginTop: "30px" }}>
                <Link to="/login">
                    <button>Login</button>
                </Link>

                <Link to="/register">
                    <button style={{ marginLeft: "10px" }}>
                        Register
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default HomePage;