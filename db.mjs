import mongoose from "mongoose";
import slug from 'mongoose-slug-updater';


console.log('Waiting for connection to database...');
try {
  await mongoose.connect(`mongodb+srv://fm1539:6M2Swvd083GgGmhO@aitdbcluster.gbfatnd.mongodb.net/?retryWrites=true&w=majority`, {useNewUrlParser: true});
  console.log('Successfully connected to database.');
} catch (err) {
  console.log('ERROR: ', err);
}

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
    customerEmail: String,
    itemOrdered: String,
    orderDate: String,
    orderAmount: Number
})

mongoose.model("User", User)
mongoose.model("Order", Order)
mongoose.model("Store", Store)
mongoose.model("Item", Item)