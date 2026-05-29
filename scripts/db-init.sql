-- Schema definitions
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'app')
BEGIN
    EXEC('CREATE SCHEMA [app]');
END
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'fin')
BEGIN
    EXEC('CREATE SCHEMA [fin]');
END
GO

-- 1. Patients Table (dbo schema by default)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Patients' and xtype='U')
BEGIN
    CREATE TABLE dbo.Patients (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        Phone NVARCHAR(50),
        DateOfBirth DATE NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE()
    );
END
GO

-- 2. Appointments Table (app schema)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' and xtype='U')
BEGIN
    CREATE TABLE app.Appointments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL,
        DoctorId INT NOT NULL,
        AppointmentTime DATETIME NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Scheduled',
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Appointments_Patients FOREIGN KEY (PatientId) REFERENCES dbo.Patients(Id)
    );
END
GO

-- 3. Invoices Table (fin schema)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' and xtype='U')
BEGIN
    CREATE TABLE fin.Invoices (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PatientId INT NOT NULL,
        AppointmentId INT NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        Status NVARCHAR(50) DEFAULT 'Pending',
        DueDate DATE NOT NULL,
        CreatedAt DATETIME DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Invoices_Patients FOREIGN KEY (PatientId) REFERENCES dbo.Patients(Id),
        CONSTRAINT FK_Invoices_Appointments FOREIGN KEY (AppointmentId) REFERENCES app.Appointments(Id)
    );
END
GO
