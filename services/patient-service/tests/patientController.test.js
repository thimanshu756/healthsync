const request = require('supertest');
const express = require('express');
const patientRoutes = require('../src/routes/patientRoutes');

jest.mock('../src/config/db', () => ({
  sql: {},
  poolPromise: null,
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../src/config/serviceBus', () => ({
  publishEvent: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/patients', patientRoutes);

describe('Patient Controller API Tests', () => {
  it('should return all patients', async () => {
    const res = await request(app).get('/patients');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('should return a patient by id', async () => {
    const res = await request(app).get('/patients/1');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('Id', 1);
  });

  it('should create a new patient', async () => {
    const newPatient = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '0987654321',
      dateOfBirth: '1995-05-05'
    };
    const res = await request(app)
      .post('/patients')
      .send(newPatient);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Patient created successfully');
    expect(res.body).toHaveProperty('Id');
  });
});
