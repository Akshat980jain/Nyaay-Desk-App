const mongoose = require('mongoose');
const LegalCase = require('./models/LegalCase');

mongoose.connect('mongodb://localhost:27017/court_case_manager', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    const cases = await LegalCase.find({ case_num: 'CL2026M874' });
    console.log(JSON.stringify(cases, null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
