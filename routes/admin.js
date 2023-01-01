var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const homeHelpers = require("../helpers/user-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const collection = require("../config/collections");
const db = require("../config/connection");
// const { response } = require("../app");
const ObjectId = require("mongodb").ObjectId;
// const store =require('../middleware/multer')


// --multer--
const cloudinary = require('../utils/cloudinary')
const multer = require('multer')
const path = require('path');
const { log } = require("console");


upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname)
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp") {
      cb(new Error("File type is not supported"), false)

      return
    }
    cb(null, true)
  }
})






/* GET users listing. */
router.get("/", (req, res) => {


  res.render("admin/admin-login", { layout: "adminLayout" });
});






router.post("/adminpage", async (req, res) => {



  let adminData = req.body;

  adminHelpers.adminLogin(adminData).then(async (response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.admin = response.admin


      res.render("admin/dashboard", { layout: "adminLayout", admin: true, });
    } else {
      res.redirect('/admin/')
    }
  });
});

router.get('/admin-dashboard', (req, res) => {
  res.render('admin/dashboard', { layout: "adminLayout", admin: true, })
})

router.get("/test", async (req, res) => {
  await adminHelpers.getDailySalesGraph().then((response) => {

    res.json(response)

  })


})

//SALES REPORT
router.get('/sales-report', async (req, res) => {
  if (req.query?.month) {
    let month = req.query?.month.split("-")
    let [yy, mm] = month;

    deliveredOrders = await adminHelpers.deliveredOrderList(yy, mm)
  } else if (req.query?.daterange) {
    deliveredOrders = await adminHelpers.deliveredOrderList(req.query);
  } else {
    deliveredOrders = await adminHelpers.deliveredOrderList();
  }
  let amount = await adminHelpers.totalAmountOfdelivered()

  res.render('admin/sales-report', { layout: "adminLayout", admin: true, deliveredOrders, amount })
})


router.get("/view-products", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {

    res.render("admin/view-products", { layout: "adminLayout", admin: true, products });
  });
});
router.get("/view-category", function (req, res, next) {
  productHelpers.getAllCategorys().then((categorys) => {

    res.render("admin/view-category", { layout: "adminLayout", admin: true, categorys })
  })
})

router.get("/add-products", async function (req, res) {
  let category = await productHelpers.getAllCategorys()
  res.render("admin/add-products", { layout: "adminLayout", admin: true, category });
});

router.get("/add-category", async function (req, res) {
  let category = await productHelpers.getAllCategorys()
  res.render("admin/add-category", { layout: "adminLayout", admin: true, category })
})

router.get('/offer-management', async (req, res) => {

  let products = await productHelpers.getAllProducts()
  let categoryOfferDetails = await productHelpers.categoryOfferDetails()

  let category = await productHelpers.getAllCategorys()


  res.render('admin/offer-management', { layout: "adminLayout", admin: true, products, categoryOfferDetails, category })
})

// router.post("/edit-product/:id", (req, res) => {

//   let id = req.params.id;
//   productHelpers.updateProduct(req.params.id, req.body).then((response) => {
//     res.redirect("/admin/view-products");
//     if (req.files.Image) {
//       let image = req.files.Image;
//       image.mv("./public/product-images/" + id + ".jpg");
//     }
//   });
// });

// router.post("/edit-productOffer",(req,res)=>{

//   let id =req.query.id
//   productHelpers.productOffer(req.query.id,req.body).then((response)=>{
//     res.redirect('admin/offer-management')
//   })
// })



router.post("/addProductOffer", async (req, res) => {



  offerDetails = req.body;

  id = offerDetails.id;

  let product = await productHelpers.getSingleProduct(id)

  let priceDetails = await productHelpers.getproductPrice(id)

  productHelpers.addProductOffer(req.body, priceDetails, product).then((response) => {
    res.redirect('/admin/offer-management')
  })

})

router.post("/addCategoryOffer", async (req, res) => {

  offerDetails = req.body,
    Name = offerDetails.Name;


  // let product = await productHelpers.getSingleProduct(id)
  let products = await productHelpers.getCategoryProducts(Name)

  productHelpers.addCategoryOffer(req.body, products).then((response) => {
    res.redirect('/admin/offer-management')
  })

})

//DELETE PRODUCT OFFER    
router.get('/delete-product-offer', async (req, res) => {

  id = req.query.id
  let products = await productHelpers.getSingleProduct(id)

  productHelpers.deleteProductOffer(id, products).then((product) => {
    res.redirect("/admin/offer-management")
  })
})

//DELETE CATEGORY OFFER
router.get('/delete-category-offer', async (req, res) => {

  id = req.query.id;
  let category = await productHelpers.getCategoryDetails(id)

  productHelpers.deleteCategoryOffer(category).then((response) => {
    res.redirect("/admin/offer-management")
  })
})

router.get('/coupon-management', async (req, res) => {
  let coupon = await adminHelpers.getCoupon()

  res.render('admin/coupon-management', { layout: 'adminLayout', admin: true, coupon })
})

// router.post('/offer-management/delete-product-offer/:id', async (req, res) => {
//   let products = await productHelpers.getAllProducts()
//   productHelpers.deleteProductOffer(req.params.id, products).then((response) => {
//     res.json({ status: true })
//   })
// })

//ADD COUPON
router.post('/add-coupon', (req, res) => {
  adminHelpers.addCoupon(req.body).then(() => {
    res.json({ status: true })
  }).catch(() => {

    res.json({ status: false })
  })
})

//DELETE COUPON
router.get('/delete-coupon', (req, res) => {

  id = req.query.id;
  adminHelpers.deleteCoupon(id).then((response) => {
    res.redirect('/admin/coupon-management')
  })
})


router.post("/add-products", upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]), async (req, res) => {


  const cloudinaryImageUploadMethod = (file) => {

    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {

        // if (err) return res.status(500).send("Upload Image Error")
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )


  productHelpers.addproduct(req.body, urls).then((id) => {
    res.redirect('/admin/add-products')
  })
});

router.post('/add-category', upload.fields([
  { name: 'image1', maxCount: 1 },
  // { name: 'image2', maxCount: 1 },
  // { name: 'image3', maxCount: 1 },
  // { name: 'image4', maxCount: 1 },
]), async (req, res) => {
  const cloudinaryImageUploadMethod = (file) => {
    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {
        if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }
  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result

    })
  )

 

  productHelpers.addCategory(req.body, urls).then((id) => {
    res.render("admin/add-category", { layout: "adminLayout", admin: true })
  })
});


// router.post("/add-category", (req, res) => {


//   productHelpers.addCategory(req.body, (id) => {
//     let image = req.files.Image;

//     image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
//       if (!err) {
//         res.render("admin/add-category", { layout: "adminLayout", admin: true })
//       } else {

//       }
//     })
//   })
// })

router.get("/delete-product/:id", (req, res) => {
  let proId = req.params.id;

  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});

router.get("/delete-category/:id", (req, res) => {
  let catId = req.params.id;

  productHelpers.deleteCategory(catId).then((response) => {
    res.redirect("/admin/view-category")
  })
})

// router.get("/edit-product/:id", async (req, res) => {
//   let product = await productHelpers.getProductDetails(req.params.id);

//   res.render("admin/edit-product", { layout: "adminLayout", product, admin: true });
// });

router.get('/edit-product/:id', async (req, res) => {
  // let admin = req.session.admin;
  let product = await productHelpers.getProductDetails(req.params.id)
  let category = await productHelpers.getAllCategorys()


  res.render('admin/edit-product', { layout: "adminLayout", product, admin: true, category })
})



// router.post("/edit-product/:id", (req, res) => {

//   let id = req.params.id;
//   productHelpers.updateProduct(req.params.id, req.body).then((response) => {
//     res.redirect("/admin/view-products");
//     if (req.files.Image) {
//       let image = req.files.Image;
//       image.mv("./public/product-images/" + id + ".jpg");
//     }
//   });
// });



router.post('/edit-product/:id', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]), async (req, res) => {

  let img = {}
  if (req.files.image1) {
    img.img1 = true
  } else {
    img.img1 = false
  }
  if (req.files.image2) {
    img.img2 = true
  } else {
    img.img2 = false
  }
  if (req.files.image3) {
    img.img3 = true
  } else {
    img.img3 = false
  }
  if (req.files.image4) {
    img.img4 = true
  } else {
    img.img4 = false
  }

  const cloudinaryImageUploadMethod = (file) => {

    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {

        // if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )

  productHelpers.updateProduct(req.params.id, req.body, urls, img).then((id) => {
    res.redirect('/admin/view-products')
  })
})


router.get("/edit-category/:id", async (req, res) => {
  let category = await productHelpers.getCategoryDetails(req.params.id)

  res.render("admin/edit-category", { layout: "adminLayout", category, admin: true })
})

// router.post("/edit-category/:id", (req, res) => {

//   let id = req.params.id;
//   productHelpers.updateCategory(req.params.id, req.body).then(() => {
//     res.redirect("/admin/view-category");
//     if (req.files.Image) { 
//       let image = req.files.Image;
//       image.mv("./public/product-images/" + id + ".jpg")
//     }
//   })
// })

router.post("/edit-category/:id",upload.fields([
  { name: 'image1', maxCount: 1 },
]),async (req, res) => {
  let img = {}
  if (req.files.image1) {
    img.img1 = true
  } else {
    img.img1 = false
  }
  let id = req.params.id;

  const cloudinaryImageUploadMethod = (file) => {

    return new Promise((resolve) => {
      cloudinary.uploader.upload(file, (err, res) => {

        // if (err) return res.status(500).send("Upload Image Error")
        resolve(res.secure_url)
      })
    })
  }

  const files = req.files
  let arr1 = Object.values(files)
  let arr2 = arr1.flat()
  const urls = await Promise.all(
    arr2.map(async (file) => {
      const { path } = file
      const result = await cloudinaryImageUploadMethod(path)
      return result
    })
  )

  productHelpers.updateCategory(req.params.id, req.body,urls,img).then((id) => {
    res.redirect("/admin/view-category");

  })
})



router.get('/view-orders', async (req, res, next) => {
  const pageNum = req.query.page;
  perPage = 5
  let orderCount = await adminHelpers.getOrdersCount()
  pageCount = Math.ceil(orderCount / perPage)
  var pages = [];
  for (var i = 1; i <= pageCount; i++) {
    pages.push(i);
  }
  let orders = await adminHelpers.getAllOrders(pageNum)
  res.render('admin/view-orders', { layout: "adminLayout", admin: true, orders, pages })
})

//ORDER STATUS
router.get('/orders/:status', (req, res) => {
  adminHelpers.getOrderDetails(req.params.status).then((response) => {
    res.json(response)
  })
})


router.post('/order-status', (req, res) => {

  adminHelpers.changeOrderStatus(req.body.orderId, req.body.status).then(() => {
    res.json({ status: true })
  })
})



router.get("/view-Users", async (req, res, next) => {
  return new Promise(async (resolve, reject) => {
    let usersdetails = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find()
      .toArray();

    res.render("admin/viewUsers", { usersdetails, layout: "adminLayout", admin: true });
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





module.exports = router;
