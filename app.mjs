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
import Stripe from 'stripe';
import * as utils from './utils.mjs'
const TEST_SECRET_KEY = "sk_test_51N0B4gJkAiw0ebTpEMYb6vsbnePpVPdnnjdxX8g82qmWeb0V9yEUF5xM8J99iFvkX5LxX1SAMAmZweOWEYApvjxs00D5CSqe5n"
const myStripe = Stripe(TEST_SECRET_KEY)

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import MongoStore from 'connect-mongo';


app.use(cors({
    origin: ["http://localhost:3000", "https://ait-final-project-y4qe.vercel.app"],
    credentials: true
}))
// app.use(cookieParser())
app.use(bodyParser.raw({type: "*/*"}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));


const User = mongoose.model("User")
const Store = mongoose.model("Store")
const Item = mongoose.model("Item")
const CheckoutSession = mongoose.model("CheckoutSession")
const Order = mongoose.model("Order")

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
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}
// app.use(session(sess));

// // app.use(cookieParser('cat'))
// app.use(passport.initialize())
// app.use(passport.session())

// passport.use(new LocalStrategy({ usernameField: 'username' }, async function (username, password, done) {
//     console.log(username, password)
//     try {
//         const user = await User.findOne({ username: username })
//         if (!user) { return done(null, false); }
//         if (user.password !== md5(password)) { return done(null, false); }
//         return done(null, user);
//     }
//     catch (e) {
//         console.log(e)
//         return done(e)
//     }
// }))

// passport.serializeUser(function (user, done) {
//     console.log(`serialize: user:${user}`);
//     done(null, user._id);
// });

// passport.deserializeUser(async function (id, done) {
//     const user = await User.findOne({ _id: id })
//     done(null, user)
// });

const isAuthenticated = (req, res, next) => {
    console.log("HERE", req)
    console.log(req.isAuthenticated())
    if (req.isAuthenticated()) return next()
    res.send("Not authenticated")
}

// app.get("/isAuthenticated/:username", (req, res) => {
//     res.setHeader('Access-Control-Allow-Credentials', true)
//     // another common pattern
//     res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
//     res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
//     )
//     if (req.session.user && req.session.user.username && req.session.user.username === req.params.username) res.send(true)
//     else res.send(false)
// })

app.get("/retrieveUserInfo/:username", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const username = req.params.username
    const user = await User.findOne({ username }).exec()
    res.json(user)
})

app.get("/profile/:username", async (req, res) => {
    const username = req.params.username
    const user = await User.findOne({ username: username }).exec()
    res.send({
        firstName: user._doc.fName,
        lastName: user._doc.lName,
        username: username
    })
})

app.get("/myStore/items/:username", async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).populate('store')
    const store = await Store.findOne({ _id: user.store._id }).populate('items')
    console.log(store)
    res.send({items: store.items, name: store.storeName})

})

app.get("/:storeName/items", async (req, res) => {
    const { storeName } = req.params
    const store = await Store.findOne({ storeName }).populate('items')
    res.send(store.items)

})

app.post("/addItem", async (req, res) => {
    const body = JSON.parse(req.body)
    const { itemName, price } = body.item
    const username = body.username
    const user = await User.findOne({ username })
    const store = await Store.findOne({ _id: user.store })
    const newItem = new Item({
        item: itemName,
        price: price
    })
    const newItemSaved = await newItem.save()
    store.items.push(newItemSaved)
    await store.save()
    res.send("successful")
})

app.post("/createStore", async (req, res) => {
    const { storeName, username } = JSON.parse(req.body)
    console.log(storeName, username)
    const findStoreWithGivenName = await Store.findOne({ storeName })
    const user = await User.findOne({ username })
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
        // req.user = user
        await user.save()
        res.send("successful")
    }
})


app.get("/getSearchResults/:searchedStore", async (req, res) => {
    const searchedStore = req.params.searchedStore
    const searchedStoreFromDb = await utils.findSearchedStoreFromDb(searchedStore)
    console.log(searchedStoreFromDb)
    res.send(searchedStoreFromDb)
    
})

app.get("/authorizationToken", (req, res) => {
    res.send(TEST_SECRET_KEY)
})

app.post("/checkout", async (req, res) => {
    console.log("201", JSON.parse(req.body))
    const { username, name, orderType, price } = JSON.parse(req.body)
    console.log(orderType)
    try {
        // Create Checkout Sessions from body params.
        const newProduct = await myStripe.products.create({
            name
        })
        const priceObj = await myStripe.prices.create({
            unit_amount: price * 100,
            currency: 'usd',
            product: newProduct.id
        })
        const session = await myStripe.checkout.sessions.create({
            shipping_address_collection: { allowed_countries: ['US'] },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 0, currency: 'usd' },
                        display_name: 'Free shipping',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 5 },
                            maximum: { unit: 'business_day', value: 7 },
                        },
                    },
                },
            ],
            line_items: [
                {
                    // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    price: priceObj.id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin}/paymentComplete?success=true&username=${username}&orderType=${orderType}`,
            cancel_url: `${req.headers.origin}/paymentComplete?canceled=true`,
        });
        const newCheckoutSession = new CheckoutSession({
            username,
            checkoutSessionID: session.id,
            productID: newProduct.id
        })
        await newCheckoutSession.save()
        res.send(session.url);
    } catch (err) {
        console.log(err)
        res.status(err.statusCode || 500).json(err.message);
    }

})

app.post("/profile/update", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const body = JSON.parse(req.body)
    const update = await utils.updateProfile(body)
    res.send(update)
})

app.post("/login", async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    // another common pattern
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    // console.log(req.user)

    try {
        console.log(req.body)
        const { username, password } = JSON.parse(req.body)
        const user = await User.findOne({ username })
        if (!user) { res.send("not found") }
        if (user.password !== md5(password)) { res.send("password incorrect") }
        res.send({
            "status": "successful",
            username
        });
    }
    catch (e) {
        console.log(e)
        res.send(e)
    }

})

app.get("/getOrdersForUser/:username", async (req, res) => {
    const { username } = req.params
    const user = await User.findOne({username}).populate('orders').exec()
    res.send(user._doc.orders)
})

app.post("/webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const { body } = req;
    let event = null;
    const endpointSecret = process.env.WEBHOOK_SECRET || "whsec_5ccd23efb9c8374f339fcac0207abe828fa08178b67feabeb583f516c834c0ed"
    try {
        event = myStripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        // invalid signature
        console.log("ERROR", err)
        res.status(400).end();
        return;
    }
    let intent = null;
    switch (event['type']) {
        case 'checkout.session.completed':
            intent = event.data.object;
            console.log("Succeeded:", intent);
            const { id } = intent
            const productForSession = await CheckoutSession.findOne({checkoutSessionID: id})
            const { productID, username } = productForSession._doc
            const productDetails = await myStripe.products.retrieve(productID)
            const newOrder = new Order({
                customerUsername: username,
                itemOrdered: productDetails.name,
                itemOrderedID: productID,
                orderDate: intent.created,
                orderAmount: intent.amount_total,
                shippingDetails: intent.shipping_details
            })
            const newOrderSaved = await newOrder.save()
            const user = await User.findOne({username}).exec()
            user.orders.push(newOrderSaved._id)
            await user.save()
            break;
        case 'payment_intent.payment_failed':
            intent = event.data.object;
            const message = intent.last_payment_error && intent.last_payment_error.message;
            console.log('Failed:', intent.id, message);
            break;
    }

    res.sendStatus(200);
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
    const { fName, lName } = JSON.parse(req.body)
    const body = JSON.parse(req.body)
    const username = sanitize(body.userName)
    const password = sanitize(md5(body.password))
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
