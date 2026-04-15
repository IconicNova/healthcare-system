const stamp = Date.now();
const payload = {
  firstName: 'asdfasdfasdf',
  lastName: 'zzzzzzzzzz',
  email: `garbage.${stamp}@example.com`,
  password: 'password123',
  confirmPassword: 'password123',
  phone: '4165550198',
  branch: 'Atlanta Main Office',
  role: 'Staff',
  payType: 'Hourly',
  status: 'Active',
  payRate: '0',
};
module.exports = payload;
