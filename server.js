require("dotenv").config();
const app = require('./src/app.js')
const connectDB = require('./src/db/db.js')

connectDB()

app.listen(process.env.PORT, () =>{
    console.log(`Server running on ${process.env.PORT}`)
})