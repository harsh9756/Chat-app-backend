const mongoose = require('mongoose')
require('dotenv').config()
const conn = mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log('connected to db');
})
.catch((err) => {
    console.log("error occured",err);
})
