import { Container, Button, Card } from 'react-bootstrap';

function App() {
  return (
    <Container className="mt-5">

      <Card className="shadow">
        <Card.Body>

          <h1>🏇 EquiX</h1>

          <p>
            Horse Racing Tournament Management System
          </p>

          <Button variant="primary">
            Login
          </Button>

          <Button
            variant="outline-primary"
            className="ms-2"
          >
            Register
          </Button>

        </Card.Body>
      </Card>

    </Container>
  );
}

export default App;