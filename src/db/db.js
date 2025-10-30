const mongoose = require('mongoose')

function connectDB () {
    mongoose.connect(process.env.MONGO_URI)
    .then( () =>{
        console.log("Devashya Naturals Database connected successfully")
    } )
    .catch((error)=>{
        console.log(error)
    })
}

module.exports = connectDB;