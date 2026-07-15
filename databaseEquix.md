IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'EquiX')
BEGIN
    CREATE DATABASE [EquiX];
END
GO

USE [EquiX];
GO

-- 1. SYSTEM SETTINGS
CREATE TABLE system_settings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    setting_key NVARCHAR(100) NOT NULL,
    setting_value NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_setting_key UNIQUE (setting_key)
);

-- 2. USERS & AUTHENTICATION
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    role NVARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'HORSE_OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR')),
    status NVARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'SUSPENDED', 'TERMINATED')),
    reward_points INT DEFAULT 0,
    avatar_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT uk_user_username UNIQUE (username),
    CONSTRAINT uk_user_email UNIQUE (email)
);

CREATE TABLE password_reset_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash NVARCHAR(200) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. JOCKEY MANAGEMENT
CREATE TABLE jockey_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_races INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    availability_status NVARCHAR(20) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'PAIRED', 'INJURED')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_jp_user UNIQUE (user_id),
    CONSTRAINT fk_jp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE achievements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_achievement_name UNIQUE (name)
);

CREATE TABLE jockey_achievements (
    jockey_id BIGINT NOT NULL,
    achievement_id INT NOT NULL,
    awarded_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (jockey_id, achievement_id),
    CONSTRAINT fk_ja_jockey FOREIGN KEY (jockey_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ja_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- 4. HORSE MANAGEMENT
CREATE TABLE horses (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    horse_name NVARCHAR(100) NOT NULL,
    nickname NVARCHAR(100),
    registration_number NVARCHAR(50) NOT NULL,
gender NVARCHAR(20) NOT NULL CHECK (gender IN ('STALLION', 'MARE', 'GELDING')),
    breed NVARCHAR(50),
    age INT,
    color NVARCHAR(50),
    country_of_origin NVARCHAR(50),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    speed INT DEFAULT 0,
    stamina INT DEFAULT 0,
    acceleration INT DEFAULT 0,
    agility INT DEFAULT 0,
    pace_style NVARCHAR(50),
    health_status NVARCHAR(50) DEFAULT 'HEALTHY',
    injury_notes NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'TRAINING', 'UNAVAILABLE', 'PAIRED', 'REGISTERED', 'SUSPENDED')),
    total_races INT DEFAULT 0,
    total_wins INT DEFAULT 0,
    total_top3 INT DEFAULT 0,
    total_points INT DEFAULT 0,
    image_url NVARCHAR(500),
    description NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT uk_horse_registration UNIQUE (registration_number),
    CONSTRAINT fk_horse_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 5. TOURNAMENTS & RACES
CREATE TABLE tournaments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    location NVARCHAR(150),
    grace_period_hours INT DEFAULT 120,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status NVARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('DRAFT', 'OPEN', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL
);

CREATE TABLE races (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tournament_id BIGINT NOT NULL,
    race_name NVARCHAR(150) NOT NULL,
    race_type NVARCHAR(20) NOT NULL CHECK (race_type IN ('SPRINT', 'MILE', 'MEDIUM', 'LONG')),
    race_distance INT NOT NULL,
    track_condition NVARCHAR(50) DEFAULT 'Turf',
    race_date DATE NOT NULL,
    race_time TIME NOT NULL,
    registration_deadline DATETIME2 NOT NULL,
    total_lanes INT DEFAULT 8,
    prize_points DECIMAL(10,2) DEFAULT 0.00,
    weather NVARCHAR(50),
    location NVARCHAR(150),
    status NVARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'STANDBY', 'IN_PROGRESS', 'COMPLETED', 'REPORT_READY', 'OFFICIAL', 'CANCELLED')),
    referee_id BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT fk_race_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    CONSTRAINT fk_race_referee FOREIGN KEY (referee_id) REFERENCES users(id)
);

-- 6. PAIRING SYSTEM
CREATE TABLE jockey_invitations (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    race_id BIGINT,
    horse_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    jockey_id BIGINT NOT NULL,
    status NVARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    message NVARCHAR(MAX),
response_note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    responded_at DATETIME2 NULL,
    CONSTRAINT fk_ji_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_ji_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_ji_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_ji_jockey FOREIGN KEY (jockey_id) REFERENCES users(id)
);

CREATE TABLE pairing_contracts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    horse_id BIGINT NOT NULL,
    jockey_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    status NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REGISTERED', 'DISSOLVED')),
    created_at DATETIME2 DEFAULT GETDATE(),
    dissolved_at DATETIME2 NULL,
    CONSTRAINT fk_pc_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_pc_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT fk_pc_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 7. RACE REGISTRATIONS & EVENTS
CREATE TABLE race_registrations (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    race_id BIGINT NOT NULL,
    horse_id BIGINT NOT NULL,
    jockey_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    pairing_contract_id BIGINT,
    lane_number INT,
    status NVARCHAR(30) DEFAULT 'PENDING_ADMIN' CHECK (status IN ('PENDING_ADMIN', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
    owner_confirmed BIT DEFAULT 0,
    jockey_confirmed BIT DEFAULT 0,
    referee_approved BIT DEFAULT 0,
    health_check_status NVARCHAR(50) DEFAULT 'PENDING',
    referee_notes NVARCHAR(MAX),
    withdraw_reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT uk_rr_race_horse UNIQUE (race_id, horse_id),
    CONSTRAINT uk_rr_race_jockey UNIQUE (race_id, jockey_id),
    CONSTRAINT uk_rr_race_lane UNIQUE (race_id, lane_number),
    CONSTRAINT fk_rr_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_rr_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_rr_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT fk_rr_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_rr_pc FOREIGN KEY (pairing_contract_id) REFERENCES pairing_contracts(id)
);

CREATE TABLE race_results (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    race_id BIGINT NOT NULL,
    registration_id BIGINT NOT NULL,
    horse_id BIGINT NOT NULL,
    jockey_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    finish_position INT,
    finish_time_seconds DECIMAL(10,3),
    points_awarded INT DEFAULT 0,
    dnf BIT DEFAULT 0,
    disqualified BIT DEFAULT 0,
    violation_notes NVARCHAR(MAX),
    official BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uk_result_registration UNIQUE (registration_id),
    CONSTRAINT fk_res_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_res_reg FOREIGN KEY (registration_id) REFERENCES race_registrations(id),
CONSTRAINT fk_res_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_res_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT fk_res_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE race_notes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    race_id BIGINT NOT NULL,
    referee_id BIGINT NOT NULL,
    registration_id BIGINT,
    note_category NVARCHAR(30) NOT NULL CHECK (note_category IN ('START', 'POSITION_CHANGE', 'INCIDENT', 'WEATHER', 'EQUIPMENT', 'INJURY', 'INTERFERENCE', 'DQ', 'GENERAL')),
    severity NVARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    description NVARCHAR(MAX) NOT NULL,
    action_taken NVARCHAR(100),
    race_time_seconds INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_rn_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_rn_referee FOREIGN KEY (referee_id) REFERENCES users(id),
    CONSTRAINT fk_rn_reg FOREIGN KEY (registration_id) REFERENCES race_registrations(id)
);

-- 8. SPECTATOR & GUESS SYSTEM
CREATE TABLE predictions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    race_id BIGINT NOT NULL,
    spectator_id BIGINT NOT NULL,
    predicted_horse_id BIGINT NOT NULL,
    wager_points INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'VOIDED')),
    reward_points INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    settled_at DATETIME2 NULL,
    CONSTRAINT uk_pred_spectator_race UNIQUE (spectator_id, race_id),
    CONSTRAINT fk_pred_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_pred_spectator FOREIGN KEY (spectator_id) REFERENCES users(id),
    CONSTRAINT fk_pred_horse FOREIGN KEY (predicted_horse_id) REFERENCES horses(id)
);

-- 9. REWARD SYSTEM
CREATE TABLE reward_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(30) NOT NULL CHECK (name IN ('HORSE_GOODS', 'VOUCHER', 'DRINK_COUPON')),
    description NVARCHAR(255),
    CONSTRAINT uk_rt_name UNIQUE (name)
);

CREATE TABLE reward_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reward_type_id INT NOT NULL,
    race_id BIGINT,
    description NVARCHAR(MAX),
    awarded_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_rh_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_rh_type FOREIGN KEY (reward_type_id) REFERENCES reward_types(id),
    CONSTRAINT fk_rh_race FOREIGN KEY (race_id) REFERENCES races(id)
);

-- 10. COMMUNICATIONS & AUDIT
CREATE TABLE notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category NVARCHAR(50) NOT NULL,
    channel NVARCHAR(20) DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL', 'PUSH')),
    title NVARCHAR(150) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    deep_link NVARCHAR(500),
    is_read BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT,
    user_role NVARCHAR(50),
    action NVARCHAR(100) NOT NULL,
    entity_type NVARCHAR(100) NOT NULL,
    entity_id BIGINT,
    before_value NVARCHAR(MAX), 
    after_value NVARCHAR(MAX), 
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);