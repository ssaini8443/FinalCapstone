



function websiteRoutes(app) {
    app.get('/', (req, res) => {
        res.render('home')
    })

    

    

    app.get('/register', redirectUser, (req, res) => { res.render('register') })
    app.post('/register', registerUser)

    
    

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