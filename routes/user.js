var express = require("express");
require('dotenv').config();
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const userHelper = require("../helpers/user-helpers");
const adminHelpers = require("../helpers/admin-helpers")
const otp = require("../helpers/OTPhelpers");
const collection = require("../config/collections");
const db = require("../config/connection");
const { ObjectID, ObjectId } = require("bson");
// const client = require('twilio')(otp.accoundSid, otp.authToken);
const client = require('twilio')(process.env.ACCOUNTSID,process.env.AUTHTOKEN);

// const verifyLogin = (req, res, next) => {
//   if (req.session.userLoggedIn) {
//     next();
//   } else {
//     res.redirect("/login");
//   }
// };
const verify = (req, res, next) => {
  if (req.session.loggedIn) {
    return res.redirect("/");
  } else {
    next();
  }
};

router.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

/* GET home page. */
router.get("/", async function (req, res, next) {

  let user = req.session.user;
  let cartCount = null
  let product = await productHelpers.getAllProducts();
  let category = await productHelpers.getAllCategorys();
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  res.render("user/view-products", {
    // layout: "userlayout",
    product,
    user,
    category,
    cartCount
  });
});

router.get("/login", (req, res, next) => {

  let user = req.session.user
  if (req.session.user) {
    res.redirect("/");
  } else {

    let loginErr = req.session.loginErr;

    res.render("user/login", { loginErr, user });
    req.session.loginErr = false;
  }
});

router.get("/signup", (req, res) => {
  res.render("user/signup", { layout: "userlayout" });
});

// router.post("/signup", (req, res) => {
//   userHelpers.doSignup(req.body).then((insertedId) => {
//     req.session.loggedIn = true;

//     req.session.user = insertedId;
//     res.redirect("/login");
//   });
// });

router.post('/signup', (req, res) => {

  let userData = req.body
  userHelpers.doSignup(userData).then((resolve) => {

    if (resolve.data) {
      res.redirect('/login')
    } else {
      req.session.signupErr = resolve.message;
      res.redirect('/signup');
    }
  })
})


router.post("/login", async (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.user.isBlocked) {
      req.session.loginErr = "You are blocked";
      res.render("user/login", { loginErr: req.session.loginErr });
    } else {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;

        res.redirect("/");
      } else {
        req.session.loginError = "invalid login id or password";
        res.redirect("/login");
      }
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// router.get("/cart", async (req, res) => { 

//   let category = await productHelpers.getAllCategory();

//   res.render("user/cart",{layout:'userlayout',category});
// });

// router.get("/product-view",async (req,res)=>{
//  let id =req.query.id

//   let user = req.session.user;
//   let products = await productHelpers.getAllProducts(id);

//   res.render("user/product-view",{layout:'userlayout',products,user})
// })
router.get("/product-view", async (req, res) => {
  let id = req.query.id

  let user = req.session.user;
  let categoryDetails = await productHelpers.getCategoryProduct(id);

  let categoryName = categoryDetails[0].Name

  let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: categoryName }).toArray()

  res.render("user/product-view", { layout: 'userlayout', products, user, categoryDetails })
})



router.get("/single-view", (req, res) => {
  res.render("user/single-view", { layout: 'userlayout' });
});

router.get("/view-cart", async (req, res) => {

  let user = req.session.user._id
  let products = await userHelpers.getCartProducts(user);
  // let category=  await productHelpers.getAllCategory()
  let totalValue = await userHelper.getTotalAmount(user)


  res.render("user/cart", { products, user, totalValue });
});



router.get('/add-to-cart:id', async (req, res) => {

  let wishList = await userHelpers.getWishlistProducts()
 
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    // res.json({status:true})
    res.redirect('/')
  });
});

router.post('/change-product-quantity', (req, res, next) => {

  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/add-address', (req, res) => {
  let userId = req.session.user._id

  userHelper.addaddress(req.body, userId).then(() => {
    res.redirect('/place-order')
  })
})



router.get('/place-order', async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let address = await userHelpers.getUserAddress(req.session.user._id)
  let couponDetails = await adminHelpers.getCoupon()
  let wallet = await userHelpers.getWallet(req.session.user._id)


  res.render("user/checkout", { total, address, user: req.session.user, couponDetails, wallet })
})

router.post('/place-order', async (req, res) => {

  let userId = req.session.user._id
  let user = req.session.user
  let wallet = await userHelpers.getWallet(userId)
  let totalPrice
  let discountCoupon
  total = parseInt(req.body.total)

  let products = await userHelpers.getCartProductList(req.session.user._id)
  if (req.body.discount) {
    totalPrice = total
    discountCoupon = req.body.discount
    couponApply = true
  } else {
    couponApply = false
    // let totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
    totalPrice = await userHelpers.getTotalAmount(req.session.user._id)
  }

  userHelper.placeOrder(user, req.body, products, totalPrice).then((orderId) => {

    if (req.body['payment-method'] == 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['payment-method'] === 'ONLINE') {

      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }
    else if (req.body['payment-method'] == 'wallet') {

      userHelpers.walletPurchase(userId, wallet, totalPrice, products).then((response) => {
        // userHelpers.placeOrder(address, products, totalPrice, req.body['payment-method'], userId, wallet)
        // .then((orderId) => {
        res.json({ walletSuccess: true })
        // });
      }).catch((err) => {
        console.log('error')
        res.json({ walletFailure: true })
      })

    } else {
      res.json({ error: true })
    }

  })

})

// COUPON
router.post('/redeem-coupon', async (req, res) => {
  let userId = req.session.user._id
  let totalAmount = await userHelpers.getTotalAmount(userId)

  await userHelpers.redeemCoupon(req.body).then((couponData) => {
    let minMsg = "This coupen is only valid for purchase above ₹" + couponData.minPrice
    if (totalAmount >= couponData.minPrice) {

      let temp = (totalAmount * couponData.couponOffer) / 100

      if (temp < couponData.priceLimit) {

        totalAmount = (totalAmount - temp)

      } else if (temp >= couponData.priceLimit) {

        temp = couponData.priceLimit
        totalAmount = (totalAmount - temp)
      }

      res.json({ total: totalAmount, offer: temp })

    } else if (totalAmount <= couponData.minPrice) {

      res.json({ msg: minMsg, total: totalAmount })

    }
  }).catch(() => {
    let msg = "Invalid Coupon Or It's already Expired"
    res.json({ msg: msg, total: totalAmount })
  })
})




router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})



router.get('/orders', async (req, res) => {
  id = req.session.user._id
  let orders = await userHelper.getUserOrders(id)
  // let orders = await userHelper.getUserOrders()

  res.render('user/orders', { user: req.session.user, orders })
})


router.get('/view-orders-products', async (req, res) => {

  id = req.query.id

  let products = await userHelpers.getOrderProducts(id)


  res.render('user/view-orders-products', { user: req.session.user, products })
})

// INVOICE
// router.get('/invoice/:id', async (req, res) => {

//   let user = req.session.user
//   let order = await userHelpers.getOrder(req.params.id)
//   await userHelpers.getOrderPdts(req.params.id).then((response) => {

//     res.render('user/invoice', { order, response, user: true, user })
//   })
// })

router.get('/invoice', async (req, res) => {
  let id = req.query.id

  let orders = await userHelper.getOrderProd(id)
  let products = await userHelpers.getOrderProducts(id)

  res.render('user/invoice', { orders, products })
})




router.get('/wishlist', async (req, res) => {
  let user = req.session.user._id
  let products = await userHelper.getWishlistProducts(user)
  res.render('user/wishlist', { products, user })
})

//WALLET
router.get('/wallet', async (req, res) => {

  let userId = req.session.user._id
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(userId)
  let wallet = await userHelpers.wallet(userId)
  let walletamt = await userHelpers.walletAmount(userId)
  res.render('user/wallet', { user, wallet, cartCount, walletamt })

})

router.get('/add-to-wishlist/:id', (req, res) => {


  userHelper.addToWishlist(req.params.id, req.session.user._id).then(() => {

    res.json({ status: true })
  })

});

router.get("/delete-cart/:id", (req, res) => {


  userHelpers.deleteCart(req.params.id, req.session.user._id).then((response) => {

    res.redirect("/view-cart");
  });
});

// router.post("/cancel-order/:id", (req, res) => {
//   let id = req.params.id
//   userHelper.cancelOrder(id).then((response) => {
//     res.redirect("/orders")
//   })
// })


router.post('/cancel-order', (req, res) => {
  let orderId = req.body.orderId
  let userId = req.session.user._id

  userHelpers.cancelOrder(orderId, userId).then((response) => {
    res.json({ status: true })
  })
})

router.post('/return-order', (req, res) => {

  let orderId = req.body.orderId
  let userId = req.session.user._id

  userHelpers.returnOrder(orderId, userId).then((response) => {
    res.json({ status: true })
  })
})


router.get("/otp_page", (req, res) => {
  res.render("user/userMobile");
});

router.get('/otp_verify', (req, res) => {

  client
    .verify
    // .services(otp.serviceId)
    .services(process.env.SERVICESID)
    .verificationChecks
    .create({
      to: `+${req.query.phoneNumber}`,
      code: req.query.code
    })
    .then(async (data) => {
      if (data.valid) {
        let Number = data.to.slice(3);
        let userData = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: Number });
        if (userData.mobile == Number) {
          req.session.user = userData;
          res.send({ value: 'success' })
        } else {
          res.send({ value: 'failed' })
        }

      } else {
        res.send({ value: 'failed' })
      }
    })
}),



  // router.get('/otp_login', (req, res) => {
 
  //   client
  //     .verify
  //     .services(otp.serviceId)
  //     .verifications
  //     .create({
  //       to: `+${req.query.phoneNumber}`,
  //       channel: req.query.channel,
  //     })
  //     .then((data) => {
  //       console.log(data);
  //       res.status(200).send(data)
  //       })
  //   }),

  router.get('/otp_login', (req, res) => {

    client
      .verify
      // .services(otp.serviceId)
      .services(process.env.SERVICESID)
      .verifications
      .create({
        to: `+${req.query.phoneNumber}`,
        channel: req.query.channel,
      })
      .then((data) => {
        console.log(data);
        res.status(200).send(data)
      })
  },

  ),

  router.get("/view-Users", async (req, res, next) => {
    return new Promise(async (resolve, reject) => {
      let usersdetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      res.render("admin/viewUsers", { usersdetails, layout: "adminLayout" });
    });
  });

router.get("/block/:id", async (req, res) => {
  let userId = req.params.id;
  let user = await db
    .get()
    .collection(collection.USER_COLLECTION)
    .updateOne({ _id: ObjectId(userId) }, [
      {
        $set: {
          isBlocked: { $not: "$isBlocked" },
        },
      },
    ])
    .then((result) => {
      res.redirect("/admin/view-Users");
    });
});



router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body.order.receipt).then((response) => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false })
  })
})


router.get('/user-profile', async (req, res) => {
  user = req.session.user
  let userId = req.session.user._id
  let address = await userHelpers.getUserAddress(userId)
  res.render("user/user-profile", { user, address })
})

router.get('/manage-address', async (req, res) => {
  let user = req.session.user
  let userId = req.session.user._id
  let address = await userHelpers.getUserAddress(userId)
  res.render("user/manage-address", { user, address })
})




router.get("/update-profile", async (req, res) => {

  let user = req.session.user
  adId = req.query.id

  let address = await userHelpers.getAddressDetails(adId)
  res.render("user/update-profile", { user, address })

})

router.post("/update-profile", (req, res) => {

  let id = req.query.id;
  userHelpers.updateProfile(id, req.body).then((response) => {
    res.redirect("/user-profile")
  })
})



router.get("/delete-address", (req, res) => {
  let userId = req.session.user._id
  let id = req.query.id
  userHelpers.deleteAddress(id, userId).then((response) => {
    res.redirect("/manage-address")
  })
})

router.get("/single-product", async (req, res) => {
  let user = req.session.user
  let id = req.query.id
  let products = await productHelpers.getAllProducts();
  await productHelpers.getSingleProduct(id).then((product) => {
    res.render("user/single-view", { product, user, products })
  })
})





module.exports = router;
