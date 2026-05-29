const express = require('express');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.use('/appointments', appointmentRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Healthy', service: 'appointment-service' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Appointment Service listening on port ${port}`);
    });
}

module.exports = app; // Export for testing
