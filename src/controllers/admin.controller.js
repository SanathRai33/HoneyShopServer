const adminModel = require('../models/admins.model.js');
const userModel = require('../models/users.model.js');

const getAllUser = async(req, res) =>{

    const adminId = req.admin;
    const adminExist = await adminModel.find(adminId);

    if(!adminExist){
        return res.status(403).json({
            message: "Admin authentication need for user list"
        })
    }

    const allUsers = await userModel.find();
    
    if(allUsers.length <= 0){
        return res.status(404).json({
            message: "No user login yet"
        })
    }

    return res.status(200).json({
        message: "Successfully fetched users",
        users: allUsers
    })
}

module.exports = { getAllUser }