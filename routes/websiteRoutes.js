const Product = require('../models/productsModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const bcrypt = require('bcrypt');
const moment = require('moment');
const flash = require('connect-flash');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const redirectUser = require('../app/middlewares/protectRoutes');
const { restart } = require('nodemon');

function websiteRoutes(app) {
    app.get('/', (req, res) => {
        res.render('home')
    })

    app.get('/login', redirectUser, (req, res) => { res.render('login') })
    app.post('/login', loginUser)
    app.post('/logingoogle', loginGoogle)

    app.post('/logout', logoutUser);

    app.get('/register', redirectUser, (req, res) => { res.render('register') })
    app.post('/register', registerUser)

    app.get('/accdetails', (req, res, next) => { if (req.session.user) { next() } else { res.redirect('/') } }, accDetails)
    app.post('/accdetails', updateaccDetails)




    app.get('/products', renderProducts)


    app.get('/cart', (req, res) => { res.render('cart') })
    app.post('/cart/add', addToCart)


    app.get('/orders', renderOrders); // AUTHENTICATE USER LATER 
    app.post('/order', handleOrder);
    app.get('/order/:orderid', handleSingleOrder);




    app.get('/admin/orders', renderAdminOrders);
    app.post('/admin/orders/status', change_statusof_order);



    app.get('/contactus', (req, res) => { res.render('contactus') });
    app.get('/aboutus', (req, res) => { res.render('aboutus') });


    app.post('/tablebook', tablebook);
    app.post('/contactus', contactus);

    app.post('/clearcart', clearcart);


}

async function tablebook(req, res) {
    console.log(req.body);

    const nodemailer = require('nodemailer');

    var transport = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: 'gail22@ethereal.email',
            pass: 'u33UnT9KXy4NSqjuRW'
        }
    });

    console.log(transport);

    let date_ob = new Date();
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let time = date_ob.getTime();
    
    let random = Math.floor(Math.random() * 15) + 1;
    const email = req.body.email;
    const name = req.body.name;
    const message = {
        from: 'support@pizzapoint.me', 
        to: email,        
        subject: 'Table Booking', 
        text: 'Hello, ' + name + '\n\n' + 'You have successfully booked a table for ' + date +'-'+ month+'-'+year +'  Your Table No. is '+ random+ '  Thank you for using our service.'
    };


    transport.sendMail(message, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
    return res.json({ success: true, message: 'Thankyou Your Table is Booked' });

}


async function contactus(req, res) {
    console.log(req.body);

    const nodemailer = require('nodemailer');

    var transport = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: "gail22@ethereal.email",
            pass: "u33UnT9KXy4NSqjuRW"
        }
    });


    let random = Math.floor(Math.random() * 10000) + 1;
    const message = {
        from: 'support@pizzapoint.me', 
        to: req.body.contactemail,        
        subject: 'Feedback', 
        text: 'Hello, ' + req.body.contactname + '\n\n' + 'Thankyou For Your Feedback.We are working on your issue and will get back to you soon.'+ '\n\n '+' Your Ticket No. is '+ random
    };

    transport.sendMail(message, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info);
        }
    });
    return res.json({ success: true, message: 'Thankyou For Your Feedback' });
}


async function clearcart(req, res) {
    delete req.session.shoppingCart;
    return res.redirect('/cart');
}



// render products page
async function renderProducts(req, res) {
    const products = await Product.find({})
    // console.log(products)
    return res.render('products', { products })
}



//add products to cart session
async function addToCart(req, res) {
    let scart = req.session.shoppingCart

    if (!scart.cartitems[req.body._id]) {
        scart.cartitems[req.body._id] = {
            cartproduct: req.body,
            quantity: 1
        }
        scart.totalitems = scart.totalitems + 1
        scart.totalcost = scart.totalcost + req.body.productPrice
    } else {
        scart.cartitems[req.body._id].quantity = scart.cartitems[req.body._id].quantity + 1
        scart.totalitems = scart.totalitems + 1
        scart.totalcost = scart.totalcost + req.body.productPrice
    }


    return res.json({ data: req.session.shoppingCart })
}





//register user
async function registerUser(req, res) {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 8);
        const user = await User.create({ name: req.body.name, email: req.body.email, password: hashedPassword });
        req.session.user = user
        return res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.log(error)

        return res.json({ success: false, message: 'Error creating user' });
    }

}

async function loginUser(req, res) {

    console.log(req.body);
    try {

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.json({ success: false, message: 'Invalid Credentials' });
        }
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            return res.json({ success: false, message: 'Invalid Credentials' });
        }

        req.session.user = user;
        req.session.role = user.role;

        return res.json({ success: true, message: 'User logged in successfully' });
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: 'Error logging in' });
    }


}



//login with google user
async function loginGoogle(req, res) {

    try {
        const payload = req.body.payload;
        var base64Payload = payload.split('.')[1];
        var p = Buffer.from(base64Payload, 'base64');
        let data = JSON.parse(p.toString());
        let { name, email, sub: googleId } = data;
        const user = await User.findOne({ googleId });
        if (!user) {
            const newUser = await User.create({ name, email, googleId });
            req.session.user = newUser;
            req.session.role = user.role;
            return res.json({ success: true, message: 'User logged in successfully first time' });
        } else {
            req.session.user = user;
            req.session.role = user.role;
            return res.json({ success: true, message: 'User logged in successfully' });
        }

    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: 'Error' });
    }

}


//logout user
function logoutUser(req, res) {
    try {
        req.session.destroy();
        return res.json({ success: true, message: 'Successfully Logout' });
    } catch (error) {
        return res.json({ success: false, message: 'Error In LogOut' });
    }

}




async function accDetails(req, res) {

    console.log(req.session.user);
    return res.render('accdetails', { accdetails: req.session.user });
    // return res.render('accdetails', { accdetails, moment, ordermessage: msg });
}

async function updateaccDetails(req, res) {
    // { username: 'user123', cpassword: 'adsf', upassword: 'afds' }



    console.log(req.body);


    const updateddata = {};
    if (req.body.username) {
        updateddata.name = req.body.username
    }

    const isPasswordValid = await bcrypt.compare(req.body.cpassword, req.session.user.password);
    if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(req.body.upassword, 8);
        updateddata.password = hashedPassword;
    }



    User.findByIdAndUpdate(req.session.user._id, updateddata, {
        useFindAndModify: false
    }).then(data => {
        if (!data) {
            console.log('no data');
        } else {

            console.log('updated');
            res.redirect('/accdetails');
        }
    }).catch(err => {
        console.log(err);
    })
}


async function handleOrder(req, res) {

    // console.log(req.body);
    // paymentMode 
    // stripeToken
    try {
        const user = req.session.user;
        if (!user) {
            return res.redirect('/login');
        }
        const order = await Order.create({
            address: req.body.address,
            mobile: req.body.mobile,
            userId: user._id,
            products: req.session.shoppingCart.cartitems,
            paymentType: req.body.paymentMode == 'card' ? 'online' : 'cod',
        });
        if (order) {

            if (req.body.paymentMode == 'card') {
                stripe.charges.create({
                    amount: req.session.shoppingCart.totalcost * 100,
                    source: req.body.stripeToken,
                    currency: 'cad',
                    description: `Order No.: ${order._id}`
                }).then(charge => {
                    console.log(charge);
                }).catch(err => { })
            }

            delete req.session.shoppingCart;
            req.flash('success', 'Order Placed Successfully');
            // return res.json({ success: true, message: 'Order Placed Successfully' });
            return res.redirect('/orders');
        }
    }
    catch (error) {
        console.log(error)
        return res.json({ success: false, message: 'Error in placing order' });
    }

}




// render orders page
async function renderOrders(req, res) {

    if (!req.session.user) {
        return res.redirect('/login');
    }
    const orders = await Order.find({ userId: req.session.user._id, }).sort({ "timestamp": -1 });
    const msg = req.flash('success');
    return res.render('orders', { orders, moment, ordermessage: msg });
}


async function renderAdminOrders(req, res) {

    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    const orders = await Order.find({ status: { $ne: 'completed' } }).sort({ "timestamp": -1 }).populate('userId').exec((err, orders) => {
        // console.log(orders);
        if (req.xhr) {
            return res.json({ orders });
        } else {
            return res.render('adminorders', { moment });
        }

    });


}

async function change_statusof_order(req, res) {


    try {
        const order = await Order.updateOne({ _id: req.body.orderId }, { orderStatus: req.body.status })
        return res.redirect('/admin/orders');
    }
    catch (error) {
        console.log(error)
        return res.redirect('/admin/orders');
    }


}


async function handleSingleOrder(req, res) {

    const order = await Order.findOne({ _id: req.params.orderid });
    res.render('singleorder', { order, moment });

}



module.exports = websiteRoutes;