/*
  EquiX local demo seed for Microsoft SQL Server.

  Quick Login password for every account: 12345
  The database stores the BCrypt hash, never the plain-text password.

  Set @DryRun = 1 to test and roll back, or 0 to save the data.
*/
USE [EquiX];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @DryRun bit = 0;
DECLARE @PasswordHash nvarchar(255) =
    N'$2a$10$EpwUU2YYwTMD8vZIKYJYt.Df24309fztfkLClh..9zoyvzu7wdAai';

BEGIN TRY
    BEGIN TRANSACTION;

    MERGE dbo.users WITH (HOLDLOCK) AS target
    USING (VALUES
        (N'demo_admin',     N'Demo Administrator', N'demo-admin@equix.local',     N'ADMIN',       0),
        (N'demo_owner',     N'Demo Horse Owner',   N'demo-owner@equix.local',     N'HORSE_OWNER', 100),
        (N'demo_jockey',    N'Demo Jockey',        N'demo-jockey@equix.local',    N'JOCKEY',      100),
        (N'demo_referee',   N'Demo Referee',       N'demo-referee@equix.local',   N'REFEREE',     100),
        (N'demo_spectator', N'Demo Spectator',     N'demo-spectator@equix.local', N'SPECTATOR',   500)
    ) AS source(username, full_name, email, role, reward_points)
      ON LOWER(target.email) = LOWER(source.email)
    WHEN MATCHED THEN
        UPDATE SET
            target.username = source.username,
            target.password_hash = @PasswordHash,
            target.full_name = source.full_name,
            target.role = source.role,
            target.status = N'VERIFIED',
            target.reward_points = source.reward_points,
            target.deleted_at = NULL,
            target.updated_at = SYSDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (username, password_hash, full_name, email, role, status,
                reward_points, created_at, updated_at)
        VALUES (source.username, @PasswordHash, source.full_name, source.email,
                source.role, N'VERIFIED', source.reward_points,
                SYSDATETIME(), SYSDATETIME());

    DECLARE @OwnerId bigint = (
        SELECT id
        FROM dbo.users
        WHERE email = N'demo-owner@equix.local' AND deleted_at IS NULL
    );

    IF @OwnerId IS NULL
        THROW 51000, 'Demo Horse Owner could not be created.', 1;

    MERGE dbo.horses WITH (HOLDLOCK) AS target
    USING (VALUES
        (N'EQX-DEMO-001', N'Thunder Bolt', N'Thunder', N'STALLION', N'Thoroughbred', 4, N'Bay',   N'Vietnam', 165.0, 490.0, 88, 84, 90, 82, N'FRONT_RUNNER'),
        (N'EQX-DEMO-002', N'Silver Moon',  N'Silver',  N'MARE',     N'Arabian',      5, N'Grey',  N'Vietnam', 158.0, 450.0, 82, 91, 80, 89, N'CLOSER'),
        (N'EQX-DEMO-003', N'Golden Step',  N'Goldie',  N'GELDING',  N'Warmblood',    6, N'Chestnut', N'Vietnam', 168.0, 510.0, 80, 87, 83, 85, N'STALKER')
    ) AS source(registration_number, horse_name, nickname, gender, breed, age,
                color, country_of_origin, height_cm, weight_kg, speed, stamina,
                acceleration, agility, pace_style)
      ON target.registration_number = source.registration_number
    WHEN MATCHED THEN
        UPDATE SET
            target.owner_id = @OwnerId,
            target.horse_name = source.horse_name,
            target.nickname = source.nickname,
            target.gender = source.gender,
            target.breed = source.breed,
            target.age = source.age,
            target.color = source.color,
            target.country_of_origin = source.country_of_origin,
            target.height_cm = source.height_cm,
            target.weight_kg = source.weight_kg,
            target.speed = source.speed,
            target.stamina = source.stamina,
            target.acceleration = source.acceleration,
            target.agility = source.agility,
            target.pace_style = source.pace_style,
            target.health_status = N'HEALTHY',
            target.status = N'AVAILABLE',
            target.deleted_at = NULL,
            target.updated_at = SYSDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (owner_id, horse_name, nickname, registration_number, gender,
                breed, age, color, country_of_origin, height_cm, weight_kg,
                speed, stamina, acceleration, agility, pace_style,
                health_status, status, total_races, total_wins, total_top3,
                total_points, created_at, updated_at)
        VALUES (@OwnerId, source.horse_name, source.nickname,
                source.registration_number, source.gender, source.breed,
                source.age, source.color, source.country_of_origin,
                source.height_cm, source.weight_kg, source.speed,
                source.stamina, source.acceleration, source.agility,
                source.pace_style, N'HEALTHY', N'AVAILABLE', 0, 0, 0, 0,
                SYSDATETIME(), SYSDATETIME());

    IF @DryRun = 1
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT N'DRY RUN OK - no data was saved.';
    END
    ELSE
    BEGIN
        COMMIT TRANSACTION;
        PRINT N'EquiX demo accounts and horses were saved successfully.';
    END;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

SELECT username, full_name, email, role, status, reward_points
FROM dbo.users
WHERE email LIKE N'demo-%@equix.local'
ORDER BY role, username;

SELECT h.registration_number, h.horse_name, h.gender, h.breed, h.status,
       u.email AS owner_email
FROM dbo.horses h
JOIN dbo.users u ON u.id = h.owner_id
WHERE h.registration_number LIKE N'EQX-DEMO-%'
ORDER BY h.registration_number;
GO
