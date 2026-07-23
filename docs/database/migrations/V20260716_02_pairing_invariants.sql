/* Additive SQL Server migration: enforce EquiX R01/R02 under concurrent requests. */
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_pairing_active_horse' AND object_id = OBJECT_ID('dbo.pairing_contracts'))
    CREATE UNIQUE INDEX ux_pairing_active_horse ON dbo.pairing_contracts(horse_id) WHERE status = N'ACTIVE';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_pairing_active_jockey' AND object_id = OBJECT_ID('dbo.pairing_contracts'))
    CREATE UNIQUE INDEX ux_pairing_active_jockey ON dbo.pairing_contracts(jockey_id) WHERE status = N'ACTIVE';

COMMIT TRANSACTION;
