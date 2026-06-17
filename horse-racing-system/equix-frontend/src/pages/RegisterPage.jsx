function RegisterPage() {
    return (
        <div>

            <h1>Register</h1>

            <input placeholder="Username" />

            <br /><br />

            <input placeholder="Full Name" />

            <br /><br />

            <input placeholder="Email" />

            <br /><br />

            <input type="password" placeholder="Password" />

            <br /><br />

            <select>
                <option>OWNER</option>
                <option>JOCKEY</option>
                <option>REFEREE</option>
            </select>

            <br /><br />

            <button>
                Register
            </button>

        </div>
    );
}

export default RegisterPage;