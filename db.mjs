import mongoose from "mongoose";
import slug from 'mongoose-slug-updater';


console.log('Waiting for connection to database...');
const connectMongoose = async () => {
  try {
    await mongoose.connect(`mongodb+srv://fm1539:6M2Swvd083GgGmhO@aitdbcluster.gbfatnd.mongodb.net/?retryWrites=true&w=majority`, {useNewUrlParser: true});
    console.log('Successfully connected to database.');
  } catch (err) {
    console.log('ERROR: ', err);
  }
}

connectMongoose()
mongoose.plugin(slug);




const User = new mongoose.Schema({
    fName: String,
    lName: String,
    username: String,
    password: String,
    hash: String,
    hasStore: Boolean,
    store: {type: mongoose.Schema.Types.ObjectId, ref: 'Store'},
    orders: [{type: mongoose.Schema.Types.ObjectId, ref: 'Order'}]
})

const Store = new mongoose.Schema({
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  storeName: String,
  items: [{type: mongoose.Schema.Types.ObjectId, ref: 'Item'}]
})

const Item = new mongoose.Schema({
  item: String,
  price: Number
})

const Order = new mongoose.Schema({
    customerUsername: String,
    itemOrdered: String,
    itemOrderedID: String,
    orderDate: String,
    orderAmount: Number,
    shippingDetails: Object
})

const CheckoutSession = new mongoose.Schema({
  username: String,
  checkoutSessionID: String,
  productID: String
})

export const UserModel = mongoose.model("User", User)
export const OrderModel = mongoose.model("Order", Order)
export const StoreModel = mongoose.model("Store", Store)
export const ItemModel = mongoose.model("Item", Item)
export const CheckoutSessionModel = mongoose.model("CheckoutSession", CheckoutSession)


