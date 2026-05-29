const { sql, poolPromise, logger } = require('../config/db');
const { publishEvent } = require('../config/serviceBus');

// In-memory fallback if DB is not connected
let mockPatients = [
  { Id: 1, FirstName: 'John', LastName: 'Doe', Email: 'john@example.com', Phone: '1234567890', DateOfBirth: '1990-01-01' }
];

exports.getAllPatients = async (req, res) => {
  try {
    if (poolPromise) {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM dbo.Patients');
      res.json(result.recordset);
    } else {
      res.json(mockPatients);
    }
  } catch (err) {
    logger.error('Error fetching patients: ', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    if (poolPromise) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM dbo.Patients WHERE Id = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json(result.recordset[0]);
    } else {
      const patient = mockPatients.find(p => p.Id === parseInt(req.params.id));
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      res.json(patient);
    }
  } catch (err) {
    logger.error('Error fetching patient: ', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth } = req.body;
    let newPatientId = null;

    if (poolPromise) {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('FirstName', sql.NVarChar, firstName)
        .input('LastName', sql.NVarChar, lastName)
        .input('Email', sql.NVarChar, email)
        .input('Phone', sql.NVarChar, phone)
        .input('DateOfBirth', sql.Date, dateOfBirth)
        .query(`
          INSERT INTO dbo.Patients (FirstName, LastName, Email, Phone, DateOfBirth) 
          OUTPUT INSERTED.Id
          VALUES (@FirstName, @LastName, @Email, @Phone, @DateOfBirth)
        `);
      newPatientId = result.recordset[0].Id;
      res.status(201).json({ message: 'Patient created successfully', Id: newPatientId });
    } else {
      newPatientId = mockPatients.length + 1;
      const newPatient = { Id: newPatientId, FirstName: firstName, LastName: lastName, Email: email, Phone: phone, DateOfBirth: dateOfBirth };
      mockPatients.push(newPatient);
      res.status(201).json({ message: 'Patient created successfully', Id: newPatientId, data: newPatient });
    }

    // Publish event
    const eventPayload = {
      Id: newPatientId,
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      CreatedAt: new Date().toISOString()
    };
    await publishEvent('PatientRegistered', eventPayload);

  } catch (err) {
    logger.error('Error creating patient: ', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    if (poolPromise) {
      const pool = await poolPromise;
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM dbo.Patients WHERE Id = @id');
      res.json({ message: 'Patient deleted successfully' });
    } else {
      mockPatients = mockPatients.filter(p => p.Id !== parseInt(req.params.id));
      res.json({ message: 'Patient deleted successfully' });
    }
  } catch (err) {
    logger.error('Error deleting patient: ', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
