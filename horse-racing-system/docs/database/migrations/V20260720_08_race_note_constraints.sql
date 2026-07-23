/*
 * Align race-note constraints with EquiX Business Logic v4.
 * Microsoft SQL Server 2019+, additive/idempotent, safe for existing rows.
 * Run as a database owner because the application login is intentionally
 * limited to read/write permissions.
 */
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.race_notes', N'U') IS NULL
        THROW 50040, N'Expected table dbo.race_notes was not found.', 1;

    DECLARE @dropCategoryConstraints nvarchar(max) = N'';
    SELECT @dropCategoryConstraints +=
        N'ALTER TABLE dbo.race_notes DROP CONSTRAINT ' + QUOTENAME(checks.name) + N';'
    FROM sys.check_constraints AS checks
    WHERE checks.parent_object_id = OBJECT_ID(N'dbo.race_notes')
      AND (
          checks.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.race_notes'), N'note_category', 'ColumnId')
          OR checks.definition LIKE N'%note_category%'
      );
    IF LEN(@dropCategoryConstraints) > 0
        EXEC sys.sp_executesql @dropCategoryConstraints;

    ALTER TABLE dbo.race_notes WITH CHECK
        ADD CONSTRAINT CK_race_notes_note_category CHECK (note_category IN (
            N'START', N'POSITION_CHANGE', N'INCIDENT', N'WEATHER', N'EQUIPMENT',
            N'INJURY', N'INTERFERENCE', N'OTHER', N'GENERAL', N'DQ',
            N'DNF', N'RACE_REPORT', N'REVISION_REQUEST'
        ));
    ALTER TABLE dbo.race_notes CHECK CONSTRAINT CK_race_notes_note_category;

    DECLARE @dropSeverityConstraints nvarchar(max) = N'';
    SELECT @dropSeverityConstraints +=
        N'ALTER TABLE dbo.race_notes DROP CONSTRAINT ' + QUOTENAME(checks.name) + N';'
    FROM sys.check_constraints AS checks
    WHERE checks.parent_object_id = OBJECT_ID(N'dbo.race_notes')
      AND (
          checks.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.race_notes'), N'severity', 'ColumnId')
          OR checks.definition LIKE N'%severity%'
      );
    IF LEN(@dropSeverityConstraints) > 0
        EXEC sys.sp_executesql @dropSeverityConstraints;

    ALTER TABLE dbo.race_notes WITH CHECK
        ADD CONSTRAINT CK_race_notes_severity
        CHECK (severity IN (N'INFO', N'WARNING', N'CRITICAL'));
    ALTER TABLE dbo.race_notes CHECK CONSTRAINT CK_race_notes_severity;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
