/*
 * EquiX race cancellation and rescheduling metadata.
 * Additive and idempotent for the existing SQL Server database.
 */
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.races', N'U') IS NULL
        THROW 50020, N'Expected table dbo.races was not found.', 1;

    IF COL_LENGTH(N'dbo.races', N'cancellation_reason') IS NULL
        ALTER TABLE dbo.races ADD cancellation_reason nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.races', N'cancelled_at') IS NULL
        ALTER TABLE dbo.races ADD cancelled_at datetime2 NULL;

    IF COL_LENGTH(N'dbo.races', N'reschedule_reason') IS NULL
        ALTER TABLE dbo.races ADD reschedule_reason nvarchar(1000) NULL;

    IF COL_LENGTH(N'dbo.races', N'rescheduled_at') IS NULL
        ALTER TABLE dbo.races ADD rescheduled_at datetime2 NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.races') AND name = N'ix_races_status_schedule'
    )
        CREATE INDEX ix_races_status_schedule
            ON dbo.races(status, race_date, race_time)
            INCLUDE (tournament_id, referee_id);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
