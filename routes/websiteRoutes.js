



function websiteRoutes(app) {
    app.get('/', (req, res) => {
        res.render('home')
    })

    

    

    app.get('/register', redirectUser, (req, res) => { res.render('register') })
    app.post('/register', registerUser)

    app.get('/login', redirectUser, (req, res) => { res.render('login') })
app.post('/login', loginUser)
    

}




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




