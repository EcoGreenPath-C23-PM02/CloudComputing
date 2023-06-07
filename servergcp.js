const express = require('express')
const app = express()
const mysql = require('mysql')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const Multer = require('multer')
const axios = require('axios')
const bcrypt = require('bcrypt')

app.use(express.json())

//connect to mysql database
const con = mysql.createConnection({
    host: '34.101.186.79',
    user: 'root',
    password: 'SomeDay010623',
    database: 'ecogreenpath_db'
})
//check if connect to database
con.connect(function(err) {
    if (err) throw err
    console.log('Connected!')
})

//setup google cloud storage
const {
    Storage
} = require('@google-cloud/storage')

const storage = new Storage({
    projectId: 'egp-dev-260523',
    keyFilename: 'serviceaccountkey.json'
})

//setup mutler
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})
//============================================================================


// register 
app.post('/register', (req, res) => {
    const {username, firstName, lastName, phoneNumber, email, password, birth} = req.body
    try{
        //hashing the password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' })
            }
            //hashing the password
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    return res.status(500).json({ error: 'Internal server error' })
                }
                //look if username already exist
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
                    //insert to user_table new data
                    con.query(`INSERT INTO user_table(user_id, username, email, password, phone_number, birth, firstName, lastName, createdAt) 
                                VALUES (${mysql.escape(userID)}, ${mysql.escape(username)}, ${mysql.escape(email)}, ${mysql.escape(hash)}, ${mysql.escape(phoneNumber)}, ${mysql.escape(birth)}, ${mysql.escape(firstName)}, ${mysql.escape(lastName)}, ${mysql.escape(createdAt)})`, (err) => {
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
    const { username, password } = req.body
    //checking the username 
    con.query(`SELECT * FROM user_table WHERE username = ${mysql.escape(username)}`, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' })
        }
        //authethicate the username and the password
        if (result.length !== 0) {
            const user = result[0]

            bcrypt.compare(password, user.password, (err, passwordMatch) => {
                if (err) {
                    return res.status(500).json({ error: 'Internal server error' })
                }
    
                if (passwordMatch) {
                    const token = jwt.sign({ username }, secret)
                    const user_id = user.user_id

                    return res.status(200).json({
                        message: {
                            status: 'Login successful',
                            user_id,
                            username,
                            token
                        }   
                    })
                } else {
                    return res.status(401).json({ error: 'Invalid credentials' })
                }
            })
        } else {
            return res.status(401).json({ error: 'Invalid credentials' })
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

// Route untuk mendapatkan rekomendasi CF dari server Python
app.get('/homepage/:id/cf_recommendation', (req, res) => {
    const userId = req.params.id
    const pythonUrl = `replace this with /homepage:${userId}/cf_recommendation` // Ganti dengan URL sesuai server Python
    axios.get(pythonUrl)
        .then(response => {
            const recommendations = response.data.recommendations
            // Lakukan apa pun dengan data rekomendasi CF yang diterima
            res.json(recommendations)
        }).catch(error => {
            console.error('Error:', error)
            res.status(500).json({ message: 'Internal Server Error' })
        })
})
// Route untuk mendapatkan rekomendasi CBF dari server Python
app.get('/homepage/:id/cbf_recommendation', (req, res) => {
    const userId = req.params.id
    const pythonUrl = `https://mlapi-dot-egp-dev-260523.uc.r.appspot.com/homepage:${userId}/cbf_recommendation` // Ganti dengan URL sesuai server Python

    axios.get(pythonUrl)
        .then(response => {
            const recommendations = response.data.recommendations
            // Lakukan apa pun dengan data rekomendasi CBF yang diterima
            res.json(recommendations)
        }).catch(error => {
            console.error('Error:', error)
            res.status(500).json({ message: 'Internal Server Error' })
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

app.post('/quest/:id', multer.single('image'), (req, res) =>{
    const {id} = req.params
    const {user_desc} = req.body
    try {
        const bucketName = 'prof-photo-020623'
        const file = req.file

        // Create a new filename for the uploaded image
        const filename = `${Date.now()}_${file.originalname}`

        // Upload the image to the GCS bucket
        const bucket = storage.bucket(bucketName)
        const blob = bucket.file(filename)

        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        })
        console.log(filename)
        blobStream.on('error', (err) => {
            console.error('Error uploading image:', err)
            res.status(500).send('Error uploading image')
        })

        blobStream.on('finish', () => {
            const imageUrl = `https://storage.googleapis.com/${bucketName}/${filename}`
            console.log('image uploaded successfully')
            con.query(`INSERT INTO user_quest VALUES (${mysql.escape(id)}, ${mysql.escape(imageUrl)}, ${mysql.escape(user_desc)})`, (err) =>{
                if (err) throw err
                console.log('Image URL saved to the database')
                res.status(200).send({
                    data:{
                        id,
                        imageUrl,
                        user_desc
                    }
                })
            })
        })

        blobStream.end(file.buffer)
    } catch (err) {
        res.status(500).send('Error uploading image')
    }
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
    con.query(`SELECT * FROM detail_activity WHERE activity_id= ${mysql.escape(id)}`, (err, villageResult) => {
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
app.listen(8080, () => {
    console.log('Server start on http://localhost:8080')
})