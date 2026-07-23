/*
  Run this script in SQL Server Management Studio as a server administrator
  after restoring or creating the EquiX database.

  These credentials are intended for the local SWP391 demonstration only.
  Change the password before using the application outside a trusted lab.
*/
USE [master];
GO

IF DB_ID(N'EquiX') IS NULL
    THROW 51000, 'Database EquiX does not exist. Restore EquiX.bak first.', 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'equix_user')
BEGIN
    CREATE LOGIN [equix_user]
        WITH PASSWORD = N'123456',
             CHECK_POLICY = OFF,
             CHECK_EXPIRATION = OFF;
END
ELSE
BEGIN
    ALTER LOGIN [equix_user] WITH PASSWORD = N'123456';
    ALTER LOGIN [equix_user] ENABLE;
END;
GO

USE [EquiX];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'equix_user')
    CREATE USER [equix_user] FOR LOGIN [equix_user];
GO

IF IS_ROLEMEMBER(N'db_datareader', N'equix_user') <> 1
    ALTER ROLE [db_datareader] ADD MEMBER [equix_user];
GO

IF IS_ROLEMEMBER(N'db_datawriter', N'equix_user') <> 1
    ALTER ROLE [db_datawriter] ADD MEMBER [equix_user];
GO

SELECT DB_NAME() AS database_name,
       SUSER_SNAME() AS executed_by,
       USER_NAME() AS database_user;
GO
