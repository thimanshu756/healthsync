const express = require('express');
const { logger } = require('./config/db');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Routes
app.use('/patients', patientRoutes);

// Health probe endpoint for Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Healthy', service: 'patient-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Exception: ', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  logger.info(`Patient Service listening on port ${port}`);
});
