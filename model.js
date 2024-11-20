
const mongoose = require('mongoose');


const mongoURI = 'mongodb+srv://boopathi:12345@cluster0.lvixf.mongodb.net/zigmentdb?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
       
    });


const db = mongoose.connection;
module.exports = db;
