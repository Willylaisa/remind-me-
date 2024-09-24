// REQUIREMENTS
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const newUser = require('./models/newUser');
const newTask = require('./models/newTask');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// MIDDLEWARE MOSTLY FOR GETTING THE FORM DATA FROM THE LOGIN AND SIGNUP PAGES
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// MONGOOSE... FOR CREATING A SCHEMA
mongoose.connect('mongodb+srv://codenito:Code.007@nodeapi.xr7lkoc.mongodb.net/Remind-Me?retryWrites=true&w=majority');
mongoose.connection.on("error", err => {
    console.log(err);
});

// CONNECT TO DATABASE
let database; // global variable to store the MongoDB connection object
function connectDB(callback) {
    MongoClient.connect('mongodb+srv://codenito:Code.007@nodeapi.xr7lkoc.mongodb.net/Remind-Me?retryWrites=true&w=majority')
        .then((connected) => {
            database = connected.db();
            return callback();
        })
        .catch(err => {
            console.log(err);
            return callback(err);
        });
}

// SERVER LISTEN
connectDB((err) => {
    if (!err) {
        const PORT = 8080;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
});

// ROUTES
// 1. LOGIN
app.post('/login', (req, res) => {
    const email = req.body['email'];
    const password = req.body['password'];

    let secretInfo = [];
    database.collection('profiles')
        .find()
        .forEach(profile => secretInfo.push(profile))
        .then(() => {
            for (let i = 0; i < secretInfo.length; i++) {
                if (secretInfo[i].email === email && secretInfo[i].password === password) {
                    const id = secretInfo[i]._id;
                    return res.redirect(`https://remind-me-app-ochre.vercel.app/tasks/${id}`);
                }
            }
            res.send('<h1>Error: Email and password don\'t match</h1> <h3>Please go back and sign up if you do not have an account</h3>');
        });
});

// GET TASKS
app.get('/users/:id', async (req, res) => {
    let identification = req.params.id;
    newUser.findById(identification.toString())
        .then((user) => {
            res.status(200).send(user);
        })
        .catch((error) => {
            res.send(error);
        });
});

// SEND TASKS TO FRONTEND
app.get('/tasks', (req, res) => {
    let allTasks;
    let allUsers;
    newTask.find()
        .then((tasks) => {
            allTasks = tasks;
            return newUser.find();
        })
        .then((users) => {
            allUsers = users;
            res.status(200).json(allTasks); // Return all tasks to the frontend
        })
        .catch((error) => {
            res.send(error);
        });
});

// 2. SIGN UP
app.post('/signup', (req, res) => {
    const username = req.body['username'];
    const email = req.body['email'];
    const password = req.body['password'];
    const Confirm_password = req.body['confirmPassword'];

    if (password === Confirm_password) {
        let newuser = new newUser({ username, email, password });
        const id = newuser._id;
        newuser.save()
            .then(res.redirect(`https://remind-me-app-ochre.vercel.app/tasks/${id}`));
    } else {
        res.send('<h1>Passwords do not match!</h1> <h3>Please go back and sign up again<h3>');
    }
});

// NEW TASK
app.post('/create/:id', async (req, res) => {
    const id = req.params.id;
    let username = "";
    let data = [];

    await database.collection('profiles')
        .find()
        .forEach(profile => data.push(profile))
        .then(() => {
            for (let i = 0; i < data.length; i++) {
                if (data[i]._id == id) {
                    username = data[i].username;
                    break;
                }
            }
        });

    const title = req.body['title'];
    const datetime = req.body['datetime'];
    const description = req.body['description'];
    const name = username;

    let newtask = new newTask({ name, title, datetime, description });

    newtask.save()
        .then(() => {
            // Send email immediately after saving the task
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'dddtestfammail@gmail.com', // Updated email
                    pass: 'puhnradfigifnalb'          // Updated password
                }
            });

            // Find user email for the task
            return newUser.findOne({ username: name });
        })
        .then(user => {
            if (user) {
                const email = user.email;

                const mailOptions = {
                    from: 'dddtestfammail@gmail.com', // Updated email
                    to: email,
                    subject: `Reminder: ${title}`,
                    html: `
                    <div>
                        <h1>${title}</h1>
                        <h3>Hallo ${name},</h3>
                        <p>This is just to remind you to perform the following task right now⌚: </p>
                        <p><strong>${title}</strong></p>
                        <p>Description: ${description}</p>
                        <br/>
                        <br />
                        <p>Best regards,</p> 
                        <p>RemindMe Team</p>
                    </div>`
                };

                // Send email immediately
                return transporter.sendMail(mailOptions);
            }
        })
        .then(info => {
            console.log('Email sent: ' + info.response);
            res.redirect(`https://remind-me-app-ochre.vercel.app/tasks/${id}`);
        })
        .catch(err => {
            console.log(err);
            res.send('<h1>Error sending email!</h1>');
        });
});

