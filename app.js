const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://singhnavtej2612:mongodbpass@123@cluster0.3mrpqwh.mongodb.net/?retryWrites=true&w=majority'

const app = express();
const store = new MongoDbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Math.round(Math.random() * 1E13)
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images', express.static(path.join(__dirname, 'public/images')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    }));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            throw new Error(err);
        });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use((req, res, next) => {
    res.status(404).render('404', {
        pageTitle: 'Page Not Found!',
        path: '',
        isAuthenticated: req.session.isLoggedIn
    });
});

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true })
    .then(result => {
        app.listen(3000);
        console.log("connected");
    })
    .catch(err => {
        console.log(err);
    });