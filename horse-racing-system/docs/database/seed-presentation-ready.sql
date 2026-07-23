/*
  EquiX presentation-ready data for Microsoft SQL Server.

  - Idempotently creates natural-looking accounts for every role.
  - All accounts created or renamed by this script use password: 12345.
  - Creates 12 healthy horses, active owner/jockey pairings and accepted invitations.
  - Creates a STANDBY race with all 12 registrations already CLEARED_TO_RACE.
  - Safe to run against the existing EquiX database; unrelated data is preserved.
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now datetime2 = SYSDATETIME();
    DECLARE @PasswordHash nvarchar(255) = (
        SELECT TOP (1) password_hash
        FROM dbo.users
        WHERE email = N'demo-admin@equix.local'
    );

    IF @PasswordHash IS NULL
        SELECT TOP (1) @PasswordHash = password_hash
        FROM dbo.users
        WHERE deleted_at IS NULL
        ORDER BY id;

    IF @PasswordHash IS NULL
        THROW 51000, 'A source password hash is required before presentation data can be seeded.', 1;

    /* Replace legacy demo-facing identities while retaining their referenced IDs. */
    IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'demo-admin@equix.local')
       AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'grace.collins@equix.local')
        UPDATE dbo.users SET username=N'grace.collins', full_name=N'Grace Collins',
            email=N'grace.collins@equix.local', password_hash=@PasswordHash, updated_at=@Now
        WHERE email=N'demo-admin@equix.local';

    IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'demo-owner@equix.local')
       AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'william.scott@equix.local')
        UPDATE dbo.users SET username=N'william.scott', full_name=N'William Scott',
            email=N'william.scott@equix.local', password_hash=@PasswordHash, updated_at=@Now
        WHERE email=N'demo-owner@equix.local';

    IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'demo-jockey@equix.local')
       AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'jack.evans@equix.local')
        UPDATE dbo.users SET username=N'jack.evans', full_name=N'Jack Evans',
            email=N'jack.evans@equix.local', password_hash=@PasswordHash, updated_at=@Now
        WHERE email=N'demo-jockey@equix.local';

    IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'demo-referee@equix.local')
       AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'isabella.green@equix.local')
        UPDATE dbo.users SET username=N'isabella.green', full_name=N'Isabella Green',
            email=N'isabella.green@equix.local', password_hash=@PasswordHash, updated_at=@Now
        WHERE email=N'demo-referee@equix.local';

    IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'demo-spectator@equix.local')
       AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'samuel.baker@equix.local')
        UPDATE dbo.users SET username=N'samuel.baker', full_name=N'Samuel Baker',
            email=N'samuel.baker@equix.local', password_hash=@PasswordHash, updated_at=@Now
        WHERE email=N'demo-spectator@equix.local';

    IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'demo-support-jockey@equix.invalid')
       AND NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'chloe.adams@equix.local')
        UPDATE dbo.users SET username=N'chloe.adams', full_name=N'Chloe Adams',
            email=N'chloe.adams@equix.local', password_hash=@PasswordHash, updated_at=@Now
        WHERE email=N'demo-support-jockey@equix.invalid';

    DECLARE @SeedUsers TABLE (
        username nvarchar(100) NOT NULL,
        full_name nvarchar(160) NOT NULL,
        email nvarchar(255) NOT NULL,
        phone nvarchar(30) NULL,
        role nvarchar(30) NOT NULL,
        reward_points int NOT NULL
    );

    INSERT INTO @SeedUsers (username, full_name, email, phone, role, reward_points) VALUES
      (N'ethan.parker',N'Ethan Parker',N'ethan.parker@equix.local',N'0901000001',N'ADMIN',0),
      (N'amelia.roberts',N'Amelia Roberts',N'amelia.roberts@equix.local',N'0901000002',N'ADMIN',0),

      (N'michael.turner',N'Michael Turner',N'michael.turner@equix.local',N'0902000001',N'REFEREE',0),
      (N'natalie.reed',N'Natalie Reed',N'natalie.reed@equix.local',N'0902000002',N'REFEREE',0),
      (N'thomas.cooper',N'Thomas Cooper',N'thomas.cooper@equix.local',N'0902000003',N'REFEREE',0),

      (N'john.carter',N'John Carter',N'john.carter@equix.local',N'0903000001',N'HORSE_OWNER',100),
      (N'emily.wilson',N'Emily Wilson',N'emily.wilson@equix.local',N'0903000002',N'HORSE_OWNER',100),
      (N'liam.brown',N'Liam Brown',N'liam.brown@equix.local',N'0903000003',N'HORSE_OWNER',100),
      (N'sophia.davis',N'Sophia Davis',N'sophia.davis@equix.local',N'0903000004',N'HORSE_OWNER',100),
      (N'noah.miller',N'Noah Miller',N'noah.miller@equix.local',N'0903000005',N'HORSE_OWNER',100),
      (N'olivia.moore',N'Olivia Moore',N'olivia.moore@equix.local',N'0903000006',N'HORSE_OWNER',100),
      (N'lucas.taylor',N'Lucas Taylor',N'lucas.taylor@equix.local',N'0903000007',N'HORSE_OWNER',100),
      (N'ava.anderson',N'Ava Anderson',N'ava.anderson@equix.local',N'0903000008',N'HORSE_OWNER',100),
      (N'ethan.thomas',N'Ethan Thomas',N'ethan.thomas@equix.local',N'0903000009',N'HORSE_OWNER',100),
      (N'mia.jackson',N'Mia Jackson',N'mia.jackson@equix.local',N'0903000010',N'HORSE_OWNER',100),
      (N'james.white',N'James White',N'james.white@equix.local',N'0903000011',N'HORSE_OWNER',100),
      (N'charlotte.martin',N'Charlotte Martin',N'charlotte.martin@equix.local',N'0903000012',N'HORSE_OWNER',100),

      (N'alex.morgan',N'Alex Morgan',N'alex.morgan@equix.local',N'0904000001',N'JOCKEY',100),
      (N'daniel.lewis',N'Daniel Lewis',N'daniel.lewis@equix.local',N'0904000002',N'JOCKEY',100),
      (N'ryan.walker',N'Ryan Walker',N'ryan.walker@equix.local',N'0904000003',N'JOCKEY',100),
      (N'chloe.hall',N'Chloe Hall',N'chloe.hall@equix.local',N'0904000004',N'JOCKEY',100),
      (N'nathan.young',N'Nathan Young',N'nathan.young@equix.local',N'0904000005',N'JOCKEY',100),
      (N'lily.king',N'Lily King',N'lily.king@equix.local',N'0904000006',N'JOCKEY',100),
      (N'mason.wright',N'Mason Wright',N'mason.wright@equix.local',N'0904000007',N'JOCKEY',100),
      (N'ella.lopez',N'Ella Lopez',N'ella.lopez@equix.local',N'0904000008',N'JOCKEY',100),
      (N'leo.hill',N'Leo Hill',N'leo.hill@equix.local',N'0904000009',N'JOCKEY',100),
      (N'zoe.clark',N'Zoe Clark',N'zoe.clark@equix.local',N'0904000010',N'JOCKEY',100),
      (N'isaac.lee',N'Isaac Lee',N'isaac.lee@equix.local',N'0904000011',N'JOCKEY',100),
      (N'hannah.allen',N'Hannah Allen',N'hannah.allen@equix.local',N'0904000012',N'JOCKEY',100),

      (N'benjamin.harris',N'Benjamin Harris',N'benjamin.harris@equix.local',NULL,N'SPECTATOR',500),
      (N'harper.martin',N'Harper Martin',N'harper.martin@equix.local',NULL,N'SPECTATOR',500),
      (N'henry.thompson',N'Henry Thompson',N'henry.thompson@equix.local',NULL,N'SPECTATOR',500),
      (N'evelyn.garcia',N'Evelyn Garcia',N'evelyn.garcia@equix.local',NULL,N'SPECTATOR',500),
      (N'sebastian.martinez',N'Sebastian Martinez',N'sebastian.martinez@equix.local',NULL,N'SPECTATOR',500),
      (N'camila.robinson',N'Camila Robinson',N'camila.robinson@equix.local',NULL,N'SPECTATOR',500),
      (N'jack.clark',N'Jack Clark',N'jack.clark@equix.local',NULL,N'SPECTATOR',500),
      (N'luna.rodriguez',N'Luna Rodriguez',N'luna.rodriguez@equix.local',NULL,N'SPECTATOR',500),
      (N'owen.lewis',N'Owen Lewis',N'owen.lewis@equix.local',NULL,N'SPECTATOR',500),
      (N'scarlett.lee',N'Scarlett Lee',N'scarlett.lee@equix.local',NULL,N'SPECTATOR',500),
      (N'wyatt.walker',N'Wyatt Walker',N'wyatt.walker@equix.local',NULL,N'SPECTATOR',500),
      (N'grace.hall',N'Grace Hall',N'grace.hall@equix.local',NULL,N'SPECTATOR',500);

    MERGE dbo.users AS target
    USING @SeedUsers AS source
       ON target.email = source.email
    WHEN MATCHED THEN UPDATE SET
       target.username = source.username,
       target.full_name = source.full_name,
       target.phone = source.phone,
       target.password_hash = @PasswordHash,
       target.role = source.role,
       target.status = N'VERIFIED',
       target.reward_points = CASE WHEN target.reward_points IS NULL OR target.reward_points < source.reward_points
                                   THEN source.reward_points ELSE target.reward_points END,
       target.deleted_at = NULL,
       target.updated_at = @Now
    WHEN NOT MATCHED THEN INSERT
       (username,password_hash,full_name,email,phone,role,status,reward_points,created_at,updated_at)
       VALUES (source.username,@PasswordHash,source.full_name,source.email,source.phone,
               source.role,N'VERIFIED',source.reward_points,@Now,@Now);

    DECLARE @TournamentId bigint;
    SELECT @TournamentId=id FROM dbo.tournaments WHERE name=N'Saigon Equestrian Championship' AND deleted_at IS NULL;
    IF @TournamentId IS NULL
    BEGIN
        INSERT dbo.tournaments
          (name,description,location,grace_period_hours,start_date,end_date,status,created_at,updated_at)
        VALUES
          (N'Saigon Equestrian Championship',N'Presentation tournament with fully prepared race entries.',
           N'Saigon Riverside Racecourse',120,CAST(DATEADD(day,-1,@Now) AS date),CAST(DATEADD(day,30,@Now) AS date),
           N'OPEN',@Now,@Now);
        SET @TournamentId=SCOPE_IDENTITY();
    END
    ELSE
        UPDATE dbo.tournaments SET status=N'OPEN', location=N'Saigon Riverside Racecourse',
            start_date=CAST(DATEADD(day,-1,@Now) AS date), end_date=CAST(DATEADD(day,30,@Now) AS date),
            deleted_at=NULL, updated_at=@Now WHERE id=@TournamentId;

    DECLARE @RefereeId bigint=(SELECT id FROM dbo.users WHERE email=N'michael.turner@equix.local' AND deleted_at IS NULL);
    DECLARE @RaceId bigint;
    SELECT @RaceId=id FROM dbo.races WHERE race_name=N'Saigon Championship Sprint' AND deleted_at IS NULL;

    IF @RaceId IS NULL
    BEGIN
        INSERT dbo.races
          (tournament_id,race_name,race_type,race_distance,track_condition,race_date,race_time,
           registration_deadline,total_lanes,prize_points,weather,location,status,referee_id,
           admin_review_required,created_at,updated_at)
        VALUES
          (@TournamentId,N'Saigon Championship Sprint',N'SPRINT',1200,N'TURF',CAST(DATEADD(day,1,@Now) AS date),
           CAST('14:00:00' AS time),DATEADD(day,-6,CAST(DATEADD(day,1,@Now) AS datetime2)),12,250000,
           N'CLEAR',N'Saigon Riverside Racecourse',N'STANDBY',@RefereeId,0,@Now,@Now);
        SET @RaceId=SCOPE_IDENTITY();
    END
    ELSE
        UPDATE dbo.races SET tournament_id=@TournamentId,race_type=N'SPRINT',race_distance=1200,
            track_condition=N'TURF',race_date=CAST(DATEADD(day,1,@Now) AS date),race_time=CAST('14:00:00' AS time),
            registration_deadline=DATEADD(day,-6,CAST(DATEADD(day,1,@Now) AS datetime2)),total_lanes=12,
            prize_points=250000,weather=N'CLEAR',location=N'Saigon Riverside Racecourse',status=N'STANDBY',
            referee_id=@RefereeId,admin_review_required=0,review_reason=NULL,cancellation_reason=NULL,
            cancelled_at=NULL,deleted_at=NULL,updated_at=@Now WHERE id=@RaceId;

    DECLARE @Pairs TABLE (
        lane int NOT NULL,
        horse_name nvarchar(120) NOT NULL,
        registration_number nvarchar(80) NOT NULL,
        owner_email nvarchar(255) NOT NULL,
        jockey_email nvarchar(255) NOT NULL,
        gender nvarchar(20) NOT NULL,
        speed int NOT NULL,
        stamina int NOT NULL
    );

    INSERT INTO @Pairs VALUES
      (1,N'Storm Chaser',N'EQX-PRESENT-001',N'john.carter@equix.local',N'alex.morgan@equix.local',N'STALLION',92,86),
      (2,N'Midnight Star',N'EQX-PRESENT-002',N'emily.wilson@equix.local',N'daniel.lewis@equix.local',N'MARE',89,90),
      (3,N'Golden Arrow',N'EQX-PRESENT-003',N'liam.brown@equix.local',N'ryan.walker@equix.local',N'STALLION',94,83),
      (4,N'Silver Blaze',N'EQX-PRESENT-004',N'sophia.davis@equix.local',N'chloe.hall@equix.local',N'MARE',87,92),
      (5,N'Red Horizon',N'EQX-PRESENT-005',N'noah.miller@equix.local',N'nathan.young@equix.local',N'GELDING',91,85),
      (6,N'Blue Thunder',N'EQX-PRESENT-006',N'olivia.moore@equix.local',N'lily.king@equix.local',N'STALLION',90,88),
      (7,N'Royal Spirit',N'EQX-PRESENT-007',N'lucas.taylor@equix.local',N'mason.wright@equix.local',N'MARE',86,93),
      (8,N'Desert Wind',N'EQX-PRESENT-008',N'ava.anderson@equix.local',N'ella.lopez@equix.local',N'GELDING',93,82),
      (9,N'Ocean Flame',N'EQX-PRESENT-009',N'ethan.thomas@equix.local',N'leo.hill@equix.local',N'STALLION',88,91),
      (10,N'Northern Light',N'EQX-PRESENT-010',N'mia.jackson@equix.local',N'zoe.clark@equix.local',N'MARE',90,89),
      (11,N'Wild Comet',N'EQX-PRESENT-011',N'james.white@equix.local',N'isaac.lee@equix.local',N'GELDING',95,80),
      (12,N'Emerald King',N'EQX-PRESENT-012',N'charlotte.martin@equix.local',N'hannah.allen@equix.local',N'STALLION',89,94);

    DECLARE @Lane int,@HorseName nvarchar(120),@RegistrationNumber nvarchar(80),
            @OwnerEmail nvarchar(255),@JockeyEmail nvarchar(255),@Gender nvarchar(20),
            @Speed int,@Stamina int,@OwnerId bigint,@JockeyId bigint,@HorseId bigint,@PairingId bigint;

    DECLARE pair_cursor CURSOR LOCAL FAST_FORWARD FOR
      SELECT lane,horse_name,registration_number,owner_email,jockey_email,gender,speed,stamina
      FROM @Pairs ORDER BY lane;

    OPEN pair_cursor;
    FETCH NEXT FROM pair_cursor INTO @Lane,@HorseName,@RegistrationNumber,@OwnerEmail,@JockeyEmail,@Gender,@Speed,@Stamina;
    WHILE @@FETCH_STATUS=0
    BEGIN
        SELECT @OwnerId=id FROM dbo.users WHERE email=@OwnerEmail AND deleted_at IS NULL;
        SELECT @JockeyId=id FROM dbo.users WHERE email=@JockeyEmail AND deleted_at IS NULL;
        SET @HorseId=NULL;
        SELECT @HorseId=id FROM dbo.horses WHERE registration_number=@RegistrationNumber;

        IF @HorseId IS NULL
        BEGIN
            INSERT dbo.horses
              (owner_id,horse_name,registration_number,gender,breed,age,color,country_of_origin,height_cm,weight_kg,
               speed,stamina,acceleration,agility,pace_style,health_status,status,total_races,total_wins,total_top3,
               total_points,description,created_at,updated_at)
            VALUES
              (@OwnerId,@HorseName,@RegistrationNumber,@Gender,N'Thoroughbred',4+(@Lane%3),N'Bay',N'Vietnam',
               162+(@Lane%5),450+(@Lane*2),@Speed,@Stamina,85+(@Lane%8),84+(@Lane%9),N'PACE',N'HEALTHY',
               N'PAIRED',0,0,0,0,N'Healthy and fully prepared for the championship race.',@Now,@Now);
            SET @HorseId=SCOPE_IDENTITY();
        END
        ELSE
            UPDATE dbo.horses SET owner_id=@OwnerId,horse_name=@HorseName,gender=@Gender,breed=N'Thoroughbred',
                speed=@Speed,stamina=@Stamina,health_status=N'HEALTHY',injury_notes=NULL,status=N'PAIRED',
                description=N'Healthy and fully prepared for the championship race.',deleted_at=NULL,updated_at=@Now
            WHERE id=@HorseId;

        SET @PairingId=NULL;
        SELECT @PairingId=id FROM dbo.pairing_contracts
        WHERE horse_id=@HorseId AND jockey_id=@JockeyId AND owner_id=@OwnerId AND status=N'ACTIVE';
        IF @PairingId IS NULL
        BEGIN
            INSERT dbo.pairing_contracts (horse_id,jockey_id,owner_id,status,created_at)
            VALUES (@HorseId,@JockeyId,@OwnerId,N'ACTIVE',@Now);
            SET @PairingId=SCOPE_IDENTITY();
        END

        IF EXISTS (SELECT 1 FROM dbo.jockey_invitations WHERE race_id=@RaceId AND horse_id=@HorseId)
            UPDATE dbo.jockey_invitations SET owner_id=@OwnerId,jockey_id=@JockeyId,status=N'ACCEPTED',
                message=N'Championship race assignment',response_note=N'Accepted and ready to race',responded_at=@Now
            WHERE race_id=@RaceId AND horse_id=@HorseId;
        ELSE
            INSERT dbo.jockey_invitations
              (race_id,horse_id,owner_id,jockey_id,status,message,response_note,created_at,responded_at)
            VALUES
              (@RaceId,@HorseId,@OwnerId,@JockeyId,N'ACCEPTED',N'Championship race assignment',
               N'Accepted and ready to race',@Now,@Now);

        IF EXISTS (SELECT 1 FROM dbo.race_registrations WHERE race_id=@RaceId AND horse_id=@HorseId)
            UPDATE dbo.race_registrations SET owner_id=@OwnerId,jockey_id=@JockeyId,pairing_contract_id=@PairingId,
                lane_number=@Lane,status=N'CLEARED_TO_RACE',owner_confirmed=1,jockey_confirmed=1,referee_approved=1,
                health_check_status=N'FIT',referee_notes=N'Identity, equipment and health checks completed.',
                withdraw_reason=NULL,disqualification_reason=NULL,disqualification_category=NULL,
                disqualification_severity=NULL,disqualified_by=NULL,disqualified_at=NULL,dnf_reason=NULL,dnf_by=NULL,
                dnf_at=NULL,deleted_at=NULL,updated_at=@Now
            WHERE race_id=@RaceId AND horse_id=@HorseId;
        ELSE
            INSERT dbo.race_registrations
              (race_id,horse_id,jockey_id,owner_id,pairing_contract_id,lane_number,status,owner_confirmed,
               jockey_confirmed,referee_approved,health_check_status,referee_notes,created_at,updated_at)
            VALUES
              (@RaceId,@HorseId,@JockeyId,@OwnerId,@PairingId,@Lane,N'CLEARED_TO_RACE',1,1,1,N'FIT',
               N'Identity, equipment and health checks completed.',@Now,@Now);

        FETCH NEXT FROM pair_cursor INTO @Lane,@HorseName,@RegistrationNumber,@OwnerEmail,@JockeyEmail,@Gender,@Speed,@Stamina;
    END
    CLOSE pair_cursor;
    DEALLOCATE pair_cursor;

    COMMIT TRANSACTION;

    SELECT role,COUNT(*) AS active_accounts
    FROM dbo.users WHERE deleted_at IS NULL AND status IN (N'VERIFIED',N'ACTIVE')
    GROUP BY role ORDER BY role;

    SELECT r.id,r.race_name,r.status,u.full_name AS referee_name,u.email AS referee_email,
           COUNT(rr.id) AS cleared_horses
    FROM dbo.races r
    JOIN dbo.users u ON u.id=r.referee_id
    LEFT JOIN dbo.race_registrations rr ON rr.race_id=r.id AND rr.status=N'CLEARED_TO_RACE' AND rr.deleted_at IS NULL
    WHERE r.id=@RaceId
    GROUP BY r.id,r.race_name,r.status,u.full_name,u.email;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
