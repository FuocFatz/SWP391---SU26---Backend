/*
  EquiX - initial account points and point-to-gift-code exchange
  SQL Server 2019+
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.reward_types', 'point_cost') IS NULL
BEGIN
    ALTER TABLE dbo.reward_types
        ADD point_cost int NOT NULL
            CONSTRAINT DF_reward_types_point_cost DEFAULT (0) WITH VALUES;
END;

EXEC sys.sp_executesql N'
    UPDATE dbo.reward_types
    SET point_cost = CASE UPPER(name)
        WHEN ''DRINK_COUPON'' THEN 150
        WHEN ''VOUCHER'' THEN 300
        ELSE point_cost
    END
    WHERE UPPER(name) IN (''DRINK_COUPON'', ''VOUCHER'')
      AND point_cost = 0;';

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.reward_types')
      AND name = 'CK_reward_types_point_cost_nonnegative'
)
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.reward_types WITH CHECK
            ADD CONSTRAINT CK_reward_types_point_cost_nonnegative CHECK (point_cost >= 0);';
END;

IF COL_LENGTH('dbo.reward_history', 'points_spent') IS NULL
BEGIN
    ALTER TABLE dbo.reward_history
        ADD points_spent int NOT NULL
            CONSTRAINT DF_reward_history_points_spent DEFAULT (0) WITH VALUES;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.reward_history')
      AND name = 'CK_reward_history_points_spent_nonnegative'
)
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.reward_history WITH CHECK
            ADD CONSTRAINT CK_reward_history_points_spent_nonnegative CHECK (points_spent >= 0);';
END;

DECLARE @OldRewardPointsDefault sysname;
SELECT @OldRewardPointsDefault = dc.name
FROM sys.default_constraints dc
JOIN sys.columns c
  ON c.object_id = dc.parent_object_id
 AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.users')
  AND c.name = 'reward_points';

DECLARE @NeedsRewardPointsUpgrade bit =
    CASE WHEN @OldRewardPointsDefault = 'DF_users_reward_points_500' THEN 0 ELSE 1 END;

IF @NeedsRewardPointsUpgrade = 1 AND @OldRewardPointsDefault IS NOT NULL
BEGIN
    DECLARE @DropRewardPointsDefaultSql nvarchar(1000) =
        N'ALTER TABLE dbo.users DROP CONSTRAINT ' + QUOTENAME(@OldRewardPointsDefault) + N';';
    EXEC sys.sp_executesql @DropRewardPointsDefaultSql;
END;

IF @NeedsRewardPointsUpgrade = 1
BEGIN
    ALTER TABLE dbo.users
        ADD CONSTRAINT DF_users_reward_points_500 DEFAULT (500) FOR reward_points;

    -- Repair only the accounts that predate this migration. Re-running the script
    -- must not refill an account that legitimately spent its balance down to zero.
    UPDATE dbo.users
    SET reward_points = 500
    WHERE reward_points IS NULL OR reward_points = 0;
END;

COMMIT TRANSACTION;

EXEC sys.sp_executesql N'
    SELECT id, name, point_cost, active, requires_shipping
    FROM dbo.reward_types
    ORDER BY id;';
