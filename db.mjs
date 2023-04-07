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
    orders: [String]
})

const Order = new mongoose.Schema({
    customerEmail: String,
    itemOrdered: String,
    orderDate: String,
    orderAmount: Number
})

mongoose.model("User", User)
mongoose.model("Order", Order)