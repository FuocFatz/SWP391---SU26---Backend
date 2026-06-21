# EquiX Horse Racing Tournament Management System

![EquiX Banner](https://img.shields.io/badge/EquiX-Horse_Racing_System-2ecc71?style=for-the-badge)

## 1. Project Overview

**EquiX** is a comprehensive, full-stack Horse Racing Tournament Management System designed to streamline the operations of horse racing events. The platform facilitates the complete lifecycle of a horse race, from horse registration and jockey pairing to race simulation, result confirmation, and spectator predictions.

The business purpose of EquiX is to provide a digital ecosystem where various stakeholders can interact securely and efficiently.

### Stakeholders & Roles
* **Admin**: System administrators who oversee the platform, create tournaments, manage races, and approve horse registrations.
* **Horse Owner**: Users who register their horses, manage their horse profiles, and invite jockeys to ride their horses in specific races.
* **Jockey**: Professional riders who receive invitations from owners to participate in races and can accept or decline them.
* **Referee**: Race officials responsible for health checks of horses, starting races, and confirming official race results.
* **Spectator**: Fans who view race schedules, monitor leaderboards, and place predictions on race outcomes for reward points.

---

## 2. Features

### Authentication
* **Login**: Secure user authentication returning a JWT token.
* **Register**: Account creation with role selection.
* **JWT Authentication**: Stateless request validation using Bearer tokens.
* **Role-based Access**: Endpoints and UI elements restricted based on user roles (Admin, Owner, Jockey, Referee, Spectator).

### User Management
* **Create User**: Add new users to the system.
* **Update User**: Modify existing user details (profile, role, status).
* **Delete User**: Remove users from the platform.
* **Search User**: Fetch users by ID, role, or list all users.

### Horse Management
* **Create Horse**: Owners can add their horses with detailed stats (speed, stamina, breed, etc.).
* **Update Horse**: Modify horse attributes and health status.
* **Delete Horse**: Remove a horse from the registry.
* **View Horses**: Fetch all horses or filter by owner.

### Tournament Management
* **Create Tournament**: Set up new multi-race tournaments.
* **View Tournament**: Browse existing tournaments.
* **Update Tournament**: Edit tournament details and status.

### Race Management
* **Create Race**: Define race parameters (distance, surface, prize pool).
* **Start Race**: Referees transition races to `IN_PROGRESS` status.
* **Simulate Race**: Run race simulations with algorithmic positioning based on horse stats.
* **Confirm Results**: Referees submit official finish positions and times.
* **Race Status Updates**: Track races from `REGISTRATION_OPEN` to `OFFICIAL`.

### Registration Management
* **Horse Registration**: Owners enter their horses into specific races.
* **Owner Confirmation**: Final owner sign-off on race entries.
* **Referee Checks**: Health and eligibility checks (`FIT` / `NOT_FIT`) before the race.
* **Approval Workflow**: Admin approval of pending registrations.
* **Withdrawal**: Ability to withdraw a registered horse with a reason.

### Jockey Invitation
* **Invite Jockey**: Owners send race-specific invitations to jockeys.
* **Accept Invitation**: Jockeys confirm their participation.
* **Reject Invitation**: Jockeys decline invitations.

### Prediction System
* **Place Predictions**: Spectators wager reward points on expected winners.
* **View Predictions**: Track pending and settled predictions.
* **Automatic Settlement**: Wagers are evaluated and rewarded upon official race results.

### Notification System
* **View Notifications**: In-app alerts for invitations, race starts, and prediction results.
* **Mark As Read**: Update notification status.

### Leaderboards
* **Horse Leaderboard**: Ranked by total points, wins, and top-3 finishes.
* **Jockey Leaderboard**: Ranked by accumulated race points.

---

## 3. Technology Stack

### Backend
* **Java 17**: Core language.
* **Spring Boot 3.5.x**: Application framework.
* **Spring Security 6**: Authentication and access control.
* **JWT (JSON Web Tokens)**: Stateless API security.
* **Hibernate / Spring Data JPA**: ORM and database interactions.
* **SQL Server**: Relational database management system.

### Frontend
* **React 19**: UI library.
* **Vite**: Next-generation frontend tooling and bundler.
* **React Router DOM**: Client-side routing.
* **Fetch API**: Centralized API client wrapper.
* **React Bootstrap & Vanilla CSS**: Styling and responsive design.

### Documentation
* **Swagger / OpenAPI 3**: Automated API documentation and testing interface.

---

## 4. Database

The database uses SQL Server and is designed to handle the complex relationships between stakeholders, horses, and races.

### Entity Relationship Overview (ERD)

* **User**: The central entity representing all stakeholders. Has a one-to-many relationship with Horses (Owner), Registrations (Owner/Jockey), and Predictions (Spectator).
* **Horse**: Belongs to a User (Owner). Can have many RaceRegistrations.
* **Tournament**: Groups multiple Races.
* **Race**: The core event. Belongs to a Tournament. Has a designated Referee (User). Contains many RaceRegistrations, Predictions, and RaceResults.
* **RaceRegistration**: The pivot table linking a Race, a Horse, an Owner, and a Jockey. Tracks the workflow status of an entry.
* **JockeyInvitation**: Workflow entity where an Owner invites a Jockey to a specific Race/Horse combination.
* **RaceResult**: Official outcome of a Race for a specific Registration, detailing finish position, time, and points awarded.
* **Prediction**: A Spectator's wager on a specific Horse in a Race.
* **Notification**: System alerts targeted at a specific User.
* **AuditLog**: System-wide tracking of critical events (optional tracking).

---

## 5. API Documentation

*All non-auth endpoints require `Authorization: Bearer <token>`.*

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Register a new user.
* `POST /api/auth/login` - Authenticate and receive JWT.
* `POST /api/auth/password-reset/request` - Request password reset link.
* `POST /api/auth/password-reset/confirm` - Confirm password reset.

### Users (`/api/v1/users`)
* `GET /api/v1/users` - Get all users.
* `POST /api/v1/users` - Create a new user.
* `GET /api/v1/users/{id}` - Get user by ID.
* `PUT /api/v1/users/{id}` - Update user.
* `DELETE /api/v1/users/{id}` - Delete user.
* `GET /api/v1/users/role/{role}` - Get users by specific role.

### Horses (`/api/horses`)
* `GET /api/horses` - Get all horses.
* `POST /api/horses` - Register a new horse.
* `GET /api/horses/{id}` - Get horse by ID.
* `PUT /api/horses/{id}` - Update a horse.
* `DELETE /api/horses/{id}` - Delete a horse.
* `GET /api/horses/owner/{ownerId}` - Get horses belonging to an owner.

### Races (`/api/races`)
* `GET /api/races` - Get all races.
* `POST /api/races` - Create a new race.
* `GET /api/races/{id}` - Get race by ID.
* `PUT /api/races/{id}` - Update a race.
* `PATCH /api/races/{id}/status` - Update race status.
* `GET /api/races/{id}/registrations` - Get registrations for a race.
* `POST /api/races/{id}/registrations` - Register a horse for a race.
* `POST /api/races/{id}/start` - Start a race.
* `GET /api/races/{id}/simulate` - Simulate race progress.
* `GET /api/races/{id}/results` - Get final results.
* `POST /api/races/{id}/results` - Confirm official results.
* `GET /api/races/{id}/predictions` - Get spectator predictions.
* `POST /api/races/{id}/predictions` - Place a prediction.
* `GET /api/races/leaderboard/horses` - Get global horse leaderboard.
* `GET /api/races/leaderboard/jockeys` - Get global jockey leaderboard.

### Tournaments (`/api/tournaments`)
* `GET /api/tournaments` - Get all tournaments.
* `POST /api/tournaments` - Create a tournament.
* `GET /api/tournaments/{id}` - Get tournament by ID.
* `PUT /api/tournaments/{id}` - Update a tournament.

### Jockey Invitations (`/api/invitations`)
* `GET /api/invitations` - Get all invitations.
* `POST /api/invitations` - Send a jockey invitation.
* `PATCH /api/invitations/{id}/respond` - Accept/decline an invitation.

### Race Registrations (`/api/registrations`)
* `GET /api/registrations` - Get all registrations.
* `PATCH /api/registrations/{id}/approve` - Admin approves registration.
* `PATCH /api/registrations/{id}/owner-confirm` - Owner confirms entry.
* `PATCH /api/registrations/{id}/withdraw` - Withdraw registration.
* `PATCH /api/registrations/{id}/referee-check` - Referee logs health check.

### Predictions (`/api/predictions`)
* `GET /api/predictions` - Get predictions.
* `POST /api/predictions` - Place a prediction.

### Notifications (`/api/notifications`)
* `GET /api/notifications` - Get user notifications.
* `PATCH /api/notifications/{id}/read` - Mark notification as read.

---

## 6. Installation Guide

### Prerequisites
* Java 17 Development Kit (JDK)
* Apache Maven
* Microsoft SQL Server
* Node.js & npm (for frontend)

### Backend Setup

1. **Database Creation**: Create a SQL Server database named `EquiX`.
   ```sql
   CREATE DATABASE EquiX;
   ```
2. **Configuration**: Ensure `application.properties` matches your SQL Server credentials (see Configuration section).
3. **Build & Run**:
   ```bash
   cd horse-racing-system
   ./mvnw clean install -DskipTests
   ./mvnw spring-boot:run
   ```
4. **Access Swagger**: Open your browser to `http://localhost:9090/swagger-ui.html`

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd equix-frontend
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```
3. **Access App**: Open your browser to `http://localhost:5173/` (or the port specified by Vite).

---

## 7. Configuration

### Backend (`src/main/resources/application.properties`)

```properties
server.port=9090

# Database Configuration
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=EquiX;encrypt=true;trustServerCertificate=true
spring.datasource.username=equix_user
spring.datasource.password=123456
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

# Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect

# JWT Configuration (Externalize in production!)
# Secret is located in com.equix.horseracingsystem.config.JwtUtil
```

### Frontend Environment (`equix-frontend/.env` - Create if needed)

```env
VITE_API_BASE_URL=http://localhost:9090/api
```

---

## 8. Swagger

Interactive API documentation is automatically generated.
* **Swagger UI**: [http://localhost:9090/swagger-ui/index.html](http://localhost:9090/swagger-ui/index.html)
* **OpenAPI JSON**: [http://localhost:9090/v3/api-docs](http://localhost:9090/v3/api-docs)

To test secure endpoints in Swagger, login via `/api/auth/login`, copy the `token`, click the **Authorize** button at the top of the Swagger UI, and enter the token.

---

## 9. Test Accounts

Upon initialization, you may seed the database with these test accounts (or create them via the Register endpoint). All default passwords should be configured to `123456` for testing.

* **Admin**: `admin@equix.vn` (Role: `ADMIN`)
* **Owner**: `owner@equix.vn` (Role: `OWNER`)
* **Jockey**: `jockey@equix.vn` (Role: `JOCKEY`)
* **Referee**: `referee@equix.vn` (Role: `REFEREE`)
* **Spectator**: `spectator@equix.vn` (Role: `SPECTATOR`)

---

## 10. Project Structure

```text
horse-racing-system/
├── src/main/java/com/equix/horseracingsystem/
│   ├── config/          # JWT, Security, CORS, and OpenAPI configurations
│   ├── controller/      # REST API Controllers exposing endpoints
│   ├── dto/             # Data Transfer Objects for requests and responses
│   ├── entity/          # JPA Entities mapping to SQL Server tables
│   ├── repository/      # Spring Data JPA Repositories
│   └── service/         # Business logic and workflow services
├── src/main/resources/
│   └── application.properties # Backend config
├── pom.xml              # Maven dependencies
└── README.md            # Project documentation

equix-frontend/
├── src/
│   ├── assets/          # Static assets (images, icons)
│   ├── components/      # Reusable React components (Navbar, Cards, etc.)
│   ├── contexts/        # React Contexts (AuthContext)
│   ├── layouts/         # Page wrappers (DashboardLayout, PublicLayout)
│   ├── pages/           # Main route views (Login, Dashboard, Races)
│   ├── routes/          # Application routing logic (AppRoutes.jsx)
│   └── services/        # API client wrapper (api.js)
├── package.json         # NPM dependencies
└── vite.config.js       # Vite bundler config
```

---

## 11. Build & Deployment

### Backend
To package the Spring Boot application into an executable JAR:
```bash
./mvnw clean package -DskipTests
java -jar target/horse-racing-system-0.0.1-SNAPSHOT.jar
```

### Frontend
To build the React application for production:
```bash
npm run build
```
This generates optimized static files in the `dist` folder, which can be served by Nginx, Apache, or deployed to Vercel/Netlify.

---

## 12. Team Information

### Project Team

| Student ID | Full Name        | Role                             | Technology        |
| ---------- | ---------------- | -------------------------------- | ----------------- |
| SE161980   | Mai Chí Huy      | Team Leader / Frontend Developer | ReactJS           |
| SE180221   | Võ Quốc Đạt      | Backend Developer                | Java, Spring Boot |
| SE190419   | Trương Tấn Phước | Backend Developer                | Java, Spring Boot |
| SE196402   | Võ Kế Trí        | Backend Developer                | Java, Spring Boot |

### Team Responsibilities

#### Mai Chí Huy (Team Leader)

* Project planning and team coordination
* Frontend architecture design
* ReactJS development
* UI/UX implementation
* Frontend integration with backend APIs

#### Võ Quốc Đạt

* Backend development
* REST API implementation
* Business logic development
* Database integration

#### Trương Tấn Phước

* Backend development
* Spring Security & JWT Authentication
* API integration
* Swagger/OpenAPI documentation
* System configuration and deployment

#### Võ Kế Trí

* Backend development
* Database management
* Entity relationship implementation
* Business workflow development

---

### Academic Information

**Course:** SWP391 – Software Development Project

**Project Name:** EquiX Horse Racing Tournament Management System

**Institution:** FPT University

**Semester:** Summer 2026

---

### Acknowledgements

The EquiX Horse Racing Tournament Management System was developed as part of the SWP391 Software Development Project course. The team would like to thank the course instructors and reviewers for their valuable guidance and support throughout the project lifecycle.


## 13. Future Improvements

* **WebSockets Integration**: Implement real-time updates for race simulations, leaderboards, and instant notifications using Spring WebSockets/STOMP.
* **Payment Gateway**: Integrate Stripe/PayPal to allow real-world transactions for race prize pools and spectator wagering.
* **Advanced Analytics**: Dashboard charts and data visualization for horse performance history and betting trends.
* **Mobile Application**: Port the React frontend to React Native for dedicated iOS/Android apps for Jockeys and Owners on the go.
* **Externalize Secrets**: Move JWT secrets and database passwords to environment variables or a secure vault for production deployment.
