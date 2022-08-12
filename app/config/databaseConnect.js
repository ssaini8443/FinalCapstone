const mongoose = require('mongoose')


const url = 'mongodb+srv://shekhar:shekharadmin@cluster0.rabcw.mongodb.net/FinalCapProject?retryWrites=true&w=majority';
const dbConnect = async () => {
  try {
    const connection = await mongoose.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    console.log('Mongo Connected');
  } catch (error) {
    console.error(`Error: ${error}`)
    process.exit(1)
  }
}
dbConnect();

module.exports = dbConnect;