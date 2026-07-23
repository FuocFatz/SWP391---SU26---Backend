EquiX


Definitive Business Logic Document
Horse Racing Tournament Management System


SWP391 — FPT College Vietnam
Version 4.0 — Definitive Release
Frontend: ReactJS  |  Backend: Java Spring Boot + JWT  |  Database: Microsoft SQL Server 2019+
	

Table of Contents


1. Project Overview        1
1.1 Technology Stack        1
1.2 Theme and Design Philosophy        2
1.3 Course and Team Information        2
2. System Architecture        2
2.1 Presentation Layer (Frontend)        2
2.2 Business Logic Layer (Backend)        3
2.3 Data Access Layer (Database)        3
2.4 Authentication and Authorization Flow        3
3. User Roles and Permissions Matrix        3
4. Common Pages (Guest)        4
4.1 Homepage        4
4.2 About Page        4
4.3 Terms and Service        4
4.4 Login        5
4.5 Register        5
5. Horse Owner Business Flows        5
5.1 Dashboard        5
5.2 Races        6
5.2.1 Race Registration Flow        6
5.3 Horse Management        6
5.3.1 Horse Status Management        6
5.3.2 Horse Portrait Upload        7
5.4 Jockey Tab (Hiring)        7
5.5 Paired/Registered Management        7
5.6 Leaderboard and Prizes        7
5.7 Personal Profile        8
6. Jockey Business Flows        8
6.1 Dashboard        8
6.2 Personal Profile        8
6.3 Invitation System        8
6.4 Horse View        9
6.5 Race View        9
6.6 Achievements        9
7. Race Referee Business Flows        9
7.1 Pre-Race Management        10
7.1.1 Disqualification Form Requirements        10
7.2 Live Race Monitoring        10
7.3 Race Confirmation        10
7.4 Race Report        11
8. Spectator Business Flows        11
8.1 Personal Profile        11
8.2 Dashboard        11
8.3 Race Viewing        12
8.4 Guess System (Betting)        12
8.4.1 Guess Placement Flow        12
8.5 Live Race Viewing        12
8.6 Guess Result Notification        13
9. Admin Business Flows        13
9.1 Dashboard        13
9.2 Account/Role Management        13
9.3 Tournament and Race Management        13
9.3.1 Race Creation Form        14
9.4 Pair Verification        14
9.5 Jockey and Horse Management        14
9.6 Referee Assignment        14
9.7 Race Result Finalization        15
9.8 Guess Management        15
10. Race System Mechanics        15
10.1 Race Types and Distance Categories        15
10.2 Race Simulation and Timer System        16
10.3 Race Status Lifecycle        16
11. Jockey-Horse Pairing System        16
11.1 Pairing Contract Model        17
11.2 Pairing Rules and Constraints        17
11.3 Grace Period and Withdrawal        17
12. Spectator Guess System        17
12.1 Betting Rules and Constraints        18
12.2 Lock Mechanism        18
12.3 Reward Distribution        18
12.4 Award Types Detail        18
13. Prize Pool System        18
13.1 Display-Only Model        19
13.2 Distribution Mathematics (60/30/10 Split)        19
14. Race Result Finalization Chain        20
14.1 End-to-End Flow        20
14.2 Status Transitions        20
14.3 Admin Rejection and Loop-Back        20
15. Critical Business Rules Summary        21
15.1 Numbered List of Hard Rules        21
16. Criticism, Gaps and Suggestions        24
16.1 No Password Reset / Account Recovery Flow        24
16.2 No Notification System Architecture        25
16.3 No Explicit Race Tie/Dead Heat Handling        26
16.4 No Horse Injury/Withdrawal During Race Mechanic        26
16.5 Referee Unavailability        27
16.6 All Spectators Guess Wrong        28
16.7 Race Cancellation Flow        28
16.8 Grace Period Ambiguity        29
16.9 No Tournament Structure        29
16.10 Jockey Decline at Last Minute        30
16.11 Admin Account Confirmation Flow        31
16.12 Horse Stats vs. Random Race Results        31
16.13 Minimum Participants After Disqualification        32
16.14 Prize Pool of Zero        33
16.15 Spectator Account Confirmation        33
16.16 No Audit Log        34
16.17 Mid-Race Disqualification Process        34
16.18 Race Result Finalization Chain — Admin Rejection Loop        35
16.19 Multiple Races Overlapping        36
16.20 Spectator Registration for a Race        36
16.21 Referee Race-Notes Format        37
16.22 Horse Portrait Upload Specifications        38
16.23 Leaderboard Calculation        38
16.24 Training Horse Status Triggers        39
16.25 Race Type Within Tournament — Mixed Types        39
16.26 Gap Analysis Summary        40


Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select "Update Field."
________________
1. Project Overview
EquiX is a comprehensive Horse Racing Tournament Management System designed and developed as part of the SWP391 course at FPT College Vietnam. The system provides a full-featured platform for managing horse racing tournaments, encompassing horse registration, jockey pairing, race scheduling, live race simulation, spectator engagement through a guess/betting system, and administrative oversight for tournament operations. The name EquiX is derived from 'Equine' (relating to horses) combined with 'X' representing the unknown and exciting element of racing competition.
The platform serves five distinct user roles: Horse Owner, Jockey, Race Referee, Spectator, and Administrator. Each role has a carefully designed set of permissions and workflows that interact to create a cohesive racing management ecosystem. The system draws inspiration from the Umamusume game for its horse attributes and race type categorization, while simplifying the racing simulation to a display-only model where positions are randomized within time ranges appropriate to each race type.
1.1 Technology Stack
The EquiX system is built on a modern, industry-standard technology stack that ensures scalability, security, and maintainability. The frontend is developed using ReactJS, providing a responsive and interactive user interface with component-based architecture. The backend leverages Java with the Spring Boot framework, implementing RESTful APIs secured with JSON Web Tokens (JWT) for authentication and authorization. The database layer uses Microsoft SQL Server as the relational database management system, providing robust data persistence with ACID compliance and relational integrity.
Layer
	Technology
	Purpose
	Frontend
	ReactJS
	Single-page application with component-based UI
	Backend
	Java Spring Boot
	RESTful API services with JWT authentication
	Database
	Microsoft SQL Server 2019+
	Relational data persistence with ACID compliance
	Authentication
	JWT (JSON Web Token)
	Stateless token-based authentication and authorization
	API Style
	REST
	Standard HTTP methods for resource management
	1.2 Theme and Design Philosophy
The EquiX user interface follows a Modern + Easy-looking design philosophy with a carefully curated color palette. The primary colors are Red (#C0392B) representing the excitement and passion of horse racing, Green (#27AE60) symbolizing the racetrack turf and success, and White (#FAFAFA) providing clean, breathable space for content. This color scheme creates visual hierarchy while maintaining a professional and approachable aesthetic that appeals to all user roles from horse owners to casual spectators.
1.3 Course and Team Information
This project is developed as part of the SWP391 course at FPT College Vietnam. The course focuses on software engineering practices, requiring students to apply industry-standard methodologies in requirements analysis, system design, implementation, testing, and deployment. The EquiX project demonstrates the application of full-stack development skills, database design, user experience considerations, and business logic implementation within a realistic software project context.
2. System Architecture
The EquiX system follows a three-tier architecture pattern that separates concerns across presentation, business logic, and data access layers. This separation ensures that each layer can be developed, tested, and maintained independently while maintaining clear interfaces for inter-layer communication. The architecture supports horizontal scaling of the application layer and vertical scaling of the database layer as demand grows.
2.1 Presentation Layer (Frontend)
The presentation layer is built with ReactJS and implements a single-page application (SPA) architecture. The frontend communicates with the backend exclusively through RESTful API calls, receiving and sending JSON payloads. JWT tokens are stored in the client and attached to API requests for authentication. The UI is organized into role-specific views, with shared components for common elements such as navigation bars, race cards, leaderboards, and notification displays. React Router manages client-side routing, providing a seamless user experience without full page reloads.
2.2 Business Logic Layer (Backend)
The business logic layer is implemented in Java using the Spring Boot framework. This layer encapsulates all business rules, including race registration validation, jockey-horse pairing constraints, guess locking mechanics, race simulation logic, and the result finalization chain. Spring Security with JWT handles authentication and role-based access control, ensuring that each API endpoint enforces the correct permissions for the requesting user's role. The layer follows a service-oriented architecture where controllers handle HTTP request/response mapping, services implement business logic, and repositories manage data access through Spring Data JPA.
2.3 Data Access Layer (Database)
The data access layer uses Microsoft SQL Server with Spring Data JPA providing the ORM abstraction. The database schema supports the core entities: Users, Horses, Jockeys, Races, Tournaments, Pairings, Guesses, Invitations, Reports, and Results. Foreign key constraints enforce referential integrity, and indexes are placed on frequently queried columns such as race status, user roles, and pairing relationships. Transaction management is handled by Spring's declarative transaction mechanism, ensuring data consistency during multi-step operations such as race result finalization.
2.4 Authentication and Authorization Flow
Authentication in EquiX follows the JWT pattern. Users submit credentials (email and password) to the login endpoint, which validates the credentials against the database and returns a signed JWT containing the user's ID and role. Subsequent API requests include this token in the Authorization header. The backend intercepts each request, validates the token signature and expiration, extracts the user identity, and enforces role-based access control. Role transitions (such as Admin confirming a Horse Owner account) modify the user's role in the database, and the next login generates a token with the updated role claims.
CRITICAL: Race Referee accounts can ONLY be created by the Admin through a dedicated account creation interface. There is no public registration path for the Referee role. This restriction ensures that only authorized personnel can oversee race operations.
	3. User Roles and Permissions Matrix
The EquiX system defines five distinct user roles, each with specific capabilities and restrictions. The permissions matrix below outlines which roles can access which features, ensuring clear boundaries of responsibility and preventing unauthorized actions. This matrix serves as the authoritative reference for implementing role-based access control in both the frontend routing and backend API authorization layers.
Feature
	Horse Owner
	Jockey
	Referee
	Spectator
	Admin
	View Homepage/About/Terms
	Yes
	Yes
	Yes
	Yes
	Yes
	Register via Public Form
	Yes
	Yes
	No
	Yes
	No
	Manage Horses (CRUD)
	Yes
	No
	No
	No
	Yes
	Hire/Invite Jockey
	Yes
	No
	No
	No
	Yes
	Register Pair for Race
	Yes
	No
	No
	No
	Yes
	View Live Race
	Yes
	Yes
	Yes
	Yes
	Yes
	Manage Race Status
	No
	No
	Yes
	No
	No
	Disqualify Pair
	No
	No
	Yes
	No
	No
	File Race Report
	No
	No
	Yes
	No
	No
	Place Guess
	No
	No
	No
	Yes
	No
	Manage Tournaments
	No
	No
	No
	No
	Yes
	Assign Referee
	No
	No
	No
	No
	Yes
	Confirm Accounts
	No
	No
	No
	No
	Yes
	Finalize Race Results
	No
	No
	No
	No
	Yes
	Manage Guess Awards
	No
	No
	No
	No
	Yes
	Edit Own Profile
	Yes
	Yes
	Yes
	Yes
	Yes
	View Leaderboard
	Yes
	Yes
	No
	Yes
	Yes
	The permissions matrix reveals several important design decisions. First, Referee accounts are not creatable through public registration, meaning Admin is the gatekeeper for this critical role. Second, the guess/betting system is exclusively available to Spectators, preventing conflicts of interest from other roles who might have insider information. Third, the result finalization chain requires both Referee report submission and Admin confirmation, creating a two-person integrity check on race outcomes.
4. Common Pages (Guest)
4.1 Homepage
The Homepage serves as the primary landing page for all visitors, whether authenticated or not. It provides a standard overview of the EquiX platform, including featured upcoming races, recent race results, a brief introduction to the system's purpose, and quick-access cards for registration and login. The page design uses the Red/Green/White color scheme to create visual interest, with hero imagery of horse racing and clear calls to action. For authenticated users, the Homepage dynamically adjusts to show personalized content such as their registered horses, upcoming race schedules, or active guesses depending on their role.
4.2 About Page
The About page provides detailed information about what the EquiX platform is, its purpose within the SWP391 course context, the technology stack used, and the team behind its development. This page serves both as documentation for new users understanding the platform and as an academic deliverable demonstrating the project's scope and objectives. The content covers the system's inspiration from Umamusume, the five-role architecture, and the educational goals of the project within the FPT College curriculum.
4.3 Terms and Service
The Terms and Service page outlines the legal and operational rules governing the use of the EquiX platform. Key provisions include the academic nature of the guess/betting system (explicitly labeled as 'Guess' rather than gambling to comply with legal requirements), the responsibilities of each user role, data usage policies, and dispute resolution procedures. The page also covers the grace period rules for race withdrawal, the finality of Admin-confirmed results, and the disqualification appeal process. All users must accept these terms during registration.
4.4 Login
The Login page provides a secure authentication interface where users enter their registered email and password. Upon successful authentication, the backend returns a JWT token containing the user's ID, role, and token expiration. The frontend stores this token and redirects the user to their role-specific dashboard. If the user's account has not yet been confirmed by the Admin (for Horse Owner and Jockey roles), the system displays a notification indicating that their account is pending approval. Failed login attempts return generic error messages to prevent account enumeration attacks. The login page also provides a link to the registration page for new users.
4.5 Register
The Registration page allows new users to create accounts in one of three publicly available roles: Horse Owner, Jockey, or Spectator. The registration form collects basic information including full name, email address, password, and role selection. Upon submission, the system creates the account with a 'Pending' status for Horse Owner and Jockey roles, requiring Admin confirmation before the account becomes active. Spectator accounts are activated immediately upon registration without requiring Admin approval, as this role has the least system impact and no potential for abuse of privileged operations. Race Referee accounts cannot be created through this page.
 5. Horse Owner Business Flows
5.1 Dashboard
The Horse Owner Dashboard provides a comprehensive overview of all information relevant to the horse owner's activities within the EquiX system. Upon logging in, the horse owner is presented with summary cards displaying: the total number of horses they own (categorized by status), current active pairings with jockeys, upcoming races their horses are registered for, recent race results, and any pending jockey invitations. The dashboard uses visual indicators with the Red/Green color scheme to highlight important items such as horses without assigned jockeys (red) or horses eligible for race registration (green). Quick-action buttons allow the owner to navigate directly to horse management, jockey hiring, or race registration pages.
5.2 Races
The Races page is the central hub for horse owners to interact with the racing system. It provides three primary functions: registering available horses into upcoming races, viewing detailed race information, and viewing results of past races. The page displays a list of available races with filters for status (Upcoming, In Progress, Completed), race type (Sprint, Mile, Medium, Long), and date range. Each race card shows the race name, type, distance, scheduled date/time, current registration count, and prize pool. For ongoing races, a live view is available showing the countdown timer and current positions of participating horses.
5.2.1 Race Registration Flow
The race registration process follows a strict sequence of prerequisites and validations. Step 1: The horse owner must have at least one horse with 'Available' status. Step 2: The available horse must be paired with a jockey through the Jockey Tab (detailed in Section 5.4). Step 3: The pair (horse + jockey) can be registered for an upcoming race, provided the race has not reached its maximum capacity of 18 participants and registration has not closed (registration closes 1 week before the race date). Step 4: Upon successful registration, the pair's status changes to 'Registered' and the horse owner receives a confirmation notification. The system validates all constraints before allowing registration, including verifying that the jockey is not already assigned to another horse for the same race, that the horse is not already registered for a conflicting race, and that the minimum participant count of 6 can potentially be met.
5.3 Horse Management
The Horse Management page provides full CRUD (Create, Read, Update, Delete) operations for the horse owner's horses. Each horse record contains two categories of information: Display Information and Training Information. Display Information includes the horse's Name, Age, Weight, Breed, and a portrait image uploaded by the owner. Training Information includes the horse's current status (Training, Available, Unavailable, etc.) and their training Position, which is inspired by the Umamusume game but simplified to four options: Front (front-runner strategy), Pace (mid-pack pacing strategy), Late (late-charging strategy), or End (strong finisher strategy). The training Position is display-only and does not affect race outcomes, as race results are randomized within time ranges.
5.3.1 Horse Status Management
Horse status transitions follow a defined state machine. A newly created horse starts in 'Available' status. The owner can change status to 'Training' (indicating the horse is preparing and not available for pairing), 'Unavailable' (indicating injury, rest, or other reasons the horse cannot participate), or back to 'Available'. When a horse is paired with a jockey, the status automatically changes to 'Paired'. When a pair is registered for a race, the horse status changes to 'Registered'. After a race is completed and results finalized, the horse status returns to 'Available' unless the owner manually changes it. Status changes are logged with timestamps for audit purposes.
5.3.2 Horse Portrait Upload
The horse portrait upload feature allows owners to upload an image that serves as the horse's visual representation throughout the system. The portrait appears on race cards, leaderboard entries, and the horse's detail page. The upload accepts common image formats (JPEG, PNG, WebP) with a maximum file size of 5MB. Images are resized server-side to a standard display resolution to ensure consistent presentation across the application. The uploaded image replaces any existing portrait, and the previous image is removed from storage to prevent orphaned files.
5.4 Jockey Tab (Hiring)
The Jockey Tab is the interface through which horse owners hire or choose available jockeys to pair with their horses. The pairing process is a prerequisite for race registration: a horse must be paired with a jockey before the pair can be registered for any race. The page displays a list of jockeys who are currently available (not paired with another horse), along with their profile information, past race history, and achievement statistics. The horse owner selects an available horse from their stable, then selects an available jockey, and sends a pairing invitation. The jockey receives this invitation and can accept or decline it (detailed in Section 6.3). Only after the jockey accepts does the pairing become active.
5.5 Paired/Registered Management
The Paired/Registered Management page provides an overview of all current and historical pairings and race registrations for the horse owner's horses. This page serves as a central tracking point where the owner can see which horses are paired with which jockeys, which pairs are registered for upcoming races, and the outcomes of past race registrations. The page is organized into tabs: Active Pairings (currently paired, not yet in a race), Registered for Race (pairs registered for upcoming races), and History (completed race participations with results). For active pairings, the owner can initiate the withdrawal process if still within the grace period (3 to 7 days before the race, as defined by the tournament rules).
5.6 Leaderboard and Prizes
The Leaderboard page displays rankings of horses and their owners based on race performance. The leaderboard can be filtered by time period (monthly, seasonally, all-time) and race type (Sprint, Mile, Medium, Long, or combined). Each entry shows the horse's name, owner, total points, number of first/second/third place finishes, and total prize money earned. The Prizes section, which can be combined with the Leaderboard view, shows the winning prizes for each race where the owner's horse finished in the top three positions. Prize distribution follows the 60/30/10 split (detailed in Section 13). The leaderboard updates in real-time as race results are finalized by the Admin.
5.7 Personal Profile
The Personal Profile page allows the horse owner to view and edit their account information. Editable fields include full name, email address, profile picture, and contact information. The profile page also displays account status (Confirmed/Pending) and registration date. Password changes are handled through a separate form requiring the current password for verification. The profile picture upload follows the same constraints as horse portraits (JPEG/PNG/WebP, max 5MB). Changes to email address require re-verification to ensure the new email is valid and accessible by the owner.
6. Jockey Business Flows
6.1 Dashboard
The Jockey Dashboard provides a focused overview of the jockey's current status and upcoming commitments. Key information displayed includes: the current pairing status (which horse they are paired with, if any), upcoming race assignments, recent invitation history, and achievement highlights. The dashboard emphasizes actionable items such as pending invitations that require a response and upcoming race schedules that need preparation. Visual indicators use the Green color for active pairings and upcoming races, and Red for urgent items like expiring invitations or imminent race dates.
6.2 Personal Profile
The Jockey Personal Profile page is similar to the Horse Owner profile, allowing the jockey to edit their name, email, profile picture, and contact information. Additionally, the jockey profile displays their career statistics including total races participated in, win rate, and current ranking on the jockey leaderboard. The profile also shows the account's confirmation status, as jockey accounts require Admin approval before becoming active. The profile picture and personal information are visible to horse owners when they are browsing available jockeys for pairing.
6.3 Invitation System
The Invitation System is the core interaction mechanism between horse owners and jockeys. When a horse owner selects a jockey for pairing, an invitation is created and sent to the jockey. The invitation includes details about the horse (name, age, breed, training position), the owner's name, and any message from the owner. The jockey can either Accept or Decline the invitation. Upon acceptance, the pairing becomes active and both the horse and jockey become eligible for race registration. Upon declination, the horse owner is notified and can seek another jockey. The system maintains a complete history of all invitations sent and received, including the response and timestamp, providing both parties with a record of their interactions.
RULE: A jockey can only be paired with one horse at a time. The contract remains active until the assigned race is completed or the pairing is dissolved within the grace period. This one-to-one constraint ensures that jockey availability is accurately represented in the system.
	6.4 Horse View
The Horse View page shows the jockey's current paired horse (if any) along with a complete record of past pairings. For the current pairing, the page displays the horse's full profile including name, age, weight, breed, training position, portrait, and the owner's contact information. The past pairings section lists each historical pairing with the horse's name, the race they participated in, the race result, and the date. This provides the jockey with a comprehensive view of their career history and current commitments.
6.5 Race View
The Race View page displays all races assigned to the jockey through their current pairing. The primary view shows upcoming races with scheduled dates and times, allowing the jockey to prepare accordingly. Each race entry includes the race type (Sprint, Mile, Medium, Long), distance, scheduled time, and the paired horse's information. The jockey can also view live races they are currently participating in, with a real-time timer and position display. Past race results are accessible through a historical view that shows finishing positions and any relevant notes from the race report.
6.6 Achievements
The Achievements page focuses on the jockey's personal record of accomplishments. It displays a comprehensive list of past race participations with finishing positions, the horse they rode, and any highlights such as first, second, or third place finishes. The page includes a personal leaderboard ranking based on a points system, where points are awarded for race placements (higher points for better positions). Achievement badges are displayed for milestones such as 'First Win', 'Five Races Completed', 'Sprint Specialist', or 'Triple Crown' (winning three races of different types). The achievement system is primarily self-focused, providing the jockey with a sense of progression and accomplishment within the platform.
7. Race Referee Business Flows
The Race Referee role carries significant responsibility for the integrity and smooth execution of races. Referee accounts can only be created by the Admin, ensuring that only vetted and trusted individuals are granted this authority. The referee's duties span three distinct phases: pre-race management, live race monitoring, and post-race reporting. Each phase has dedicated pages and workflows designed to support the referee's decision-making process.
7.1 Pre-Race Management
The Pre-Race Management page allows the referee to view all upcoming races assigned to them and manage the status of registered horse-jockey pairs before the race begins. The page displays each pair's information including the horse's details, jockey's details, and registration status. The referee has the authority to disqualify a pair before the race, but this action requires a mandatory written reason (submitted through a form) and a confirmation dialog to prevent accidental disqualification. When a pair is disqualified, the system records the reason, the referee who made the decision, and the timestamp. The disqualified pair's status changes to 'Disqualified' and the horse and jockey become available for future pairings.
7.1.1 Disqualification Form Requirements
The disqualification form requires the following fields: Pair ID (auto-populated), Horse Name, Jockey Name, Reason for Disqualification (free-text, minimum 20 characters), Category (dropdown: Medical, Rule Violation, Equipment Failure, Administrative, Other), Severity (dropdown: Minor, Major, Critical), and Referee Notes (optional additional context). After submission, a confirmation dialog displays all entered information and requires the referee to explicitly confirm by typing 'CONFIRM' before the disqualification is processed. This two-step process prevents rash or accidental disqualifications that could unfairly impact participants.
7.2 Live Race Monitoring
The Live Race Monitoring page provides the referee with a real-time view of the race as it unfolds. The primary display shows a countdown timer indicating the remaining race time, the current positions of all participating horses, and any status indicators for incidents or violations. The referee can note down observations during the race using a dedicated notes interface. These notes are time-stamped and associated with specific race moments, creating an official record of the referee's observations. The notes interface includes quick-action buttons for common events such as 'Stumble', 'Interference', 'False Start', and 'Injury Observed', as well as a free-text field for detailed observations.
IMPORTANT: The referee has the authority to note violations during the race, but mid-race disqualification requires post-race processing through the report system. The referee cannot unilaterally stop a race; they can only document incidents for review in the post-race report.
	7.3 Race Confirmation
The Race Confirmation page allows the referee to confirm the completion of a race and review its basic details. The most recent race is displayed with priority at the top of the page, with past races accessible below. For each race, the referee reviews the finishing order, any incidents recorded during the race, and the list of disqualified participants (if any). The confirmation action moves the race status from 'Completed' to 'Report Ready', signaling to the Admin that the referee has reviewed the race and prepared their report. The confirmation includes a checkbox acknowledging that the referee has reviewed all incidents and notes, and a signature field for accountability.
7.4 Race Report
The Race Report page is the referee's comprehensive post-race documentation interface. It provides an overall view of the race including the official results, highlights of the winners (1st, 2nd, and 3rd place), penalties issued during the race, and a disqualification summary. The report includes a comparison of registered participants versus actual starters, noting any absences or disqualifications with the reason for each. For example: 'Race #12 - Spring Cup: 14 pairs registered, 12 actually raced. Pair #3 (Thunder/Jockey A) - Disqualified pre-race: Failed equipment check. Pair #11 (Storm/Rider B) - Did Not Start: Jockey illness.' This report is submitted to the Admin for review and serves as the basis for finalizing the race results.
8. Spectator Business Flows
8.1 Personal Profile
The Spectator Personal Profile page allows spectators to manage their account information, including name, email, profile picture, and preferences. Unlike Horse Owners and Jockeys, Spectators do not require Admin confirmation for account activation; their accounts are active immediately upon registration. The profile page also displays the spectator's guess history, including the number of guesses placed, correct guesses, and rewards received. This provides a gamification element that encourages continued engagement with the platform.
8.2 Dashboard
The Spectator Dashboard provides an overview of the racing world from the spectator's perspective. Key information includes: upcoming races with registration counts and prize pools, currently ongoing races with live status, the spectator's active guesses, recent race results, and a leaderboard snapshot. The dashboard is designed to maximize engagement by highlighting races that are open for guessing, showing real-time race status with countdown timers, and displaying the spectator's recent guess outcomes. Visual elements use the Red/Green color scheme to indicate guess outcomes (correct in green, incorrect in red) and race status (upcoming in green, in progress in red, completed in neutral).
8.3 Race Viewing
The Race Viewing page allows spectators to browse all races in the system. For each race, the spectator can view comprehensive information including the race type (Sprint, Mile, Medium, Long), distance, number of registered participants, prize pool amount, and the list of participating horse-jockey pairs with their basic profiles. For currently ongoing races, a live view is available showing the countdown timer and real-time position updates of all participating horses. The live view provides the same visual experience as a spectator watching a real race, with positions shifting dynamically as the race simulation progresses. Past races display final results, the race report summary, and the leaderboard impact.
8.4 Guess System (Betting)
The Guess System is the primary engagement mechanism for spectators, allowing them to predict the outcome of races. For academic purposes, this feature is explicitly named 'Guess' rather than 'Gambling' or 'Betting' to distinguish it from real-money wagering. Each spectator can place exactly one guess per race, selecting a single horse-jockey pair they believe will win. The guess can be modified at any time before the race enters 'Standby' status (the period just before the referee starts the race). Once the race enters Standby status, all guesses are locked and cannot be changed. This locking mechanism ensures fairness and prevents last-minute manipulation of guesses based on race-day developments.
8.4.1 Guess Placement Flow
Step 1: The spectator navigates to an upcoming race that is open for guessing (status: 'Registration Open' or 'Registration Closed' but not yet in 'Standby'). Step 2: The spectator selects a horse-jockey pair from the list of registered participants. Step 3: The system displays a confirmation dialog showing the selected pair and reminding the spectator that this is their one guess for this race. Step 4: Upon confirmation, the guess is recorded and the spectator can see their selection on the race page. Step 5: If the spectator wishes to change their guess, they can do so by repeating the process, which replaces the previous guess. Step 6: When the race enters Standby status, the guess is locked and the spectator sees a 'Locked' indicator next to their selection.
8.5 Live Race Viewing
The Live Race Viewing page provides spectators with a real-time view of ongoing races. The display features a visual representation of the racetrack with horse positions indicated by icons or markers, a prominent countdown timer showing the remaining race time, and a position leaderboard that updates dynamically. The visual design creates excitement and engagement, with smooth transitions as horse positions shift during the race simulation. Spectators who have placed a guess on a participating pair see their selected pair highlighted with a distinct visual indicator (such as a star or colored border) to easily track their prediction's progress throughout the race.
8.6 Guess Result Notification
After a race is completed and the Admin finalizes the results, spectators who placed guesses receive notifications about the outcome. The notification includes the race name, the finishing positions of the top three, whether the spectator's guess was correct, and if applicable, the reward they have received. The notification system delivers these updates through in-app notifications displayed on the spectator's dashboard and notification center. The notification content is specific: for a correct 1st place guess, it includes the horse goods image, link, and contact information; for 2nd place, a voucher code; for 3rd place, a complimentary drink coupon. Rewards are only distributed after the Admin confirms the race report and finalizes the results, ensuring that no premature awards are given for contested outcomes.
9. Admin Business Flows
9.1 Dashboard
The Admin Dashboard provides a comprehensive overview of the entire EquiX system. It displays summary statistics including: total users by role (with pending confirmation counts), active tournaments and races, pending race reports awaiting review, guess participation metrics, and system health indicators. The dashboard serves as the Admin's command center, with quick-action buttons for the most common administrative tasks: confirming new accounts, reviewing race reports, assigning referees, and managing guess awards. Visual indicators highlight items requiring immediate attention, such as races without assigned referees, accounts pending confirmation for more than 48 hours, or unresolved race reports.
9.2 Account/Role Management
The Account Management page is where the Admin reviews and confirms user registrations for Horse Owner and Jockey roles. When a user registers as a Horse Owner or Jockey, their account is created with a 'Pending' status and appears in the Admin's review queue. The Admin can view the registrant's information, approve the account (changing status to 'Active'), or reject the account (with a required reason). Rejected users receive a notification explaining the rejection. Additionally, the Admin can reassign roles within a dedicated Roles page, for example promoting a Spectator to a Horse Owner or creating a new Race Referee account. The Role Management page lists all users with their current roles, account status, and registration dates, with filters and search functionality for efficient management.
9.3 Tournament and Race Management
The Tournament Management page provides full CRUD operations for race tournaments. The Admin can create new tournaments by specifying the tournament name, description, start and end dates, and the list of races within the tournament. Each race within a tournament is configured with its type (Sprint, Mile, Medium, Long), scheduled date and time, maximum number of participants (6 to 18), and prize pool amount. The Admin can choose the race type and distance for each individual race, allowing tournaments to have mixed race types (a tournament could include both Sprint and Long races, for example). Races can be edited or deleted before registration opens, but once participants have registered, modifications are limited to prevent disruption.
9.3.1 Race Creation Form
The race creation form requires the following fields: Race Name, Tournament (dropdown of existing tournaments or option to create new), Race Type (Sprint: 1000-1400m, Mile: 1401-1800m, Medium: 1801-2400m, Long: 2401m+), Specific Distance (within the type's range), Scheduled Date and Time, Maximum Participants (6-18, default 12), Prize Pool Amount (currency, can be 0), Surface (always Turf), and Registration Deadline (automatically set to 1 week before the race date). After creation, the race appears in the system with 'Registration Open' status and becomes visible to horse owners for pair registration.
9.4 Pair Verification
The Pair Verification page allows the Admin to review and verify each registered horse-jockey pair in upcoming race tournaments. The page displays all pairs registered for each race, with their registration date, horse details, and jockey details. The Admin can verify pairs individually or in bulk, confirming that the registration meets all requirements. Unverified pairs are flagged with a warning indicator. The verification process serves as a final quality check before the race, ensuring that all participants are eligible and that no irregularities exist in the registration data. The Admin can also remove a pair from a race if verification reveals issues, which triggers a notification to the affected horse owner and jockey.
9.5 Jockey and Horse Management
The Admin has access to dedicated management pages for both Jockeys and Horses, or a combined management view. These pages list all jockeys and horses in the system with their current status, owner assignments, pairing history, and race participation records. The Admin can update horse or jockey status if necessary (for example, marking a horse as 'Suspended' due to doping allegations), view detailed profiles, and access participation history. This management capability ensures the Admin can maintain data integrity and address issues that fall outside the normal user-driven workflows.
9.6 Referee Assignment
The Referee Assignment page allows the Admin to assign a Race Referee to each created tournament or individual race. The page displays a list of available referees (those not already assigned to conflicting races on the same date) and the races requiring assignment. The Admin selects a referee for each race, and the system validates that the referee does not have overlapping assignments. Once assigned, the referee receives a notification with the race details, and the race status is updated to include the assigned referee information. The Admin can reassign referees if the originally assigned referee becomes unavailable, provided the race has not yet started.
9.7 Race Result Finalization
The result finalization process is the most critical Admin workflow, as it ensures the integrity of race outcomes. After a race finishes, the results are visible to all users but marked as 'Provisional' (not yet official). The Referee must first submit their race report, documenting any incidents, disqualifications, or observations. The Admin then reviews the referee's report alongside the race results. If the Admin is satisfied, they confirm the results, changing the status from 'Provisional' to 'Official'. Only after this confirmation are the results recorded in the official leaderboard, prizes distributed, and guess rewards calculated. If the Admin finds issues with the report, they can request revisions from the referee, which sends the report back to the referee for amendments.
9.8 Guess Management
The Guess Management page provides the Admin with visibility into the spectator guessing system. The Admin can view the number of guesses placed on each horse-jockey pair for each race, review the distribution of guesses across all participants, and confirm the 1st, 2nd, and 3rd place winners for reward distribution. After confirming the race results, the Admin triggers the guess reward distribution process: spectators who correctly guessed the 1st place winner receive horse goods (image + link + contact info), 2nd place guessers receive a voucher, and 3rd place guessers receive a complimentary drink coupon. The Admin can also view aggregate statistics on guess participation and accuracy across the platform.
10. Race System Mechanics
The race system in EquiX is designed to provide an engaging visual experience while maintaining simplicity in its underlying simulation. Drawing inspiration from the Umamusume game, the system categorizes races into four types based on distance, each with characteristic time ranges. The simulation uses a randomized timer approach where positions shift dynamically during the race, creating excitement and unpredictability for spectators watching the live view.
10.1 Race Types and Distance Categories
Race Type
	Distance Range
	Approximate Duration
	Min/Max Participants
	Sprint
	1,000 - 1,400 m
	~1:07 - 1:09
	6 - 18
	Mile
	1,401 - 1,800 m
	~1:30 - 1:33
	6 - 18
	Medium
	1,801 - 2,400 m
	~1:57 - 2:00
	6 - 18
	Long
	2,401+ m
	~3:14 - 3:18
	6 - 18
	All races are run on Turf surface only; there is no Dirt surface option in the system. Each race consists of a single round (not multiple heats), and the number of races in a tournament is variable and determined by the Admin during tournament creation. The time ranges are approximate targets for the race simulation timer, with the actual duration being randomized within these ranges for each race instance.
10.2 Race Simulation and Timer System
The race simulation operates on a countdown timer mechanism. When the referee starts the race, the system calculates a random total duration within the appropriate range for the race type. For example, a Sprint race would have a random duration between approximately 67 and 69 seconds. The timer then counts down from this total duration, and during the countdown, the positions of the 1st, 2nd, and 3rd place horses shift randomly at intervals. This creates the visual impression of a competitive race where positions are constantly changing, similar to watching a real horse race unfold. Other horses' positions (4th through last) are also tracked and shift, but with less dramatic changes to maintain visual realism.
The position randomization follows a weighted algorithm that tends to favor certain pairs slightly more than others, creating a sense of momentum and narrative during the race. However, the ultimate finishing order is determined by the randomization at the moment the timer reaches zero, meaning that any horse could theoretically win regardless of their position during the middle of the race. This design choice ensures that the outcome remains unpredictable until the very end, maximizing spectator engagement and the excitement of the guess system.
10.3 Race Status Lifecycle
Each race progresses through a defined lifecycle of statuses: 'Draft' (created but not yet open for registration), 'Registration Open' (horse owners can register pairs), 'Registration Closed' (registration deadline passed, 1 week before race), 'Standby' (race is about to start, guesses are locked), 'In Progress' (referee has started the race, timer is running), 'Completed' (timer has finished, provisional results available), 'Report Ready' (referee has submitted their report), and 'Official' (Admin has confirmed results, prizes distributed, guess rewards sent). Each status transition triggers notifications to relevant users and enables/disables specific features and actions.
KEY RULE: The Admin creates and configures races but does NOT start them. Only the assigned Race Referee can initiate the race start, transitioning the status from Standby to In Progress. This separation of duties ensures that the person overseeing the race is the one who triggers it, preventing premature or unauthorized race starts.
	11. Jockey-Horse Pairing System
The Jockey-Horse Pairing System is the foundational mechanism that enables race participation. In the EquiX system, a horse cannot participate in a race unless it is paired with a jockey, and a jockey cannot participate unless paired with a horse. This one-to-one pairing constraint ensures that each race entry consists of a complete and valid unit, preventing situations where a horse is registered without a rider or vice versa.
11.1 Pairing Contract Model
Each pairing operates on a contract model: when a jockey accepts a horse owner's invitation, a pairing contract is established between them. This contract remains active until the pair's assigned race is completed and results are finalized, at which point the contract is automatically dissolved and both the horse and jockey return to 'Available' status. The contract model ensures stability in race planning, as a paired jockey cannot be hired by another horse owner while under contract. The pairing record, including the invitation details, acceptance timestamp, and race outcome, is permanently stored in the system for historical reference.
11.2 Pairing Rules and Constraints
The pairing system enforces several critical rules to maintain data integrity and fairness. First, a jockey can only be paired with one horse at a time; attempting to send an invitation to an already-paired jockey is blocked by the system. Second, a horse can only be paired with one jockey at a time; a horse that is already paired cannot receive additional invitations. Third, only horses with 'Available' status can be paired; horses in 'Training', 'Unavailable', or already 'Registered' status are excluded from the pairing pool. Fourth, the pairing must be established before the registration deadline for any race the pair wishes to enter.
11.3 Grace Period and Withdrawal
The grace period defines the window during which a horse owner or jockey can withdraw from a registered race without penalty. The grace period extends from 3 days to 1 week before the scheduled race date. During this period, the withdrawing party must submit a withdrawal request through the system, which automatically notifies the other party in the pair and the race administrators. After the grace period ends (less than 3 days before the race), withdrawals are not permitted except in extraordinary circumstances, which require Admin approval. When a withdrawal occurs within the grace period, the pair's registration is cancelled, the pairing contract is dissolved, and both the horse and jockey return to 'Available' status, potentially allowing them to form new pairings for other races.
12. Spectator Guess System
The Spectator Guess System (academically referred to as 'Guess' rather than 'Betting' or 'Gambling') is the primary engagement and gamification mechanism for spectators within the EquiX platform. It allows spectators to predict race outcomes, creating investment in the race results and enhancing the viewing experience. The system is designed with strict rules to maintain fairness and prevent manipulation.
12.1 Betting Rules and Constraints
Each spectator can place exactly one guess per race, selecting a single horse-jockey pair they believe will finish in the top positions. The guess is not limited to predicting the exact finishing position; rather, rewards are distributed based on where the selected pair actually finishes. A spectator can modify their guess at any time before the race enters Standby status, but once Standby is activated, all guesses for that race are permanently locked. The system prevents multiple guesses from the same spectator for the same race, and attempts to circumvent this through multiple accounts are addressed by the terms of service. Spectators do not need to 'join' a race separately; having a spectator account and navigating to the race page is sufficient to place a guess.
12.2 Lock Mechanism
The guess locking mechanism is triggered automatically when the race status transitions to 'Standby'. This transition occurs when the race is about to begin, signaled by the referee preparing to start the race. At the moment of transition, the system iterates through all guesses for the race and sets their status from 'Open' to 'Locked'. Locked guesses are displayed with a visual 'Locked' indicator and cannot be modified or deleted by the spectator. The lock mechanism is implemented as a database-level constraint to prevent race conditions where a spectator might attempt to change their guess at the exact moment of locking.
12.3 Reward Distribution
Rewards are distributed only after the Admin confirms and finalizes the race results. The distribution is based on where the spectator's guessed pair finishes in the official results. The three reward tiers are: First Place (the guessed pair finishes 1st): Horse goods including a branded image, a merchandise link, and contact information for the horse's owner or stable. Second Place (the guessed pair finishes 2nd): A voucher code that can be redeemed for platform merchandise or future race access. Third Place (the guessed pair finishes 3rd): A complimentary drink coupon valid at race event venues or partner establishments. Spectators whose guessed pair finishes outside the top three receive no reward. All rewards are distributed electronically through the platform's notification system.
12.4 Award Types Detail
Finishing Position
	Reward Type
	Contents
	Delivery Method
	1st Place
	Horse Goods Package
	Branded image + merchandise link + contact info
	In-app notification with download link
	2nd Place
	Voucher
	Redemption code for merchandise or race access
	In-app notification with voucher code
	3rd Place
	Complimentary Drink
	Coupon code for partner venue
	In-app notification with coupon code
	4th or lower
	None
	No reward
	In-app notification of result only
	13. Prize Pool System
The Prize Pool System in EquiX operates as a display-only mechanism controlled entirely by the Admin. Unlike traditional horse racing where prize pools are accumulated from entry fees or betting pools, the EquiX prize pool is set by the Admin during race creation and serves primarily as a motivational and informational element displayed to participants and spectators. The prize pool amount does not directly affect the guess reward system, which has its own separate reward tiers.
13.1 Display-Only Model
The prize pool is set during race creation by the Admin and is displayed on race cards, the race detail page, and the leaderboard. The amount is a fixed value in the system's currency that does not change based on the number of participants or guesses. The Admin can set the prize pool to any non-negative value, including zero (though a zero prize pool may reduce participant and spectator engagement). The display-only nature means that the prize pool is not connected to any real financial transaction system; it exists as a data point for informational purposes and to enhance the realism and competitiveness of the platform.
13.2 Distribution Mathematics (60/30/10 Split)
When a prize pool is set, the distribution follows a fixed percentage split among the top three finishers. The first-place horse's owner receives 60% of the total prize pool. The second-place horse's owner receives 30%. The third-place horse's owner receives 10%. This distribution is calculated and displayed after the race results are finalized. For example, if the prize pool is 1,000,000 VND, the distribution would be: 1st Place = 600,000 VND, 2nd Place = 300,000 VND, 3rd Place = 100,000 VND. Rounding follows standard mathematical rules: if the split results in a fractional amount, it is rounded to the nearest whole unit with the remainder allocated to the first place.
Prize Distribution Formula:
  First  = Math.round(PrizePool * 0.60)
  Second = Math.round(PrizePool * 0.30)
  Third  = PrizePool - First - Second
  // Remainder goes to First to ensure total = PrizePool
14. Race Result Finalization Chain
The Race Result Finalization Chain is the most critical process in the EquiX system, ensuring the integrity and official status of race outcomes. This chain involves multiple roles and validation steps, creating a system of checks and balances that prevents premature result publication, erroneous data entry, or unilateral manipulation of outcomes.
14.1 End-to-End Flow
The finalization chain follows a strict sequential process with defined transitions and role-specific actions. The chain begins when the race timer reaches zero and the simulation produces provisional finishing positions for all participants. At this point, the results are visible to all users but marked with a 'Provisional' banner, indicating they are not yet official. The referee then reviews the race, documents any incidents or violations, and submits their official race report. The Admin receives the report and reviews it alongside the provisional results. If everything is in order, the Admin confirms the results, transitioning them to 'Official' status. Only then are the results recorded in the leaderboard, prize pools distributed, and guess rewards calculated and sent.
14.2 Status Transitions
Status
	Description
	Triggered By
	Visible To
	Actions Enabled
	Provisional
	Race finished, positions determined by simulation
	System (timer reaches zero)
	All users (with Provisional banner)
	Referee can draft report
	Report Submitted
	Referee has submitted the race report
	Referee
	Referee and Admin
	Admin can review report
	Under Review
	Admin is reviewing the report and results
	Admin
	Admin only
	Admin can confirm or request revision
	Revision Requested
	Admin found issues, report sent back to referee
	Admin
	Referee and Admin
	Referee must amend report
	Official
	Admin confirmed results, final status
	Admin
	All users (Official label)
	Prizes distributed, rewards sent
	14.3 Admin Rejection and Loop-Back
If the Admin finds issues with the referee's report (such as inconsistent disqualification records, missing incident documentation, or conflicting observations), the Admin can request a revision. This action sends the report back to the referee with specific notes on what needs to be amended. The referee then updates the report and resubmits it, restarting the Admin review process. This loop-back mechanism ensures that the finalization chain does not produce official results until all parties are satisfied with the documentation. There is no limit on the number of revision cycles, though the system logs each revision for audit purposes. In practice, revision requests should be rare if the referee follows proper documentation procedures during the race.
MANDATORY: The race result finalization chain is a mandatory process. Results CANNOT bypass the referee report or Admin confirmation steps. Even if a race has no incidents or disqualifications, the referee must still submit a minimal report confirming clean race execution before the Admin can finalize.
	15. Critical Business Rules Summary
This section consolidates all hard business rules that must be enforced by the EquiX system. These rules are non-negotiable constraints that the application logic must validate at every relevant interaction point. Violation of any of these rules represents a system defect that must be corrected before deployment.
15.1 Numbered List of Hard Rules
R01: One jockey can be paired with only one horse at a time. A jockey already in an active pairing cannot receive new invitations.
R02: One horse can be paired with only one jockey at a time. A horse already in an active pairing cannot be offered for new invitations.
R03: A horse-jockey pair must exist before either can be registered for a race. Unpaired horses and unpaired jockeys are ineligible for race registration.
R04: Race registration closes exactly 1 week before the scheduled race date. No registrations are accepted after this deadline.
R05: Minimum 6 and maximum 18 horse-jockey pairs per race. Races with fewer than 6 registered pairs at the registration deadline are flagged for Admin review.
R06: Each spectator can place exactly one guess per race. Multiple guesses from the same spectator for the same race are prohibited.
R07: Guesses are locked when the race enters Standby status. No modifications to guesses are permitted after this point.
R08: Race Referee accounts can only be created by the Admin. There is no public registration path for the Referee role.
R09: Horse Owner and Jockey accounts require Admin confirmation before activation. Pending accounts cannot access role-specific features.
R10: Spectator accounts are activated immediately upon registration without Admin confirmation.
R11: Only the assigned Race Referee can start a race (transition from Standby to In Progress). Admin cannot start races.
R12: Race results are Provisional until the Referee submits a report AND the Admin confirms. Neither step can be skipped.
R13: Disqualification of a horse-jockey pair requires a mandatory written reason and confirmation dialog. No exception.
R14: The grace period for race withdrawal is 3 to 7 days before the scheduled race date. Withdrawals after this period require Admin approval.
R15: Prize pool distribution follows the 60/30/10 split: 60% for 1st place, 30% for 2nd place, 10% for 3rd place.
R16: Guess rewards are distributed only after the Admin confirms the race results. No rewards are given for provisional results.
R17: The pairing contract between a jockey and horse remains active until the assigned race is completed and results are finalized.
R18: Race duration is randomized within the defined range for each race type (Sprint: ~1:07-1:09, Mile: ~1:30-1:33, Medium: ~1:57-2:00, Long: ~3:14-3:18).
R19: All races are on Turf surface only. No Dirt surface option exists in the system.
R20: One referee is assigned per race. A referee cannot be assigned to overlapping races on the same date.
R21: Horse training Position (Front, Pace, Late, End) is display-only and does not influence race outcomes.
R22: Race positions (1st, 2nd, 3rd) shift randomly during the simulation until the timer reaches zero.
R23: Correct guess rewards: 1st = horse goods (image + link + contact), 2nd = voucher, 3rd = complimentary drink coupon.
R24: The Admin can set the prize pool to any non-negative value, including zero.
R25: Only after Admin finalization are results recorded in the leaderboard, prizes distributed, and guess rewards sent.
16. Criticism, Gaps and Suggestions
This section provides a comprehensive analysis of the identified gaps, ambiguities, and potential issues in the EquiX system's business logic. Each gap is rated by severity (Critical, High, Medium, Low) and includes a concrete scenario illustrating the problem, an analysis of its impact, and a specific recommendation for resolution. This analysis is essential for ensuring the system is robust, complete, and ready for implementation without logical inconsistencies or undefined behaviors.
16.1 No Password Reset / Account Recovery Flow
Severity: Critical
Scenario: A horse owner who has registered and been confirmed by the Admin forgets their password. They attempt to log in but cannot remember the credentials. There is currently no mechanism in the system for them to recover their account. They are effectively locked out of all their horses, pairings, and race registrations with no self-service recovery path. Their only option is to contact the Admin directly through an out-of-band channel (e.g., email or phone), which is not documented or standardized in the system.
Impact: Users who forget passwords are permanently locked out unless they have an alternative communication channel with the Admin. This creates a poor user experience and increases the administrative burden on the Admin, who must manually verify identity and reset passwords. For a system with multiple roles and time-sensitive operations (race registration, guess placement), being locked out during a critical window could result in missed opportunities that cannot be recovered.
Recommendation: Implement a standard password reset flow using email verification. When a user clicks 'Forgot Password', they enter their registered email address, and the system sends a time-limited reset link (valid for 15-30 minutes). Upon clicking the link, the user can set a new password. For security, the old password remains active until the reset link is used, and the user is notified via email if a password reset is requested on their account. Additionally, implement security questions as a secondary verification method for users who no longer have access to their registered email.
16.2 No Notification System Architecture
Severity: High
Scenario: A spectator places a guess on a horse, and the race concludes with the horse finishing in first place. The system needs to notify the spectator about their correct guess and deliver the reward. However, the specification only mentions that spectators should 'receive notification about guess results' without specifying the notification mechanism. Is this an in-app notification visible only when the user is logged in? An email sent to their registered address? A push notification on their mobile device? Or all of the above?
Impact: Without a defined notification architecture, users may miss critical time-sensitive information such as guess results, invitation responses, account confirmation status, or race schedule changes. The lack of specificity also makes it impossible to properly design the notification backend, as different mechanisms (in-app, email, push) require fundamentally different technical implementations. Furthermore, the notification requirements vary by role: a horse owner waiting for a jockey's invitation response needs near-real-time notification, while a spectator receiving guess results can tolerate some delay.
Recommendation: Implement a multi-channel notification system with the following architecture. Primary channel: In-app notifications displayed on the user's dashboard and in a dedicated notification center, persisted in the database until read. Secondary channel: Email notifications for critical events (account confirmation, race result finalization, guess rewards). Optional channel: Push notifications for real-time events (race starting, invitation received) if the user has enabled browser notifications. Define a notification priority matrix: Critical (account confirmation, disqualification) = in-app + email; Important (invitation, race start) = in-app + optional push; Informational (result available, leaderboard update) = in-app only.
16.3 No Explicit Race Tie/Dead Heat Handling
Severity: High
Scenario: During a Sprint race, the randomized position algorithm produces identical finishing times for two horses. The timer reaches zero, and the final position calculation shows Horse A and Horse B with the exact same time at the 1st place position. The current specification does not define what happens in a dead heat. Does the system assign both as 1st place? Does it randomly break the tie? Does it merge the prize money for 1st and 2nd and split it equally? What happens to the guess rewards if a spectator guessed one of the tied horses for 1st place?
Impact: Dead heats, while statistically unlikely in a randomized system, are possible and must be handled explicitly. Without a defined rule, the system could crash, produce inconsistent data, or create disputes between participants. The prize distribution math (60/30/10 split) assumes a single horse in each position and cannot accommodate ties without modification. The guess reward system also assumes unambiguous finishing positions.
Recommendation: Define explicit dead heat rules: (1) For prize money, merge the relevant positions' shares and split equally. If two horses tie for 1st, they each receive (60% + 30%) / 2 = 45% of the prize pool, and the next finisher receives 10% (the 3rd place share). (2) For guess rewards, any spectator who guessed either tied horse for the tied position receives the full reward for that position. (3) For leaderboard scoring, both tied horses receive the full points for the tied position. (4) In the race simulation algorithm, add a tiebreaker using a secondary random factor (e.g., a random millisecond offset) to minimize the frequency of dead heats while still allowing them as a rare possibility.
16.4 No Horse Injury/Withdrawal During Race Mechanic
Severity: Medium
Scenario: During a live race, Horse C stumbles and appears injured. The referee notes the incident in their race log. However, the race simulation continues, and Horse C's position keeps shifting randomly as if nothing happened. There is no 'Did Not Finish' (DNF) status for horses that are unable to complete the race. The final results show Horse C in 7th place, which is clearly inaccurate if the horse did not actually cross the finish line.
Impact: Without a DNF mechanism, the race results may not accurately reflect what actually happened during the race. This is especially problematic when the referee has documented an injury or incident, as the system produces results that contradict the official observations. Spectators who guessed on the injured horse have no way to understand why their guess failed, and the leaderboard records an inaccurate finishing position.
Recommendation: Add a DNF (Did Not Finish) status that the referee can apply during or after the race. When a horse is marked as DNF, it is removed from the active position tracking and listed separately in the results as 'DNF - [Reason]'. The horse does not receive a numerical finishing position. For the simulation, once the referee marks a horse as DNF, the system stops generating position updates for that horse and fixes its final status. The horse's owner is automatically notified of the DNF designation, and the horse's status is set to 'Unavailable' pending veterinary clearance. The DNF does not count as a disqualification and does not carry the same penalties.
16.5 Referee Unavailability
Severity: High
Scenario: Three days before Race #7, the assigned referee falls ill and cannot attend. The system has no mechanism for the referee to indicate unavailability, and the Admin is not automatically notified. On race day, no referee is present to start the race or monitor it. The race cannot transition from Standby to In Progress, leaving all registered pairs and spectators in limbo.
Impact: Without a substitute referee mechanism, a race may be delayed or cancelled due to referee unavailability. This cascades into scheduling conflicts for horse owners, jockeys, and spectators who have committed to the race date. The guess system is also affected, as guesses are locked during Standby and cannot be unlocked if the race is postponed.
Recommendation: Implement a three-part solution: (1) A referee availability management feature where referees can mark dates as unavailable, which automatically alerts the Admin. (2) A standby referee pool where the Admin can designate backup referees for each tournament or race. (3) An automated notification system that alerts the Admin when a referee becomes unavailable within 48 hours of a scheduled race, prompting immediate reassignment. If no replacement referee is available, the Admin can postpone the race by up to 48 hours, during which all guesses remain locked and all registered pairs retain their registration.
16.6 All Spectators Guess Wrong
Severity: Low
Scenario: In a race with 18 participants where an unexpected horse wins, none of the spectators guessed the correct 1st place finisher. The 'Horse Goods' reward for 1st place goes undistributed. Similarly, if no one guessed the 2nd or 3rd place horses, those vouchers and drink coupons also go undelivered. The specification does not address what happens to undistributed awards.
Impact: While not a critical system failure, undistributed rewards represent a gap in the business logic. If rewards are physical items (merchandise, vouchers), the question becomes whether they are voided, carried over to the next race, or distributed through an alternative mechanism. This affects both the user experience (no one wins, reducing engagement) and the administrative process (what to do with the unused rewards).
Recommendation: Define explicit rules for undistributed rewards: (1) Undistributed rewards are voided for that race and do not carry over. (2) The system displays a message indicating that no spectator guessed correctly for that position. (3) As an engagement boost, consider implementing a 'Consolation Prize' mechanic where one random spectator who participated (regardless of accuracy) receives a small reward, ensuring that participation is always potentially rewarding. This encourages continued engagement even when races have unpredictable outcomes.
16.7 Race Cancellation Flow
Severity: High
Scenario: A race is scheduled for Saturday, and 10 pairs have registered. On Thursday, severe weather is forecast for Saturday. The Admin decides the race should be cancelled, but the system has no cancellation flow. The registered pairs cannot withdraw because the grace period has passed (it is within 3 days of the race). Spectators who have placed guesses cannot change them because the race is in Standby. The race simply sits in the system with no path to resolution other than waiting for the scheduled time to pass.
Impact: Without a race cancellation flow, the system cannot handle real-world scenarios that require races to be cancelled (weather, insufficient participants after disqualifications, facility issues, etc.). This creates a deadlock where the race status cannot be properly resolved, and all associated data (registrations, guesses, pairings) remains in an ambiguous state. The Admin's only option would be to manually manipulate the database, which is error-prone and unacceptable for a production system.
Recommendation: Implement a race cancellation flow with the following steps: (1) The Admin can cancel a race at any point before it starts, providing a mandatory reason. (2) All registered pairs are automatically unregistered and their pairing contracts are either dissolved (if the race was their only commitment) or maintained (if they have other upcoming races). (3) All guesses for the cancelled race are voided and removed from spectators' guess history. (4) Notifications are sent to all affected parties: horse owners, jockeys, spectators, and the assigned referee. (5) The cancelled race is marked with 'Cancelled' status and remains visible in the system with the cancellation reason. (6) If the race is part of a tournament, the Admin can choose to reschedule it within the tournament period or remove it from the tournament entirely.
16.8 Grace Period Ambiguity
Severity: Critical
Scenario: The specification states the grace period is '3 days to 1 week' before the race. This is too vague for implementation. If a race is on Saturday, does the grace period start on Tuesday (3 days before) or the previous Saturday (1 week before)? Who decides within this range? Is it configurable per tournament? Per race? Without a concrete number, developers must make implementation decisions that may not align with the business intent, and users cannot know their exact withdrawal rights.
Impact: Ambiguous grace periods create confusion for users and implementation inconsistency for developers. A horse owner might believe they have until 3 days before the race to withdraw, while the system enforces a 7-day cutoff. This mismatch leads to user frustration and potential disputes. Additionally, the grace period affects the guess locking mechanism: if a horse withdraws after guesses are locked but before the race starts, spectators who guessed on that horse are penalized through no fault of their own.
Recommendation: Define the grace period as exactly 5 days (120 hours) before the scheduled race start time. This provides a concrete, implementable value that is roughly in the middle of the '3 days to 1 week' range. The 5-day grace period is automatically calculated from the race's scheduled start time and displayed to users during registration. Make the grace period configurable at the tournament level (Admin can set 3, 5, or 7 days per tournament) with a system default of 5 days. The grace period end is always calculated as [Race Start Time] minus [Grace Period Hours], ensuring precision down to the hour.
16.9 No Tournament Structure
Severity: High
Scenario: The Admin is creating a 'Spring Championship' tournament. They need to define how multiple races form this tournament and how overall tournament standings are calculated. The specification mentions that the Admin 'manages tournaments' and can 'choose what kind of race, when, etc.' but does not define how individual race results contribute to tournament standings. If Horse A wins the Sprint race and Horse B wins the Mile race, who is leading the tournament? How are tournament champions determined?
Impact: Without a tournament structure, the 'tournament' concept is merely a label applied to a collection of races. There is no way to determine an overall tournament winner, no tournament-level scoring, and no meaningful aggregation of results across races. This makes the tournament feature feel hollow and reduces the competitive incentive for horse owners to participate in multiple races within a tournament.
Recommendation: Define a tournament scoring system: (1) Each race within a tournament awards points based on finishing position: 1st = 10 points, 2nd = 6 points, 3rd = 4 points, 4th = 2 points, 5th = 1 point, 6th and below = 0 points. (2) The tournament leaderboard aggregates points across all races in the tournament. (3) The horse-jockey pair with the most points at the end of the tournament is the tournament champion. (4) In case of a tie, the pair with more 1st place finishes wins; if still tied, more 2nd place finishes, and so on. (5) The Admin can configure whether all races count equally or apply weighting (e.g., the final race counts double). This provides a meaningful tournament narrative while keeping the system simple enough for academic implementation.
16.10 Jockey Decline at Last Minute
Severity: High
Scenario: A jockey accepts an invitation to pair with a horse for Race #5, scheduled for tomorrow. The pair is registered and guesses have been placed. Today, the jockey sends a message declining the pairing due to a personal emergency. The horse now has no rider, and the pair is ineligible to race. The registration deadline has passed, so the horse owner cannot find a replacement jockey and register a new pair. The horse is effectively excluded from the race through no fault of the owner.
Impact: Late jockey withdrawals create an unfair situation for horse owners who have invested in preparing their horse for the race. The one-to-one pairing constraint means there is no backup mechanism, and the owner has no recourse. Additionally, spectators who guessed on this pair are disadvantaged, and the race may fall below the minimum participant count if multiple late withdrawals occur.
Recommendation: Implement a multi-layered solution: (1) Require jockeys to confirm their participation 24 hours before the race via an in-app check-in. (2) If a jockey fails to check in or explicitly declines within 48 hours of the race, the pairing is automatically dissolved and the horse owner is notified immediately. (3) Provide a 'Last-Minute Pairing' window: if a jockey withdraws within the grace period, the horse owner has 12 hours to find a new available jockey, even after the general registration deadline, through a special emergency pairing process. (4) If no replacement is found, the pair is withdrawn without penalty to the horse owner, and the pairing contract is dissolved. (5) Implement a jockey reliability score that tracks last-minute withdrawals, visible to horse owners during the jockey selection process.
16.11 Admin Account Confirmation Flow
Severity: Medium
Scenario: A user registers as a Horse Owner and waits for Admin confirmation. Days pass with no notification. The user does not know whether their account is pending review, has been rejected, or was never received by the system. They cannot access any horse owner features and have no visibility into the confirmation process. Eventually, they register again with a different email, creating a duplicate account problem.
Impact: Without a notification mechanism for account confirmation status, users are left in the dark about their ability to use the platform. This creates frustration, duplicate accounts, and increased support burden. For time-sensitive operations (registering for a race before the deadline), delayed confirmation can result in missed opportunities that damage the user's trust in the platform.
Recommendation: Implement a comprehensive account confirmation notification flow: (1) Upon registration, the user receives an immediate email confirming their registration and stating that their account is pending Admin review. (2) When the Admin approves the account, the user receives an email and in-app notification welcoming them to the platform and enabling their role-specific features. (3) If the Admin rejects the account, the user receives a notification with the rejection reason and instructions for appealing or re-applying. (4) Pending accounts older than 48 hours are automatically highlighted on the Admin dashboard for priority review. (5) The login page displays a clear message for pending accounts: 'Your account is pending Admin confirmation. You will be notified by email when your account is activated.'
16.12 Horse Stats vs. Random Race Results
Severity: Medium
Scenario: A horse owner carefully maintains their horse's profile, selecting the 'Front' training position and entering detailed information about age, weight, and breed. They expect these attributes to influence race outcomes. However, race results are entirely random, and the horse's stats have no effect on performance. The owner feels that their effort in managing the horse's profile is pointless, as any horse has an equal chance of winning regardless of its attributes.
Impact: The inconsistency between collecting detailed horse statistics and having completely random race results undermines the purpose of the horse management system. If stats do not matter, users may not invest effort in maintaining accurate horse profiles, reducing data quality. However, if stats influence outcomes, the system becomes pay-to-win (owners who invest more time in profile management gain an advantage), which may not be appropriate for an academic project.
Recommendation: Maintain the display-only nature of horse stats for the MVP (Minimum Viable Product) but add a clear disclaimer in the UI: 'Horse attributes are for display purposes and do not affect race outcomes.' For a future iteration, consider implementing a lightweight influence system where stats provide small probability modifiers rather than deterministic advantages. For example, a horse with 'Front' training position might have a 5% increased probability of leading in the early stages of a race, while 'Late' horses have a 5% increased probability of strong finishes. This creates the illusion of stats mattering without making the system deterministic or unfair.
16.13 Minimum Participants After Disqualification
Severity: High
Scenario: A race has exactly 6 registered pairs, meeting the minimum requirement. During pre-race inspection, the referee disqualifies 2 pairs for equipment violations. The race now has only 4 participants, below the 6-horse minimum. Can the race still proceed? The specification does not address this scenario, leaving the referee and Admin without guidance on how to handle the situation.
Impact: Running a race with fewer than the minimum participants violates the established business rule and may produce results that are not representative of competitive racing. However, cancelling the race at the last minute after all remaining participants have prepared and spectators have placed guesses is also problematic. Without a defined procedure, the system cannot automatically handle this situation, and human judgment must fill the gap, potentially leading to inconsistent decisions across different races and tournaments.
Recommendation: Define explicit rules for below-minimum scenarios: (1) If disqualifications reduce the participant count below 6 BEFORE the race enters Standby status, the race is automatically flagged for Admin review, and the Admin can choose to cancel the race or lower the minimum threshold for this specific race instance. (2) If disqualifications reduce the count below 6 AFTER Standby status (meaning the race is about to start or already in progress), the race proceeds with the remaining participants, and the situation is documented in the referee's report. (3) In all cases, the reduced participant count is visible to spectators, who may reconsider their engagement. (4) Prize pool distribution remains the same regardless of participant count, but the Admin can choose to reduce the prize pool proportionally.
16.14 Prize Pool of Zero
Severity: Low
Scenario: The Admin creates a race and sets the prize pool to 0, either intentionally (for a practice or exhibition race) or accidentally (forgetting to set the prize pool during race creation). When the race concludes, the 60/30/10 distribution produces 0 for each position. The leaderboard displays '0 VND' as the prize for all top-three finishers, which looks broken rather than intentional.
Impact: While a zero prize pool is technically valid (0 * 0.60 = 0), displaying zero prizes creates a poor user experience and may confuse participants who expect some form of reward. It also raises the question of whether a race with no prize pool should even display prize information.
Recommendation: Implement two improvements: (1) When the prize pool is 0, do not display the prize distribution section on the race card or results page. Instead, display a badge such as 'Exhibition Race - No Prize Pool' to clearly communicate the nature of the race. (2) Add a confirmation dialog when the Admin attempts to save a race with a 0 prize pool, asking 'This race has no prize pool. Is this intentional?' with options to proceed or go back and set an amount. This prevents accidental zero values while still allowing the Admin to create races without prizes when desired.
16.15 Spectator Account Confirmation
Severity: Low
Scenario: The specification states that Horse Owner and Jockey accounts require Admin confirmation but does not explicitly address whether Spectators also need confirmation. The assumption is that Spectators are activated immediately, but this is never stated as an explicit rule. A developer implementing the registration flow might apply the same confirmation requirement to all roles, inadvertently requiring Admin approval for Spectator accounts and creating a bottleneck.
Impact: If Spectators require Admin confirmation, the platform creates a barrier to entry for the largest user group. Spectators who want to quickly join and place guesses on an ongoing race would be blocked until the Admin manually approves their account. This reduces engagement and defeats the purpose of having a low-friction spectator experience.
Recommendation: Explicitly document in the system requirements that Spectator accounts are activated immediately upon registration without requiring Admin confirmation. Add this as a hard business rule (already included as Rule R10 in Section 15). Implement the registration flow with a conditional branch: if role is Spectator, set account status to 'Active' immediately; if role is Horse Owner or Jockey, set status to 'Pending'. This ensures that the development team implements the correct behavior without ambiguity.
16.16 No Audit Log
Severity: High
Scenario: A horse owner claims that they registered their horse for a race before the deadline, but the system shows no registration. Without an audit log, there is no way to verify whether the registration was attempted, whether it failed due to a system error, or whether the owner is mistaken. Similarly, if a jockey claims they never received an invitation, or a spectator claims their guess was changed without their consent, there is no record to investigate these disputes.
Impact: The absence of an audit log is a significant gap for any system that involves competitive outcomes and user interactions that affect those outcomes. Without audit trails, the system cannot resolve disputes, detect fraud, or provide accountability for administrative actions. For an academic project like SWP391, an audit log also demonstrates good software engineering practices and database design principles.
Recommendation: Implement a comprehensive audit log system that records: (1) All authentication events (login, logout, failed login attempts). (2) All CRUD operations on core entities (horses, pairings, races, guesses) with before/after values. (3) All status transitions (race status, account status, pairing status) with the user who triggered the transition and the timestamp. (4) All administrative actions (account confirmation, referee assignment, result finalization, disqualification). (5) All financial operations (prize distribution, reward issuance). The audit log should be stored in a separate database table with append-only access (no updates or deletes) and should be queryable by the Admin for dispute resolution and compliance reporting.
16.17 Mid-Race Disqualification Process
Severity: Medium
Scenario: During a race, the referee observes that Horse D has interfered with another horse, violating racing rules. The referee notes the violation in their race log. However, there is no defined process for what happens next during the race. Does the horse continue running with positions being tracked? Is the horse immediately removed from the position display? Or does the disqualification only take effect in the post-race report? The specification mentions that the referee can note violations but does not specify the process for DQ during a race.
Impact: Ambiguity in the mid-race disqualification process affects the live race experience for spectators, the accuracy of position tracking, and the referee's workflow. If disqualified horses continue to appear in the position display, spectators may be confused about the race status. If they are immediately removed, the visual experience is disrupted and may appear jarring.
Recommendation: Define a clear mid-race disqualification process: (1) During the race, the referee can flag a horse for disqualification by clicking a 'Flag for DQ' button next to the horse's name in the live monitoring interface. (2) The flagged horse continues to appear in the position display but is marked with a yellow warning indicator visible only to the referee. (3) Spectators and other users see no change during the race; the horse appears to continue normally. (4) After the race ends, the referee formally processes the disqualification in the race report, providing the required reason and confirmation. (5) The disqualified horse is then removed from the official finishing order and listed separately as 'Disqualified - [Reason]'. This approach preserves the live race experience while giving the referee the tools to document violations in real-time.
16.18 Race Result Finalization Chain — Admin Rejection Loop
Severity: Medium
Scenario: The referee submits a race report, and the Admin reviews it but finds inconsistencies (e.g., a horse is listed as disqualified in the report but still appears in the finishing order). The Admin requests revisions from the referee. The referee makes changes and resubmits, but the Admin finds new issues. This cycle could potentially continue indefinitely, preventing the race from ever reaching 'Official' status and blocking prize distribution and guess rewards.
Impact: An unbounded revision loop creates a deadlock scenario where race results remain perpetually in 'Under Review' status. Participants and spectators are left waiting for official results, and the system cannot move forward. While rare in practice, the possibility of an infinite loop must be addressed to ensure the system always reaches a resolution.
Recommendation: Implement guardrails for the finalization chain: (1) After the second revision request, the Admin is required to provide specific, itemized feedback for each issue rather than general comments. (2) After the third revision request, the system automatically escalates to a senior Admin or system moderator for arbitration. (3) Set a maximum time limit of 72 hours from race completion for the finalization process. If results are not finalized within this window, the system sends an urgent notification to all Admins and automatically transitions the results to 'Official' with a note that finalization exceeded the normal timeframe. (4) All revision cycles are logged in the audit trail for accountability.
16.19 Multiple Races Overlapping
Severity: Medium
Scenario: A tournament includes Race A at 10:00 AM and Race B at 11:00 AM on the same day. Can the same horse-jockey pair register for both races? The one-to-one pairing constraint means the pair is under contract until their assigned race is completed. If Race A finishes at 10:02 AM (a Sprint), can the pair then participate in Race B at 11:00 AM? The specification does not address whether the same pair can participate in multiple races on the same day.
Impact: Without explicit rules on same-day race participation, horse owners may attempt to register the same pair for overlapping or back-to-back races, creating scheduling conflicts and potential data integrity issues. If a pair is registered for two races that overlap in time, the system must handle the conflict, but no conflict detection mechanism exists.
Recommendation: Define explicit rules for same-day race participation: (1) A horse-jockey pair cannot register for races with overlapping time windows (from Standby to Completion). (2) After a pair's race is completed and results are finalized, the pair's contract is dissolved, and both horse and jockey return to Available status, potentially allowing them to form a new pairing for a later race on the same day. (3) However, re-pairing on the same day is not recommended for animal welfare reasons; add a system recommendation (not a hard block) that horses should have at least 4 hours of rest between races. (4) The Admin can override this recommendation by explicitly enabling same-day re-registration for specific races or tournaments.
16.20 Spectator Registration for a Race
Severity: Low
Scenario: A spectator wants to place a guess on an upcoming race. Do they need to 'join' or 'register' for the race first, or is simply navigating to the race page and selecting a pair sufficient? The specification does not clarify whether spectators need any form of race-specific registration, or if their platform account alone provides access to all races for guessing.
Impact: This ambiguity affects the implementation of the guess placement workflow. If a separate race registration is required, the UI needs an additional step and the database needs a Spectator-Race relationship table. If no registration is needed, the guess itself serves as the only interaction record.
Recommendation: Simplify the spectator experience: no separate race registration is required. A spectator with an active account can place a guess on any race by navigating to the race page and selecting a pair. The guess record itself serves as the link between the spectator and the race. This approach minimizes friction and maximizes engagement, which is the primary goal of the spectator role. If the system needs to track which races a spectator has viewed or interacted with (for analytics), this can be handled through passive interaction logging rather than explicit registration.
16.21 Referee Race-Notes Format
Severity: Medium
Scenario: During a live race, the referee needs to document observations. The specification mentions that the referee can 'note down and process any situations during the race period' but does not specify the format or fields of these notes. Without a defined form structure, the referee's notes may be inconsistent across races, making it difficult to compare reports, extract data for analytics, or ensure that critical information is always captured.
Impact: Inconsistent note-taking formats lead to incomplete or incomparable race documentation. One referee might note only major incidents, while another documents every minor observation. This inconsistency affects the quality of race reports and makes it harder for the Admin to review and compare reports across different races and referees.
Recommendation: Define a structured race-notes form with the following fields for each note entry: (1) Timestamp (auto-generated, precise to the second), (2) Race Time (auto-calculated from race start, e.g., '0:45 into race'), (3) Category (dropdown: Start, Position Change, Incident, Weather, Equipment, Injury, Interference, Other), (4) Affected Pair (dropdown of participating pairs, or 'General' for race-wide observations), (5) Severity (dropdown: Info, Warning, Critical), (6) Description (free-text, minimum 10 characters), (7) Action Taken (dropdown: None, Flagged for Review, Recommended DQ, Race Stopped). Additionally, provide quick-action buttons that auto-populate the Category and Severity fields for common events.
16.22 Horse Portrait Upload Specifications
Severity: Low
Scenario: A horse owner attempts to upload a 25MB RAW image file as their horse's portrait. The system accepts the upload without validation, storing the full 25MB file. Over time, the storage fills up with oversized images, and the race cards load slowly because the frontend must download large image files. Another owner uploads a BMP file, which is not supported by web browsers and fails to display.
Impact: Without upload specifications, the system is vulnerable to storage abuse, slow performance, and broken image displays. Large files consume storage and bandwidth, while unsupported formats create display errors that degrade the user experience.
Recommendation: Define and enforce the following upload specifications: (1) Allowed formats: JPEG, PNG, WebP only. Reject all other formats with a clear error message. (2) Maximum file size: 5MB. Reject larger files with guidance on resizing. (3) Minimum resolution: 200x200 pixels. Reject images that are too small. (4) Maximum resolution: 4096x4096 pixels. Automatically resize larger images to this maximum. (5) Server-side processing: resize all uploaded images to a standard display resolution of 400x400 pixels for the portrait view and 100x100 pixels for thumbnail views. Store the original and resized versions. (6) Storage architecture: use a CDN or object storage service (e.g., AWS S3, MinIO) for image storage, with the database storing only the image URL/path.
16.23 Leaderboard Calculation
Severity: Medium
Scenario: The leaderboard page displays horse rankings, but the calculation method is not defined. Is the leaderboard ranked by total number of wins? By points (1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt)? By total prize money earned? By win percentage? Each method produces different rankings, and without a defined calculation, the leaderboard may be implemented inconsistently or in a way that does not match stakeholder expectations.
Impact: An undefined leaderboard calculation makes it impossible to verify the correctness of leaderboard display or to implement the feature accurately. Different calculation methods favor different types of performance (consistent placing vs. occasional wins), and the choice affects user motivation and the competitive dynamics of the platform.
Recommendation: Define the leaderboard calculation as a points-based system: 1st place = 10 points, 2nd place = 6 points, 3rd place = 4 points, 4th place = 2 points, 5th place = 1 point, 6th and below = 0 points. This weighting rewards winning while still valuing consistent top-five finishes. The leaderboard displays: Rank, Horse Name, Owner Name, Total Points, Races Entered, 1st/2nd/3rd Place Count, Total Prize Money. Tie-breaking: (1) More 1st place finishes, (2) More 2nd place finishes, (3) More 3rd place finishes, (4) More races entered, (5) Higher prize money earned. The leaderboard can be filtered by time period and race type.
16.24 Training Horse Status Triggers
Severity: Low
Scenario: A horse owner sets their horse's status to 'Training' but never changes it back to 'Available'. The horse remains in 'Training' indefinitely, unable to be paired with a jockey or registered for races. The system does not prompt the owner to update the status or automatically transition it after a reasonable period. Conversely, an owner could immediately switch a horse from 'Unavailable' to 'Available' after an injury without any verification that the horse is actually fit to race.
Impact: Without defined triggers or constraints on status changes, horse owners can manipulate the status system arbitrarily. This could result in horses being perpetually unavailable (reducing the pool of racable horses) or horses being marked as available when they should not be (creating safety and fairness concerns).
Recommendation: Implement status change guidelines rather than hard restrictions (since horse welfare is ultimately the owner's responsibility): (1) Display a reminder notification if a horse has been in 'Training' status for more than 14 days, prompting the owner to review and update the status. (2) When changing from 'Unavailable' to 'Available', show a confirmation checkbox: 'I confirm this horse is fit and ready to race.' (3) Log all status changes in the audit trail. (4) The Admin can override horse status if there are concerns about accuracy or welfare. (5) A horse in 'Registered' status cannot have its status manually changed; it must complete the race or be withdrawn through the proper process first.
16.25 Race Type Within Tournament — Mixed Types
Severity: Low
Scenario: The Admin creates a tournament called 'Spring Championship' and wants to include both Sprint and Long races. The specification mentions four race types (Sprint, Mile, Medium, Long) but does not explicitly state whether a single tournament can contain mixed race types. If mixed types are allowed, the tournament leaderboard must account for the fact that different race types have different characteristics and durations, potentially making direct comparison unfair.
Impact: If mixed race types within a tournament are not explicitly addressed, developers might implement the system either way, leading to potential mismatches between business intent and system behavior. The tournament scoring system (if implemented per Gap 9) must also account for mixed types if they are allowed.
Recommendation: Explicitly allow mixed race types within a tournament. A tournament is a flexible container for races, and the Admin should have full control over which race types to include. This design is consistent with real-world horse racing tournaments, which typically feature a variety of race distances and types. The tournament leaderboard uses the same points system regardless of race type, but the UI should display race type labels next to each race entry in the leaderboard detail view, allowing users to understand the context of each result. For the tournament scoring system, consider adding an optional 'weighted points' mode where the Admin can assign different point multipliers to different race types (e.g., Long races count 1.5x) for more nuanced tournament standings.
16.26 Gap Analysis Summary
The analysis above identifies 25 gaps in the EquiX business logic specification, ranging from Critical issues that could cause system failure or data corruption (gaps 16.1, 16.8) to Low-severity issues that affect user experience or clarity (gaps 16.6, 16.14, 16.15, 16.20, 16.22, 16.24, 16.25). The most impactful category is High severity gaps, which represent missing functionality that could lead to system deadlocks, unfair outcomes, or inability to handle common real-world scenarios. Addressing these gaps before implementation begins will significantly reduce rework, improve system robustness, and ensure a more complete and professional deliverable for the SWP391 course.
Severity
	Count
	Gap IDs
	Critical
	2
	16.1 (Password Reset), 16.8 (Grace Period)
	High
	7
	16.2 (Notifications), 16.3 (Dead Heat), 16.5 (Referee Unavailability), 16.7 (Race Cancellation), 16.9 (Tournament Structure), 16.10 (Jockey Decline), 16.13 (Min Participants), 16.16 (Audit Log)
	Medium
	9
	16.4 (Horse Injury/DNF), 16.11 (Account Confirmation), 16.12 (Stats vs Random), 16.17 (Mid-Race DQ), 16.18 (Finalization Loop), 16.19 (Overlapping Races), 16.21 (Referee Notes), 16.23 (Leaderboard Calc)
	Low
	7
	16.6 (All Guess Wrong), 16.14 (Zero Prize), 16.15 (Spectator Confirm), 16.20 (Spectator Registration), 16.22 (Upload Specs), 16.24 (Status Triggers), 16.25 (Mixed Types)
	It is strongly recommended that all Critical and High severity gaps be addressed before the implementation phase begins. Medium severity gaps should be addressed during the detailed design phase, and Low severity gaps can be deferred to a post-MVP iteration. The total estimated effort to address all gaps is approximately 40-60 development hours, with the Critical and High gaps requiring roughly 20-30 hours of that total.
