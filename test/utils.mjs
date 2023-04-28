// const utils = require('../utils.mjs')
import { StoreModel as Store, UserModel as User } from "../db.mjs"
import mongoose from 'mongoose'

import * as utils from "../utils.mjs"
import Sinon from "sinon"
import { expect } from "chai"

describe('findSearchedStoreFromDb', () => {
    // beforeEach(function() {
    //     var mongooseStub = Sinon.stub(mongoose)
        
    // })
    // afterEach(function() {

    // })
    const mockStoreCollection = [{
        _doc: {
            storeName: "MyChicken"
        }
    }]
    const mockFindMatchingSubstring = (obj) => {
        const matching = []
        const sub = obj.storeName["$regex"]
        return new Promise((resolve, reject) => {
            mockStoreCollection.map((store) => {
                if (store._doc.storeName.startsWith(sub)) matching.push(store)
            })
            resolve(matching)
        })
    }
    before(() => {
        mongoose.disconnect()
    })
    
    it("Should return array of storeNames with valid query when match found", (async function() {
        const mockSearchTerm = "MyC"
        Sinon.stub(Store, "find").returns(mockFindMatchingSubstring({storeName: {"$regex": mockSearchTerm}}))
        expect(await utils.findSearchedStoreFromDb(mockSearchTerm)).deep.to.equal(["MyChicken"])
        Store.find.restore()
    }))
    it ("Should return empty array when no matches found", (async function() {
        const mockSearchTerm = "C"
        Sinon.stub(Store, "find").returns(mockFindMatchingSubstring({storeName: {"$regex": mockSearchTerm}}))
        expect(await utils.findSearchedStoreFromDb(mockSearchTerm)).to.be.empty
        Store.find.restore()
    }))
    
})

describe('updateProfile', () => {
    const mockUserCollection = [{
        username: "farmash",
    }]

    const mockFindOneUser = ({username}) => {
        return new Promise((resolve, reject) => {
            const user = mockUserCollection.filter(u => u.username === username)
            if (user.length === 0) resolve(null)
            else resolve(user[0])
        }) 
    }
    const mockSave = () => {
        console.log("saved")
    }
    it ("Should successfully update old existing username to new username", async function() {
        mockUserCollection[0].save = () => console.log("HI")
        const mockBody = {
            newUsername: "farmash1",
            username: "farmash"
        }
        const origUsername = mockBody.username
        Sinon.stub(User, "findOne").returns(mockFindOneUser(mockBody))
        Sinon.stub(User.prototype, "save").returns(mockSave())

        expect(await User.findOne({username: origUsername})).to.not.equal(null)
        expect(await utils.updateProfile(mockBody)).to.equal("successful")
        User.findOne.restore()
        User.prototype.save.restore()
    }) 
    it ("Should not update non-existing username to requested username", async function() {
        const mockBody = {
            newUsername: "farmash1",
            username: "farmash23"
        }
        const origUsername = mockBody.username
        Sinon.stub(User, "findOne").returns(mockFindOneUser(mockBody))
        Sinon.stub(User.prototype, "save").returns(mockSave())

        expect(await User.findOne({username: origUsername})).to.equal(null)
        expect(await utils.updateProfile(mockBody)).to.equal("unsuccessful")


    }) 
})

