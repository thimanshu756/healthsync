const { sql, poolPromise, logger } = require('../config/db');

// In-memory fallback if DB is not connected (useful for quick local testing before CSI injects secrets)
let mockPatients = [
  { id: 1, name: 'John Doe', email: 'john@example.com' }
];

exports.getAllPatients = async (req, res) => {
  try {
    if (poolPromise) {
      const pool = await poolPromise;
      const result = await pool.request().query('SELECT * FROM Patients');
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
        .query('SELECT * FROM Patients WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json(result.recordset[0]);
    } else {
      const patient = mockPatients.find(p => p.id === parseInt(req.params.id));
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
    const { name, email } = req.body;
    if (poolPromise) {
      const pool = await poolPromise;
      await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .query('INSERT INTO Patients (name, email) VALUES (@name, @email)');
      res.status(201).json({ message: 'Patient created successfully' });
    } else {
      const newPatient = { id: mockPatients.length + 1, name, email };
      mockPatients.push(newPatient);
      res.status(201).json({ message: 'Patient created successfully', data: newPatient });
    }
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
        .query('DELETE FROM Patients WHERE id = @id');
      res.json({ message: 'Patient deleted successfully' });
    } else {
      mockPatients = mockPatients.filter(p => p.id !== parseInt(req.params.id));
      res.json({ message: 'Patient deleted successfully' });
    }
  } catch (err) {
    logger.error('Error deleting patient: ', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
