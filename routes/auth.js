const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Email Addrss not valid!')
            .normalizeEmail(),
        body('password', 'Password not Valid')
            .isLength({ min: 8 })
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a Valid Email.')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject(
                                'E-mail already exists, Try a different one'
                            );
                        }
                    });
            })
            .normalizeEmail(),
        body('password', 'Please enter Password With min 8 characters and with nubers and alphabets only!')
            .isLength({ min: 8 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not Match!');
                }
                return true;
            })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;