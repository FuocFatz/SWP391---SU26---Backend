-- Additive SQL Server migration. It is safe to run repeatedly and does not remove user data.
IF COL_LENGTH('dbo.notifications', 'read_at') IS NULL
BEGIN
    ALTER TABLE dbo.notifications ADD read_at datetime2 NULL;
END;
