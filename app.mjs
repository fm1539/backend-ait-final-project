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
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import cookieParser from 'cookie-parser';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import MongoStore from 'connect-mongo';


app.use(cors({
    origin: ["http://localhost:3000", "https://ait-final-project-y4qe.vercel.app"],
    credentials: true
}))
// app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


const User = mongoose.model("User")
const Store = mongoose.model("Store")
const Item = mongoose.model("Item")

const sess = {
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://fm1539:6M2Swvd083GgGmhO@aitdbcluster.gbfatnd.mongodb.net/?retryWrites=true&w=majority',
      ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    }),
    secret: 'cat',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
}

if (app.get('env') === 'production') {
    console.log("THIS IS PROD ENV ")
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
  }
  app.use(session(sess));

// app.use(cookieParser('cat'))
app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy({ usernameField: 'username' }, async function (username, password, done) {
    console.log(username, password)
    try {
        const user = await User.findOne({ username: username })
        if (!user) { return done(null, false); }
        if (user.password !== md5(password)) { return done(null, false); }
        return done(null, user);
    }
    catch (e) {
        console.log(e)
        return done(e)
    }
}))

passport.serializeUser(function (user, done) {
    console.log(`serialize: user:${user}`);
    done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
    const user = await User.findOne({_id: id})
    done(null, user)
});




const isAuthenticated = (req, res, next) => {
    console.log("HERE", req)
    console.log(req.isAuthenticated())
    if (req.isAuthenticated()) return next()
    res.send("Not authenticated")
}

app.get("/isAuthenticated/:username", (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.session.user && req.session.user.username && req.session.user.username === req.params.username) res.send(true)
    else res.send(false)
})

app.get("/retrieveUserInfo", isAuthenticated, async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const username = req.user.username
    const user = await User.findOne({ username }).exec()
    res.json(user)
})

app.get("/profile", isAuthenticated, async (req, res) => {
    const username = req.user.username
    const user = await User.findOne({ username: username }).exec()
    res.send({
        firstName: user._doc.fName,
        lastName: user._doc.lName,
        username: username
    })
})

app.get("/myStore/items", isAuthenticated, async (req, res) => {
    const user = await User.findOne({username: req.user.username}).populate('store')
    const store = await Store.findOne({_id: user.store._id}).populate('items')
    console.log(store)
    res.send(store.items)    

})

app.post("/addItem", isAuthenticated, async (req, res) => {
    const { itemName, price } = req.body.item
    const store = await Store.findOne({_id: req.user.store})
    const newItem = new Item({
        item: itemName,
        price: price
    })
    const newItemSaved = await newItem.save()
    store.items.push(newItemSaved)
    await store.save()
})

app.post("/createStore", isAuthenticated, async (req, res) => {
    const { storeName } = req.body
    console.log(storeName)
    const username = req.user.username
    const findStoreWithGivenName = await Store.findOne({storeName})
    const user = await User.findOne({username})
    if (findStoreWithGivenName) res.send("Store with this name already exists")
    else {
        const newStore = new Store({
            owner: user._id,
            storeName: storeName,
            items: []
        })
        const newStoreSaved = await newStore.save()
        user.hasStore = true
        user.store = newStoreSaved._id
        req.user = user
        await user.save()
        res.send("successful")
    }
})

app.post("/profile/update", isAuthenticated, async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    console.log(req.body)
    const newUsername = req.body.newUsername
    const origUsername = req.user.username
    const user = await User.findOne({ username: origUsername })
    console.log(user)
    if (user) {
        user.username = newUsername
        req.user.username = newUsername
        await user.save()
        res.send("successful")
    }
    else res.send("unsuccessful")

})

app.post("/login", passport.authenticate('local')
    , async (req, res) => {
        res.setHeader('Access-Control-Allow-Credentials', true)
        // another common pattern
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        )
        console.log(req.user)
        res.json({ username: req.user.username })

    })

app.post("/register", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const { fName, lName } = req.body
    const username = sanitize(req.body.userName)
    const password = sanitize(md5(req.body.password))
    const userExists = await User.findOne({ username: username }).exec()
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

app.listen(process.env.PORT || 8080);
