/*
 * EquiX v4 verified email-change flow.
 * Microsoft SQL Server only; additive and idempotent.
 */
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.users', N'U') IS NULL
        THROW 50040, N'Expected table dbo.users was not found.', 1;

    IF OBJECT_ID(N'dbo.email_change_tokens', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.email_change_tokens (
            id bigint IDENTITY(1,1) NOT NULL CONSTRAINT pk_email_change_tokens PRIMARY KEY,
            user_id bigint NOT NULL,
            new_email nvarchar(255) NOT NULL,
            token_hash nvarchar(200) NOT NULL,
            expires_at datetime2 NOT NULL,
            is_used bit NOT NULL CONSTRAINT df_email_change_tokens_used DEFAULT (0),
            created_at datetime2 NOT NULL CONSTRAINT df_email_change_tokens_created DEFAULT (sysdatetime()),
            CONSTRAINT fk_email_change_tokens_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
        );
    END;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.email_change_tokens')
          AND name = N'ix_email_change_tokens_active'
    )
        CREATE INDEX ix_email_change_tokens_active
            ON dbo.email_change_tokens(user_id, is_used, expires_at);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
