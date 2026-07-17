import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import AdminSectionPage from '../pages/AdminSectionPage';
import DashboardPage from '../pages/DashboardPage';

const ADMIN_SECTIONS = new Set([
  'accounts',
  'tournaments',
  'horses',
  'jockeys',
  'referees',
  'results',
  'guesses',
]);

function DashboardSubroute() {
  const { section } = useParams();
  const { user } = useAuth();

  if (user?.role === 'ADMIN' && ADMIN_SECTIONS.has(section)) {
    return <AdminSectionPage section={section} />;
  }

  return <DashboardPage section={section} />;
}

export default DashboardSubroute;
