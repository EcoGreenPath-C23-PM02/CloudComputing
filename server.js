const express = require('express')
const app = express()
const mysql = require('mysql')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')

app.use(express.json())

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ecogreenpath_db'
})

// register 
app.post('/register', (req, res) => {
    const {username, firstName, lastName, phoneNumber, email, password, birth} = req.body
    // checking if the username exist
    try{
        con.query(`SELECT * FROM user_table WHERE username = ${mysql.escape(username)}`, (err, result) => {
            if(err){
                res.status(500).json({
                    error: err
                })
                return
            }if(result.length > 0){
                res.status(400).json({
                    message: 'Username already exist'
                })
                return
            }
            // Generate a user ID
            const userID = uuidv4()
            // Create the user in the database
            const createdAt = new Date()
            con.query(`INSERT INTO user_table(user_id, username, email, password, phone_number, birth, firstName, lastName, createdAt) 
                        VALUES (${mysql.escape(userID)}, ${mysql.escape(username)}, ${mysql.escape(email)}, ${mysql.escape(password)}, ${mysql.escape(phoneNumber)}, ${mysql.escape(birth)}, ${mysql.escape(firstName)}, ${mysql.escape(lastName)}, ${mysql.escape(createdAt)})`, (err) => {
                if (err) {
                    res.status(500).json({
                        error: err.message
                    })
                    return
                }
                // Successfully created the user
                res.status(201).json({
                    message: 'Registration successful',
                    user: {
                        userID,
                        username,
                        email,
                        firstName,
                        lastName,
                        phoneNumber,
                        birth,
                        createdAt
                    }
                })
            })
        })

    }catch(error){
        res.status(500).json({
            error: error.message
        })
    }
})

//questionnaire
app.get('/questionnaire', (req, res) => {
    con.query('SELECT * FROM questionnaire', (err, result) => {
        if(err){
            res.status(500).json({
                message:err
            })
        }if(result){
            res.status(200).json({
                data : result
            })
        }
    })
})
app.post('/questionnaire/:id', (req, res) => {
    const {id} = req.params
    const {responses} = req.body
    con.query(`INSERT INTO  questionnaire_responses VALUES (${mysql.escape(id)}, ${mysql.escape(responses)})`, (err, result) =>{
        if(err){
            res.status(500).json({
                message:err
            })
        }if(result){
            console.log(result)
            res.status(200).json({
                data : 'data added successfully'
            })
        }
    })
})

//login 
const secret = 'this is secret'
app.post('/login', (req, res) => {
    const {username, password} = req.body
    con.query(`SELECT * FROM user_table WHERE username = ${mysql.escape(username)}`, (err, result) => {
        if(err){
            res.status(500).json({
                error: 'the server encountered an unexpected condition that prevented it from fulfilling the request'
            })
            return
        }else if(result.length !== 0){
            if(result[0].username == username && result[0].password == password) {
                const token = jwt.sign(username, secret)
                const user_id = result[0].user_id
                res.status(200).json({
                    message: {
                        status : 'login success',
                        user_id,
                        username,
                        password,
                        token
                    }
                })
            }else{
                res.status(401).json({
                    message:'wrong password'
                })
            }
        }else{
            res.status(401).json({
                message:'login failed'
            })
        }
    })
})

//profile
app.get('/profile/:id', (req, res) => {
    const {id} = req.params
    con.query(`SELECT * FROM user_table WHERE user_id = ${mysql.escape(id)}`, (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                data:result
            })
        }
    })
})
app.put('/profile/:id', (req, res) => {
    const {id} = req.params
    const {email, password, phone_number, profile_picture} = req.body
    con.query(`UPDATE user_table SET email = ${mysql.escape(email)}, password = ${mysql.escape(password)}, phone_number = ${mysql.escape(phone_number)}, profile_picture = ${mysql.escape(profile_picture)} WHERE user_id = ${mysql.escape(id)}`, (err, result) => {
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                message:'update data successfully'
            })
        }
    })
})
//homepage
app.get('/homepage/:id', (req, res) => {
    const {id} = req.params
    con.query(`SELECT * FROM questionnaire_responses WHERE user_id = ${mysql.escape(id)}`, (err, result) => {
        if(err){
            res.status(500).json({  
                error: err
            })
        }if(result){
            res.status(200).json({ 
                data:result
            })
        }
    })
})

//quest
app.get('/quest', (req, res) => {
    con.query('SELECT * FROM quest_list', (err, result) =>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                data: result
            })
        }
    })
})
app.post('/quest/:id', (req, res) => {
    const id = req.params.id
    const {quest_id} = req.body
    con.query(`INSERT INTO user_quest VALUES (${mysql.escape(id)}, ${mysql.escape(quest_id)})`, (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                message: 'data added successfully'
            })
        }
    })
})

//maps
app.get('/maps', (req, res) =>{
    con.query('SELECT * FROM village', (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                data:result
            })
        }
    })
})
app.get('/maps/:id', (req, res)=>{
    const {id} = req.params
    con.query(`SELECT * FROM village WHERE village_id= ${mysql.escape(id)}`, (err, villageResult) => {
        if(err){
            res.status(500).json({
                error:err
            })
        }else{
            con.query(`SELECT * FROM detail_activity WHERE village_id = ${mysql.escape(id)}`, (err, activityResult) => {
                if(err){
                    res.status(500).json({
                        error:err
                    })
                }else{
                    res.status(200).json({
                        data:{
                            villageResult,
                            activityResult
                        }
                    })
                }
            })
        }
    })
})

app.get('/maps/:id/activities', (req, res)=>{
    const {id} = req.params
    con.query(`SELECT * FROM detail_activity WHERE village_id =${mysql.escape(id)}`, (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                data:result
            })
        }
    })
})

//maps for admin
app.post('/maps', (req, res)=>{
    const village_id = generateShortId()
    const {village_lat, village_lng, name, desc, province, regency, district, social_media, contact, pic} = req.body
    con.query(`INSERT INTO village VALUES (${mysql.escape(village_id)}, ${mysql.escape(village_lat)}, ${mysql.escape(village_lng)}, ${mysql.escape(name)}, ${mysql.escape(desc)}, ${mysql.escape(province)}, ${mysql.escape(regency)}, ${mysql.escape(district)}, ${mysql.escape(social_media)}, ${mysql.escape(contact)}, ${mysql.escape(pic)})`, (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                message:'data added successfully',
                village_id,
                village_lat,
                village_lng,
                name,
                desc,
                province,
                regency,
                district,
                social_media,
                contact,
                pic
            })
        }
    })
})
app.post('/maps/:id/activities', (req, res)=>{
    const {id} = req.params
    const activity_id = generateShortId()
    const {activity_location, activity_name, activity_category, activity_level, activity_desc} = req.body
    con.query(`INSERT INTO detail_activity VALUES (${mysql.escape(activity_id)},${mysql.escape(id)}, ${mysql.escape(activity_location)}, ${mysql.escape(activity_name)}, ${mysql.escape(activity_category)}, ${mysql.escape(activity_level)}, ${mysql.escape(activity_desc)})`, (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                message:'data added successfully',
                activity_id,
                id  ,
                activity_location,
                activity_name,
                activity_category,
                activity_level,
                activity_desc
            })
        }
    })
})
//questionnaire for admin 
app.post('/questionnaire', (req, res) => {
    const quisioner_id = uuidv4()
    const {question, choice} = req.body
    const choicesString = JSON.stringify(choice)
    con.query(`INSERT INTO questionnaire VALUES (${mysql.escape(quisioner_id)}, ${mysql.escape(question)}, ${mysql.escape(choicesString)})`, (err, result) =>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                message:'data added successfully',
                quisioner_id,
                question,
                choicesString
            })
        }
    })
})
//quest for admin
app.post('/quest', (req, res)=>{
    const quest_id = generateShortId()
    const {quest, point} = req.body
    con.query(`INSERT INTO quest_list VALUES (${mysql.escape(quest_id)}, ${mysql.escape(quest)}, ${mysql.escape(point)})`, (err, result)=>{
        if(err){
            res.status(500).json({
                error:err
            })
        }if(result){
            res.status(200).json({
                message:'data added successfully',
                quest_id,
                quest,
                point
            })
        }
    })
})

const generateShortId = () => {
    const uuid = uuidv4()
    const shortId = uuid.split('-')[0]
    const eightDigitId = shortId.substring(0, 8)
    return eightDigitId
}
app.listen(3000, () => {
    console.log('Server start on http://localhost:3000')
})