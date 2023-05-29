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

// app.post('/register', (req, res) => {
//     try {
//         const {username, firstName, lastName, phoneNumber, email, password, password2, birth} = req.body

//         if(password == password2){
//             const userID = uuidv4()
//             const createdAt = new Date();
//             con.query(`INSERT INTO user_table(user_id, username, email, password, phone_numberm, birth, firstName, lastName, createdAt) 
//                         VALUES (${userID}, ${username}, ${email}, ${password}, ${phoneNumber}, ${birth}, ${firstName}, ${lastName}, ${createdAt})`)
//     }
//         res.status(201).json({ message: 'Registration successful' })
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' })
//     }
// })

// register =================================================
app.post('/register', (req, res) => {
    const {
        username,
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        password2,
        birth,
    } = req.body

    // checking if the username exist =================================
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
        // // Validate the password
        if (password !== password2) {
            res.status(400).json({
                error: 'The passwords do not match'
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
                    error: err
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
                    createdAt,
                }
            })
        })
    })
})
// app.post('/login', (req, res) => {
//     const {username, password} = req.body

//     con.query('SELECT * FROM user_table WHERE username = ?', [username], (res, err) => {
        

//     })
// })




app.listen(3000, () => {
    console.log('Server start on http://localhost:3000')
})

