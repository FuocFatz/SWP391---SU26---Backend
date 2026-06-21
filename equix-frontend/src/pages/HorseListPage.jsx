import HorseCard from '../components/HorseCard/HorseCard';

const mockHorses = [
  { id: 1, name: 'Thunder Storm', breed: 'Thoroughbred', age: 4, weight: 480, position: 'Front', status: 'Available' },
  { id: 2, name: 'Lightning Bolt', breed: 'Arabian', age: 3, weight: 420, position: 'Pace', status: 'Paired' },
  { id: 3, name: 'Golden Arrow', breed: 'Quarter Horse', age: 5, weight: 500, position: 'Late', status: 'Training' },
];

function HorseListPage() {
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Horse Management</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {mockHorses.map(horse => <HorseCard key={horse.id} horse={horse} />)}
      </div>
    </div>
  );
}

export default HorseListPage;
