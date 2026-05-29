const { poolPromise } = require('../config/db');
const { publishEvent } = require('../config/servicebus');

exports.getAppointments = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM app.Appointments');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching appointments: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.createAppointment = async (req, res) => {
    const { patientId, doctorId, appointmentTime, notes } = req.body;
    
    if (!patientId || !doctorId || !appointmentTime) {
        return res.status(400).json({ error: 'patientId, doctorId, and appointmentTime are required.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('patientId', patientId)
            .input('doctorId', doctorId)
            .input('appointmentTime', appointmentTime)
            .input('notes', notes || '')
            .query(`
                INSERT INTO app.Appointments (PatientId, DoctorId, AppointmentTime, Notes)
                OUTPUT INSERTED.*
                VALUES (@patientId, @doctorId, @appointmentTime, @notes)
            `);
        
        const appointment = result.recordset[0];
        
        // Publish event to Service Bus
        await publishEvent('AppointmentCreated', appointment);

        res.status(201).json(appointment);
    } catch (err) {
        console.error('Error creating appointment: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
