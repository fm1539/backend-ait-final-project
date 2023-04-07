import express from 'express'
import path from 'path'
import sanitize from 'mongo-sanitize';
import session from 'express-session';
import md5 from 'md5'
import './db.mjs';
import { fileURLToPath } from 'url';
import cors from 'cors'
import bodyParser from 'body-parser';
import mongoose from 'mongoose'
import { startAuthenticatedSession } from './auth.mjs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors())
app.use(bodyParser.json())

const sess = {
    secret: "knsdkjlfnejkfnjkewnfioewbfoiuewbf",
    cookie: {},
    resave: true,
    saveUninitialized: true,
}

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

const User = mongoose.model("User")

app.get("/isAuthenticated/:username", (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    console.log(req.session.user)
    if (req.session.user && req.session.user.username && req.session.user.username === req.params.username) res.send(true)
    else res.send(false)
})

app.get("/profile/:username", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const username = req.params.username
    const user = await User.findOne({ username: username }).exec()
    res.send({
        firstName: user._doc.fName,
        lastName: user._doc.lName
    })
})

app.post("/profile/update", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    console.log(req.body)
    const newUsername = req.body.newUsername
    const origUsername = req.body.username
    const user = await User.findOne({ username: origUsername })
    console.log(user)
    if (user) {
        user.username = newUsername
        await user.save()
        console.log("NOW SENDING RESPONSE")
        res.send("successful")
    }
    else res.send("unsuccessful")

})

app.post("/login", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const { username } = req.body
    const incomingPassword = md5(req.body.password)
    const foundUser = await User.findOne({ username: username }).exec()
    if (foundUser) {
        if (incomingPassword === foundUser.password) {
            startAuthenticatedSession(req, foundUser)
                .then(user => {
                    console.log("SESSION", req.session)
                    console.log("LOGGED IN USER", user)
                    res.send({
                        status: "successful",
                        username: username
                    })
                })
        }
        else res.send({
            status: "unsuccessful"
        })
    }
    else res.send({
        status: "unsuccessful"
    })
})

app.post("/register", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    console.log(req.body)
    const { fName, lName } = req.body
    const username = sanitize(req.body.userName)
    const password = sanitize(md5(req.body.password))
    const userExists = await User.findOne({ username: username }).exec()
    console.log("REGISTER", userExists)
    if (!userExists) {
        const newUser = new User({
            fName: fName,
            lName: lName,
            username: username,
            password: password
        })
        await newUser.save()
        res.send("registered")
    }
    else res.send("user already exists")
})
''
app.listen(process.env.PORT || 8080);
