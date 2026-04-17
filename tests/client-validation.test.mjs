import assert from 'node:assert/strict';
import { ClientSchema } from '../src/lib/validations.js';

function buildClientFormPayload() {
  return {
    firstName: 'Maria',
    lastName: 'Lopez',
    email: '',
    phone: '(416) 555-0198',
    dateOfBirth: '1990-01-02',
    gender: 'Female',
    ssn: '123-45-6789',
    address: '123 Main St',
    city: 'Atlanta',
    state: 'Georgia',
    zipCode: '30309',
    status: 'ACTIVE',
    insuranceType: 'Health',
    insuranceId: 'POL-123',
    emergencyContacts: [
      {
        name: 'Jane Lopez',
        relation: 'Sister',
        phone: '(416) 555-0101',
        email: 'jane@example.com',
      },
    ],
  };
}

function run() {
  const result = ClientSchema.safeParse(buildClientFormPayload());

  assert.equal(
    result.success,
    true,
    'expected a typical client form submission payload to validate'
  );
}

run();
console.log('client validation tests passed');
