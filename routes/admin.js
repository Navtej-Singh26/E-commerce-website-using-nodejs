const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/admin/add-product', isAuth, adminController.getAddProduct);

router.get('/admin/products', isAuth, adminController.getProducts);

router.post(
    '/admin/add-product',
    [
        body('title')
            .isString()
            .isLength({ min: 5 })
            .trim(),
        body('price')
            .isFloat(),
        body('description')
            .isLength({ min: 5, max: 500 })
            .trim(),
    ],
    isAuth,
    adminController.postAddProduct
);

router.get('/admin/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
    '/admin/edit-product',
    [
        body('title')
            .isString()
            .isLength({ min: 5 })
            .trim(),
        body('price')
            .isFloat(),
        body('description')
            .isLength({ min: 10, max: 500 })
            .trim(),
    ],
    isAuth,
    adminController.postEditProduct);

router.delete('/admin/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
