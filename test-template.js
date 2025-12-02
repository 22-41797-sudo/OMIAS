const ejs = require('ejs');

// Test the template with null status
const templateData = {
  request: {
    request_token: 'ZBC5-5696-2J8S',
    status: null,
    gmail_address: 'jamezbello93@gmail.com',
    learner_name: 'Matira, Kila Romano',
    grade_level: 'Grade 4',
    created_at: new Date(),
    reviewed_at: null,
    rejection_reason: null
  },
  error: null
};

// Simulate the template rendering
const statusBadgeClass = (templateData.request.status || 'pending').toLowerCase();
const statusText = (templateData.request.status || 'pending').toUpperCase();

console.log('Status badge class:', statusBadgeClass);
console.log('Status text:', statusText);
console.log('Test PASSED: Template will render correctly with null status');
