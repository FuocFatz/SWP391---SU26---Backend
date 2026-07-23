/*
 * EquiX Business Logic v4 integrity fields.
 * Microsoft SQL Server only. Additive, idempotent, and safe for existing data.
 */
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.races', N'U') IS NULL
        THROW 50030, N'Expected table dbo.races was not found.', 1;
    IF OBJECT_ID(N'dbo.race_registrations', N'U') IS NULL
        THROW 50031, N'Expected table dbo.race_registrations was not found.', 1;
    IF OBJECT_ID(N'dbo.race_notes', N'U') IS NULL
        THROW 50032, N'Expected table dbo.race_notes was not found.', 1;

    IF COL_LENGTH(N'dbo.races', N'admin_review_required') IS NULL
        ALTER TABLE dbo.races ADD admin_review_required bit NULL;
    IF COL_LENGTH(N'dbo.races', N'review_reason') IS NULL
        ALTER TABLE dbo.races ADD review_reason nvarchar(1000) NULL;
    EXEC sys.sp_executesql N'UPDATE dbo.races SET admin_review_required = 0 WHERE admin_review_required IS NULL;';

    IF COL_LENGTH(N'dbo.race_registrations', N'disqualification_reason') IS NULL
        ALTER TABLE dbo.race_registrations ADD disqualification_reason nvarchar(1000) NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'disqualification_category') IS NULL
        ALTER TABLE dbo.race_registrations ADD disqualification_category nvarchar(40) NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'disqualification_severity') IS NULL
        ALTER TABLE dbo.race_registrations ADD disqualification_severity nvarchar(20) NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'disqualified_by') IS NULL
        ALTER TABLE dbo.race_registrations ADD disqualified_by bigint NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'disqualified_at') IS NULL
        ALTER TABLE dbo.race_registrations ADD disqualified_at datetime2 NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'dnf_reason') IS NULL
        ALTER TABLE dbo.race_registrations ADD dnf_reason nvarchar(1000) NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'dnf_by') IS NULL
        ALTER TABLE dbo.race_registrations ADD dnf_by bigint NULL;
    IF COL_LENGTH(N'dbo.race_registrations', N'dnf_at') IS NULL
        ALTER TABLE dbo.race_registrations ADD dnf_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.race_notes', N'signature') IS NULL
        ALTER TABLE dbo.race_notes ADD signature nvarchar(150) NULL;
    IF COL_LENGTH(N'dbo.race_notes', N'reviewed_incidents') IS NULL
        ALTER TABLE dbo.race_notes ADD reviewed_incidents bit NULL;
    IF COL_LENGTH(N'dbo.race_notes', N'revision_number') IS NULL
        ALTER TABLE dbo.race_notes ADD revision_number int NULL;
    EXEC sys.sp_executesql N'UPDATE dbo.race_notes SET reviewed_incidents = 0 WHERE reviewed_incidents IS NULL;';
    EXEC sys.sp_executesql N'UPDATE dbo.race_notes SET revision_number = 0 WHERE revision_number IS NULL;';

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.race_results')
          AND name = N'ux_race_results_race_registration'
    )
        CREATE UNIQUE INDEX ux_race_results_race_registration
            ON dbo.race_results(race_id, registration_id)
            WHERE registration_id IS NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.race_registrations')
          AND name = N'ix_race_registrations_disqualification'
    )
        CREATE INDEX ix_race_registrations_disqualification
            ON dbo.race_registrations(race_id, status, disqualified_at);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
