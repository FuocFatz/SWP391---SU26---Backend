/*
 * Align tournament statuses with the Admin Open/Close workflow.
 * Microsoft SQL Server 2019+, idempotent, and safe for existing rows.
 */
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.tournaments', N'U') IS NULL
        THROW 50041, N'Expected table dbo.tournaments was not found.', 1;

    DECLARE @dropStatusConstraints nvarchar(max) = N'';
    SELECT @dropStatusConstraints +=
        N'ALTER TABLE dbo.tournaments DROP CONSTRAINT ' + QUOTENAME(checks.name) + N';'
    FROM sys.check_constraints AS checks
    WHERE checks.parent_object_id = OBJECT_ID(N'dbo.tournaments')
      AND (
          checks.parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.tournaments'), N'status', 'ColumnId')
          OR checks.definition LIKE N'%status%'
      );
    IF LEN(@dropStatusConstraints) > 0
        EXEC sys.sp_executesql @dropStatusConstraints;

    ALTER TABLE dbo.tournaments WITH CHECK
        ADD CONSTRAINT CK_tournaments_status CHECK (status IN (
            N'DRAFT', N'OPEN', N'CLOSED', N'ONGOING', N'COMPLETED', N'CANCELLED'
        ));
    ALTER TABLE dbo.tournaments CHECK CONSTRAINT CK_tournaments_status;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
