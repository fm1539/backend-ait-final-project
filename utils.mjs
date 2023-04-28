import mongoose from 'mongoose'
import './db.mjs';
const Store = mongoose.model("Store")
const User = mongoose.model("User")


export const findSearchedStoreFromDb = async (searchedStore) => {
    try {
        const matchingStores = await Store.find({ storeName: { "$regex": searchedStore, "$options": "i" } })
        return matchingStores.map(store => store._doc.storeName)
    }
    catch (e) {
        return e
    }
}

export const updateProfile = async (body) => {
    const newUsername = body.newUsername
    const origUsername = body.username
    const user = await User.findOne({ username: origUsername })
    if (user && user.username !== newUsername) {
        user.username = newUsername
        // req.user.username = newUsername
        await user.save()
        return "successful"
    }
    else return "unsuccessful"
}