/*
 * Additive, idempotent SQL Server migration for the EquiX reward lifecycle.
 *
 * This migration extends the existing reward_types and reward_history tables.
 * It does not delete, rename, or rebuild legacy data. Run it before starting an
 * application build that maps the new reward columns with ddl-auto=validate.
 */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.reward_types', N'U') IS NULL
        THROW 50001, N'Expected legacy table dbo.reward_types was not found.', 1;

    IF OBJECT_ID(N'dbo.reward_history', N'U') IS NULL
        THROW 50002, N'Expected legacy table dbo.reward_history was not found.', 1;

    IF OBJECT_ID(N'dbo.predictions', N'U') IS NULL
        THROW 50003, N'Expected table dbo.predictions was not found.', 1;

    IF OBJECT_ID(N'dbo.horses', N'U') IS NULL
        THROW 50004, N'Expected table dbo.horses was not found.', 1;

    /* ---------------------------------------------------------------------
       Reward type catalog
       --------------------------------------------------------------------- */
    IF COL_LENGTH(N'dbo.reward_types', N'active') IS NULL
        ALTER TABLE dbo.reward_types ADD active bit NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'image_url') IS NULL
        ALTER TABLE dbo.reward_types ADD image_url nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'redemption_url') IS NULL
        ALTER TABLE dbo.reward_types ADD redemption_url nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'partner_name') IS NULL
        ALTER TABLE dbo.reward_types ADD partner_name nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'contact_info') IS NULL
        ALTER TABLE dbo.reward_types ADD contact_info nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'terms') IS NULL
        ALTER TABLE dbo.reward_types ADD terms nvarchar(2000) NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'validity_days') IS NULL
        ALTER TABLE dbo.reward_types ADD validity_days int NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'requires_shipping') IS NULL
        ALTER TABLE dbo.reward_types ADD requires_shipping bit NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'created_at') IS NULL
        ALTER TABLE dbo.reward_types ADD created_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'updated_at') IS NULL
        ALTER TABLE dbo.reward_types ADD updated_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_types', N'version') IS NULL
        ALTER TABLE dbo.reward_types ADD version bigint NULL;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

BEGIN TRY
    IF @@TRANCOUNT = 0
        THROW 50007, N'Reward migration column phase did not leave an active transaction.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND c.name = N'active'
    )
        ALTER TABLE dbo.reward_types
            ADD CONSTRAINT df_reward_types_active DEFAULT (CONVERT(bit, 1)) FOR active;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND c.name = N'requires_shipping'
    )
        ALTER TABLE dbo.reward_types
            ADD CONSTRAINT df_reward_types_requires_shipping DEFAULT (CONVERT(bit, 0)) FOR requires_shipping;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND c.name = N'validity_days'
    )
        ALTER TABLE dbo.reward_types
            ADD CONSTRAINT df_reward_types_validity_days DEFAULT (30) FOR validity_days;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND c.name = N'created_at'
    )
        ALTER TABLE dbo.reward_types
            ADD CONSTRAINT df_reward_types_created_at DEFAULT (SYSDATETIME()) FOR created_at;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND c.name = N'updated_at'
    )
        ALTER TABLE dbo.reward_types
            ADD CONSTRAINT df_reward_types_updated_at DEFAULT (SYSDATETIME()) FOR updated_at;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND c.name = N'version'
    )
        ALTER TABLE dbo.reward_types
            ADD CONSTRAINT df_reward_types_version DEFAULT (CONVERT(bigint, 0)) FOR version;

    /* Seed only missing names. These are deliberately demo-safe placeholders. */
    IF NOT EXISTS (SELECT 1 FROM dbo.reward_types WITH (UPDLOCK, HOLDLOCK) WHERE name = N'HORSE_GOODS')
        INSERT INTO dbo.reward_types (
            name, description, active, image_url, redemption_url, partner_name,
            contact_info, terms, validity_days, requires_shipping, created_at,
            updated_at, version
        )
        VALUES (
            N'HORSE_GOODS',
            N'Demo horse-goods package for a correct first-place guess.',
            1, NULL, NULL, N'EquiX Demo Merchandise Desk',
            N'demo-rewards@equix.invalid',
            N'Demonstration reward only. Replace the catalog, partner, contact, inventory, and delivery terms before production use.',
            30, 1, SYSDATETIME(), SYSDATETIME(), 0
        );

    IF NOT EXISTS (SELECT 1 FROM dbo.reward_types WITH (UPDLOCK, HOLDLOCK) WHERE name = N'VOUCHER')
        INSERT INTO dbo.reward_types (
            name, description, active, image_url, redemption_url, partner_name,
            contact_info, terms, validity_days, requires_shipping, created_at,
            updated_at, version
        )
        VALUES (
            N'VOUCHER',
            N'Demo one-time voucher for a correct second-place guess.',
            1, NULL, NULL, N'EquiX Demo Store',
            N'demo-rewards@equix.invalid',
            N'Demonstration reward only. A production merchant must provide redemption rules, inventory, and settlement.',
            30, 0, SYSDATETIME(), SYSDATETIME(), 0
        );

    IF NOT EXISTS (SELECT 1 FROM dbo.reward_types WITH (UPDLOCK, HOLDLOCK) WHERE name = N'DRINK_COUPON')
        INSERT INTO dbo.reward_types (
            name, description, active, image_url, redemption_url, partner_name,
            contact_info, terms, validity_days, requires_shipping, created_at,
            updated_at, version
        )
        VALUES (
            N'DRINK_COUPON',
            N'Demo one-time complimentary drink coupon for a correct third-place guess.',
            1, NULL, NULL, N'EquiX Demo Venue',
            N'demo-rewards@equix.invalid',
            N'Demonstration reward only. A production venue must provide participating locations and redemption terms.',
            14, 0, SYSDATETIME(), SYSDATETIME(), 0
        );

    /* Complete only missing catalog values; never overwrite configured data. */
    UPDATE dbo.reward_types
       SET description = COALESCE(description, N'Demo horse-goods package for a correct first-place guess.'),
           partner_name = COALESCE(partner_name, N'EquiX Demo Merchandise Desk'),
           contact_info = COALESCE(contact_info, N'demo-rewards@equix.invalid'),
           terms = COALESCE(terms, N'Demonstration reward only. Replace the catalog, partner, contact, inventory, and delivery terms before production use.'),
           validity_days = COALESCE(validity_days, 30),
           requires_shipping = COALESCE(requires_shipping, CONVERT(bit, 1))
     WHERE name = N'HORSE_GOODS'
       AND created_at IS NULL;

    UPDATE dbo.reward_types
       SET description = COALESCE(description, N'Demo one-time voucher for a correct second-place guess.'),
           partner_name = COALESCE(partner_name, N'EquiX Demo Store'),
           contact_info = COALESCE(contact_info, N'demo-rewards@equix.invalid'),
           terms = COALESCE(terms, N'Demonstration reward only. A production merchant must provide redemption rules, inventory, and settlement.'),
           validity_days = COALESCE(validity_days, 30),
           requires_shipping = COALESCE(requires_shipping, CONVERT(bit, 0))
     WHERE name = N'VOUCHER'
       AND created_at IS NULL;

    UPDATE dbo.reward_types
       SET description = COALESCE(description, N'Demo one-time complimentary drink coupon for a correct third-place guess.'),
           partner_name = COALESCE(partner_name, N'EquiX Demo Venue'),
           contact_info = COALESCE(contact_info, N'demo-rewards@equix.invalid'),
           terms = COALESCE(terms, N'Demonstration reward only. A production venue must provide participating locations and redemption terms.'),
           validity_days = COALESCE(validity_days, 14),
           requires_shipping = COALESCE(requires_shipping, CONVERT(bit, 0))
     WHERE name = N'DRINK_COUPON'
       AND created_at IS NULL;

    UPDATE dbo.reward_types
       SET active = COALESCE(active, CONVERT(bit, 1)),
           validity_days = COALESCE(validity_days, 30),
           requires_shipping = COALESCE(requires_shipping, CONVERT(bit, 0)),
           created_at = COALESCE(created_at, SYSDATETIME()),
           updated_at = COALESCE(updated_at, created_at, SYSDATETIME()),
           version = COALESCE(version, CONVERT(bigint, 0))
     WHERE active IS NULL
        OR validity_days IS NULL
        OR requires_shipping IS NULL
        OR created_at IS NULL
        OR updated_at IS NULL
        OR version IS NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_types') AND name = N'active' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_types ALTER COLUMN active bit NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_types') AND name = N'requires_shipping' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_types ALTER COLUMN requires_shipping bit NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_types') AND name = N'validity_days' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_types ALTER COLUMN validity_days int NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_types') AND name = N'created_at' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_types ALTER COLUMN created_at datetime2 NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_types') AND name = N'updated_at' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_types ALTER COLUMN updated_at datetime2 NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_types') AND name = N'version' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_types ALTER COLUMN version bigint NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.reward_types')
          AND name = N'ck_reward_types_validity_days'
    )
        ALTER TABLE dbo.reward_types WITH CHECK
            ADD CONSTRAINT ck_reward_types_validity_days
            CHECK (validity_days IS NULL OR validity_days > 0);

    /* ---------------------------------------------------------------------
       Issued reward, claim, shipping, and one-time redemption lifecycle
       --------------------------------------------------------------------- */
    IF COL_LENGTH(N'dbo.reward_history', N'prediction_id') IS NULL
        ALTER TABLE dbo.reward_history ADD prediction_id bigint NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'horse_id') IS NULL
        ALTER TABLE dbo.reward_history ADD horse_id bigint NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'finish_position') IS NULL
        ALTER TABLE dbo.reward_history ADD finish_position int NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'status') IS NULL
        ALTER TABLE dbo.reward_history ADD status nvarchar(32) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'redemption_code') IS NULL
        ALTER TABLE dbo.reward_history ADD redemption_code nvarchar(80) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'title') IS NULL
        ALTER TABLE dbo.reward_history ADD title nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'snapshot_image_url') IS NULL
        ALTER TABLE dbo.reward_history ADD snapshot_image_url nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'snapshot_redemption_url') IS NULL
        ALTER TABLE dbo.reward_history ADD snapshot_redemption_url nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'snapshot_partner_name') IS NULL
        ALTER TABLE dbo.reward_history ADD snapshot_partner_name nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'snapshot_contact_info') IS NULL
        ALTER TABLE dbo.reward_history ADD snapshot_contact_info nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'snapshot_terms') IS NULL
        ALTER TABLE dbo.reward_history ADD snapshot_terms nvarchar(2000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'expires_at') IS NULL
        ALTER TABLE dbo.reward_history ADD expires_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'claimed_at') IS NULL
        ALTER TABLE dbo.reward_history ADD claimed_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'processing_at') IS NULL
        ALTER TABLE dbo.reward_history ADD processing_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'shipped_at') IS NULL
        ALTER TABLE dbo.reward_history ADD shipped_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'fulfilled_at') IS NULL
        ALTER TABLE dbo.reward_history ADD fulfilled_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'redeemed_at') IS NULL
        ALTER TABLE dbo.reward_history ADD redeemed_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'cancelled_at') IS NULL
        ALTER TABLE dbo.reward_history ADD cancelled_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'updated_at') IS NULL
        ALTER TABLE dbo.reward_history ADD updated_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'recipient_name') IS NULL
        ALTER TABLE dbo.reward_history ADD recipient_name nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'recipient_phone') IS NULL
        ALTER TABLE dbo.reward_history ADD recipient_phone nvarchar(50) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'delivery_address') IS NULL
        ALTER TABLE dbo.reward_history ADD delivery_address nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'spectator_note') IS NULL
        ALTER TABLE dbo.reward_history ADD spectator_note nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'carrier') IS NULL
        ALTER TABLE dbo.reward_history ADD carrier nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'tracking_number') IS NULL
        ALTER TABLE dbo.reward_history ADD tracking_number nvarchar(255) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'admin_note') IS NULL
        ALTER TABLE dbo.reward_history ADD admin_note nvarchar(2000) NULL;

    IF COL_LENGTH(N'dbo.reward_history', N'version') IS NULL
        ALTER TABLE dbo.reward_history ADD version bigint NULL;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

BEGIN TRY
    IF @@TRANCOUNT = 0
        THROW 50008, N'Reward migration catalog phase did not leave an active transaction.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND c.name = N'status'
    )
        ALTER TABLE dbo.reward_history
            ADD CONSTRAINT df_reward_history_status DEFAULT (N'ISSUED') FOR status;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND c.name = N'awarded_at'
    )
        ALTER TABLE dbo.reward_history
            ADD CONSTRAINT df_reward_history_awarded_at DEFAULT (SYSDATETIME()) FOR awarded_at;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND c.name = N'updated_at'
    )
        ALTER TABLE dbo.reward_history
            ADD CONSTRAINT df_reward_history_updated_at DEFAULT (SYSDATETIME()) FOR updated_at;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        JOIN sys.columns c
          ON c.object_id = dc.parent_object_id
         AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND c.name = N'version'
    )
        ALTER TABLE dbo.reward_history
            ADD CONSTRAINT df_reward_history_version DEFAULT (CONVERT(bigint, 0)) FOR version;

    /* Legacy awards become issued records without inventing a winner/code. */
    UPDATE dbo.reward_history
       SET awarded_at = COALESCE(awarded_at, SYSDATETIME()),
           status = COALESCE(status, N'ISSUED'),
           updated_at = COALESCE(updated_at, awarded_at, SYSDATETIME()),
           version = COALESCE(version, CONVERT(bigint, 0))
     WHERE awarded_at IS NULL
        OR status IS NULL
        OR updated_at IS NULL
        OR version IS NULL;

    UPDATE history
       SET title = COALESCE(
               history.title,
               LEFT(NULLIF(LTRIM(RTRIM(history.description)), N''), 255),
               CASE reward_type.name
                   WHEN N'HORSE_GOODS' THEN N'Horse goods package'
                   WHEN N'VOUCHER' THEN N'EquiX voucher'
                   WHEN N'DRINK_COUPON' THEN N'Complimentary drink coupon'
                   ELSE N'Legacy reward'
               END
           ),
           snapshot_image_url = COALESCE(history.snapshot_image_url, reward_type.image_url),
           snapshot_redemption_url = COALESCE(history.snapshot_redemption_url, reward_type.redemption_url),
           snapshot_partner_name = COALESCE(history.snapshot_partner_name, reward_type.partner_name),
           snapshot_contact_info = COALESCE(history.snapshot_contact_info, reward_type.contact_info),
           snapshot_terms = COALESCE(history.snapshot_terms, reward_type.terms)
      FROM dbo.reward_history history
      LEFT JOIN dbo.reward_types reward_type
        ON reward_type.id = history.reward_type_id
     WHERE history.prediction_id IS NULL
       AND (
            history.title IS NULL
         OR (history.snapshot_image_url IS NULL AND reward_type.image_url IS NOT NULL)
         OR (history.snapshot_redemption_url IS NULL AND reward_type.redemption_url IS NOT NULL)
         OR (history.snapshot_partner_name IS NULL AND reward_type.partner_name IS NOT NULL)
         OR (history.snapshot_contact_info IS NULL AND reward_type.contact_info IS NOT NULL)
         OR (history.snapshot_terms IS NULL AND reward_type.terms IS NOT NULL)
       );

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_history') AND name = N'awarded_at' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_history ALTER COLUMN awarded_at datetime2 NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_history') AND name = N'status' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_history ALTER COLUMN status nvarchar(32) NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_history') AND name = N'title' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_history ALTER COLUMN title nvarchar(255) NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_history') AND name = N'updated_at' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_history ALTER COLUMN updated_at datetime2 NOT NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.reward_history') AND name = N'version' AND is_nullable = 1
    )
        ALTER TABLE dbo.reward_history ALTER COLUMN version bigint NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'fk_reward_history_prediction'
    )
    BEGIN
        ALTER TABLE dbo.reward_history WITH CHECK
            ADD CONSTRAINT fk_reward_history_prediction
            FOREIGN KEY (prediction_id) REFERENCES dbo.predictions(id);
        ALTER TABLE dbo.reward_history CHECK CONSTRAINT fk_reward_history_prediction;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'fk_reward_history_horse'
    )
    BEGIN
        ALTER TABLE dbo.reward_history WITH CHECK
            ADD CONSTRAINT fk_reward_history_horse
            FOREIGN KEY (horse_id) REFERENCES dbo.horses(id);
        ALTER TABLE dbo.reward_history CHECK CONSTRAINT fk_reward_history_horse;
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ck_reward_history_finish_position'
    )
        ALTER TABLE dbo.reward_history WITH CHECK
            ADD CONSTRAINT ck_reward_history_finish_position
            CHECK (finish_position IS NULL OR finish_position BETWEEN 1 AND 3);

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ck_reward_history_status'
    )
        ALTER TABLE dbo.reward_history WITH CHECK
            ADD CONSTRAINT ck_reward_history_status
            CHECK (status IN (
                N'ISSUED', N'CLAIMED', N'PROCESSING', N'SHIPPED',
                N'FULFILLED', N'REDEEMED', N'EXPIRED', N'CANCELLED'
            ));

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ck_reward_history_redemption_code'
    )
        ALTER TABLE dbo.reward_history WITH CHECK
            ADD CONSTRAINT ck_reward_history_redemption_code
            CHECK (redemption_code IS NULL OR LEN(LTRIM(RTRIM(redemption_code))) >= 8);

    IF EXISTS (
        SELECT prediction_id
        FROM dbo.reward_history
        WHERE prediction_id IS NOT NULL
        GROUP BY prediction_id
        HAVING COUNT_BIG(*) > 1
    )
        THROW 50005, N'Duplicate reward_history.prediction_id values prevent the one-reward-per-prediction index.', 1;

    IF EXISTS (
        SELECT redemption_code
        FROM dbo.reward_history
        WHERE redemption_code IS NOT NULL
        GROUP BY redemption_code
        HAVING COUNT_BIG(*) > 1
    )
        THROW 50006, N'Duplicate reward_history.redemption_code values prevent one-time redemption enforcement.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ux_reward_history_prediction'
    )
        CREATE UNIQUE INDEX ux_reward_history_prediction
            ON dbo.reward_history(prediction_id)
            WHERE prediction_id IS NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ux_reward_history_redemption_code'
    )
        CREATE UNIQUE INDEX ux_reward_history_redemption_code
            ON dbo.reward_history(redemption_code)
            WHERE redemption_code IS NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ix_reward_history_user_awarded'
    )
        CREATE INDEX ix_reward_history_user_awarded
            ON dbo.reward_history(user_id, awarded_at DESC)
            INCLUDE (status, reward_type_id, race_id, expires_at);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ix_reward_history_status_expires'
    )
        CREATE INDEX ix_reward_history_status_expires
            ON dbo.reward_history(status, expires_at)
            INCLUDE (user_id, reward_type_id, awarded_at);

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.reward_history')
          AND name = N'ix_reward_history_race'
    )
        CREATE INDEX ix_reward_history_race
            ON dbo.reward_history(race_id)
            INCLUDE (user_id, status, reward_type_id)
            WHERE race_id IS NOT NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
