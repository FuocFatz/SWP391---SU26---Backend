import './TermsPage.css';

function TermsPage() {
  return (
    <div className="terms-page" id="terms-page">
      <div className="container">
        <div className="terms-header">
          <h1 className="terms-title">Terms of Service</h1>
          <p className="terms-updated">Last updated: June 2026</p>
        </div>

        <div className="terms-content">
          <div className="terms-toc">
            <h3 className="terms-toc-title">Contents</h3>
            <a href="#acceptance" className="terms-toc-link">1. Acceptance of Terms</a>
            <a href="#accounts" className="terms-toc-link">2. User Accounts</a>
            <a href="#roles" className="terms-toc-link">3. User Roles</a>
            <a href="#guess-system" className="terms-toc-link">4. Guess System</a>
            <a href="#races" className="terms-toc-link">5. Race Rules</a>
            <a href="#privacy" className="terms-toc-link">6. Privacy & Data</a>
            <a href="#disclaimer" className="terms-toc-link">7. Disclaimer</a>
          </div>

          <div className="terms-body">
            <section id="acceptance" className="terms-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using the EquiX Horse Racing Tournament Management System, 
                you agree to be bound by these Terms of Service. This platform is developed 
                as an academic project for the SWP391 course at FPT College Vietnam.
              </p>
            </section>

            <section id="accounts" className="terms-section">
              <h2>2. User Accounts</h2>
              <p>
                Horse Owner and Jockey accounts require Admin confirmation before activation. 
                Spectator accounts are activated immediately upon registration. Race Referee 
                accounts can only be created by the Administrator.
              </p>
            </section>

            <section id="roles" className="terms-section">
              <h2>3. User Roles & Responsibilities</h2>
              <p>
                The platform supports five user roles: Horse Owner, Jockey, Race Referee, 
                Spectator, and Administrator. Each role has specific permissions and restrictions 
                designed to maintain fair competition and system integrity.
              </p>
              <ul className="terms-list">
                <li><strong>Horse Owners</strong> manage horses, hire jockeys, and register pairs for races.</li>
                <li><strong>Jockeys</strong> accept invitations, ride horses, and earn achievements.</li>
                <li><strong>Referees</strong> monitor races, issue disqualifications, and file reports.</li>
                <li><strong>Spectators</strong> watch races and place guesses on race outcomes.</li>
                <li><strong>Admins</strong> oversee the entire system including account and race management.</li>
              </ul>
            </section>

            <section id="guess-system" className="terms-section">
              <h2>4. Guess System</h2>
              <p>
                The prediction feature is explicitly labeled as a "Guess" system for academic 
                purposes. It is not a gambling or betting platform. No real money is wagered. 
                Each spectator may place exactly one guess per race, selecting a horse-jockey 
                pair they believe will win. Guesses are locked once the race enters Standby status.
              </p>
            </section>

            <section id="races" className="terms-section">
              <h2>5. Race Rules</h2>
              <p>
                Races require a minimum of 6 and maximum of 18 horse-jockey pairs. Registration 
                closes 1 week before the scheduled race date. The grace period for withdrawal 
                extends from 3 days to 1 week before the race. Race results are finalized through 
                a two-step process: Referee report submission followed by Admin confirmation.
              </p>
            </section>

            <section id="privacy" className="terms-section">
              <h2>6. Privacy & Data</h2>
              <p>
                User data is stored securely using JWT-based authentication. Profile information 
                is visible to other users within the context of their role interactions. Horse 
                portraits are stored server-side and may be removed upon account deletion.
              </p>
            </section>

            <section id="disclaimer" className="terms-section">
              <h2>7. Disclaimer</h2>
              <p>
                EquiX is an educational project developed for the SWP391 course. Race outcomes 
                are simulated and randomized. The platform does not involve real horses, real 
                jockeys, or real monetary transactions. All prizes referenced in the system 
                are for demonstration purposes only.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
