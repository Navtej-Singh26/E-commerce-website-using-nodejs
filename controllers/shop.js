const fs = require('fs');
const path = require('path');
const Product = require('../models/product');
const Order = require('../models/order');
const PDFDocument = require('pdfkit');


exports.getProducts = (req, res, next) => {
  const Items_per_page = 3;
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(productsNum => {
      totalItems = productsNum;
      return Product.find()
      .skip((page - 1) * Items_per_page)
      .limit(Items_per_page)
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        // totalProducts: totalItems,
        currentPage: page,
        hasNextPage: Items_per_page * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / Items_per_page)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const Items_per_page = 2;
  const page = +req.query.page || 1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(productsNum => {
      totalItems = productsNum;
      return Product.find()
      .skip((page - 1) * Items_per_page)
      .limit(Items_per_page)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        // totalProducts: totalItems,
        currentPage: page,
        hasNextPage: Items_per_page * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / Items_per_page)
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product
    .findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    }).then(result => {
      res.redirect('/cart');
    });
};

exports.postCartReduceQuantity = (req, res, next) => {
  const prodId = req.body.productId;
  Product
    .findById(prodId)
    .then(product => {
      return req.user.reduceCartQuantity(product);
    }).then(result => {
      res.redirect('/cart');
    });
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.getCheckout = (req, res, net) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      let total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      })
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total
      });
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return {quantity: i.quantity, product: {...i.productId._doc} };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() =>{
      res.redirect('/orders');
    })
    .catch(err => console.log(err))
};

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err))
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order
    .findById(orderId)
    .then(order => {
      if(!order){
        return res.redirect('/orders');
      }
      if(order.user.userId.toString() !== req.user._id.toString()){
        return res.redirect('/orders');
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'Invoices', invoiceName);
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader("Content-Disposition", 'inline; filename="Invoice"; ');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(25).text('Invoice', {
        underline: true
      });
      pdfDoc.text('----------------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(16).text(
          prod.product.title + 
          ' - ' + prod.quantity + 
          ' x ' + ' $'+
          prod.product.price
        );
      });
      pdfDoc.fontSize(16).text(
        'Total Price:  $' + totalPrice)
      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'inline; filename="'+ invoiceName +'" ');
      //   res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);
      
      // file.pipe(res);
    })
    .catch(err => console.log(err));
};