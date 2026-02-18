
const mongoose = require('mongoose');

const run = async () => {
    try {
        await mongoose.connect('mongodb+srv://lagisettipallavi607:pallavi@cluster0.bfzhbf8.mongodb.net/');
        console.log('Connected to DB');
        const collection = mongoose.connection.collection('applications');
        const app = await collection.findOne({ email: 'test@example.com' });
        if (app) {
            console.log('OTP:', app.otp);
        } else {
            console.log('User not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
