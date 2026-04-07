/* global require, __dirname */
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'services');
if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir, { recursive: true });
    console.log('Services directory created at:', servicesDir);
} else {
    console.log('Services directory already exists');
}
