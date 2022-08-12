

const express = require('express');
const mongoose  = require('mongoose');
const ejs = require('ejs')
const expresslayouts = require('express-ejs-layouts')
const path = require('path');
const session = require('express-session');
require('dotenv').config();
const flash = require('express-flash');
const cookieParser = require('cookie-parser');



const morgan = require('morgan');


const app = express();
require('./app/config/databaseConnect');





app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({
    secret: process.env.MY_COOKIE,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 9900000
    }

}));

app.use(flash());

app.use((req, res, next) => {

    if (!req.session.shoppingCart) {
        req.session.shoppingCart = {
            cartitems: {},
            totalcost: 0,
            totalitems: 0
        }

    }
    
    res.locals.current = req.session;
    res.locals.user = req.session.user;
    res.locals.role = req.session.role;    
    console.log(res.locals.role);
    
    
    next();
})
app.use(flash());


//Assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expresslayouts);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');








require('./routes/websiteRoutes')(app);
app.use((req,res)=>{
    res.redirect('/');
})



let PORT = process.env.PORT || 3003;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});



