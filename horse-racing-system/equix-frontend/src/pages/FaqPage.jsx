import { Link } from 'react-router-dom';
import './TermsPage.css';

const questions = [
  ['Who can register?', 'Horse Owner, Jockey, and Spectator accounts can register publicly. Owner and Jockey accounts require Admin verification; Spectator accounts activate immediately.'],
  ['How do Owner pairings work?', 'An Owner invites an available Jockey for an available horse. After acceptance, the active pair can be registered for a race that is open for registration.'],
  ['When can a Spectator save a guess?', 'A Spectator can save one horse guess per race before Standby. Saving again updates that account’s existing guess.'],
  ['Why is a race action disabled?', 'Actions are state-controlled. Referee health checks require a ready registration, and a race needs at least six cleared pairs before Standby or Start.'],
  ['What is Quick Login?', 'Quick Login is a local demo helper. When enabled by local environment configuration, choose one of the five role buttons on the Sign In page.'],
  ['Does EquiX use real betting?', 'No. EquiX guesses and reward points are academic simulation features and do not use real money.'],
];

function FaqPage() {
  return <div className="terms-page" id="faq-page"><div className="container"><div className="terms-header"><h1 className="terms-title">Frequently Asked Questions</h1><p className="terms-updated">EquiX role and workflow guide</p></div><div className="terms-content"><div className="terms-body">{questions.map(([question, answer], index) => <section key={question} className="terms-section"><h2>{index + 1}. {question}</h2><p>{answer}</p></section>)}</div></div><div className="text-center"><Link to="/races" className="btn btn-primary">Browse Races</Link></div></div></div>;
}

export default FaqPage;
