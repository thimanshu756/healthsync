const request = require('supertest');
const app = require('../src/index');

// Mock the DB and Service Bus dependencies
jest.mock('../src/config/db', () => ({
    poolPromise: Promise.resolve({
        request: () => ({
            input: jest.fn().mockReturnThis(),
            query: jest.fn().mockResolvedValue({
                recordset: [{
                    Id: 1,
                    PatientId: 1,
                    DoctorId: 2,
                    AppointmentTime: '2026-06-01T10:00:00Z',
                    Status: 'Scheduled',
                    Notes: 'Checkup'
                }]
            })
        })
    })
}));

jest.mock('../src/config/servicebus', () => ({
    publishEvent: jest.fn().mockResolvedValue(true)
}));

describe('Appointment API', () => {
    it('GET /health should return 200 Healthy', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'Healthy');
    });

    it('GET /appointments should return a list of appointments', async () => {
        const res = await request(app).get('/appointments');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(1);
    });

    it('POST /appointments should create an appointment and publish an event', async () => {
        const payload = {
            patientId: 1,
            doctorId: 2,
            appointmentTime: '2026-06-01T10:00:00Z',
            notes: 'Checkup'
        };

        const res = await request(app)
            .post('/appointments')
            .send(payload);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('Id', 1);
        
        const { publishEvent } = require('../src/config/servicebus');
        expect(publishEvent).toHaveBeenCalledWith('AppointmentCreated', expect.objectContaining(res.body));
    });
});
