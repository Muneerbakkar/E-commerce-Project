var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID
module.exports = {

  // addproduct:(product,Callback)=>{

  //   db.get().collection('product').insertOne(product).then((data)=>{
  //   Callback(data.insertedId.toString())
  // })

  // },


  //  ADD PRODUCT
  addproduct: (product, urls) => {
    return new Promise((resolve, reject) => {
      // product.price = Number(product.price),
      //   product.offerprice = Number(product.offerprice),
      //   product.stock = Number(product.stock)
      product.image = urls
      db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {

        let id = data.insertedId
        resolve(id)
      })
    })
  },

  addCategory: (category, urls) => {
    return new Promise((resolve, reject) => {
      category.image = urls
      category.Name = category.Name

      db.get().collection('category').insertOne(category).then((data) => {
        let id = data.insertedId
        resolve(id)
        // callback(data.insertedId.toString())
      })
    })

  },


  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {

      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products)

    })

  },

  getAllCategorys: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()

      resolve(category)
    })
  },


  getCategoryProduct: (id) => {
    return new Promise(async (resolve, reject) => {

      let categoryProducts = await db.get().collection(collection.CATEGORY_COLLECTION).find({ _id: objectId(id) }).toArray()

      resolve(categoryProducts)
    })
  },



  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {

        resolve(response)
      })
    })
  },

  deleteCategory: (catId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {

        resolve(response)
      })
    })
  },


  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
        resolve(product)
      })
    })
  },

  getCategoryDetails: (catId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((category) => {
        resolve(category)
      })

    })
  },


  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
        $set: {
          Name: proDetails.Name,
          Price: proDetails.Price,
          // Offerprice:proDetails.Offerprice,
          Category: proDetails.Category
        }
      }).then((response) => {
        resolve(response)
      })
    })
  },


  //edit product
  updateProduct: (proId, proDetails, urls, img) => {

    return new Promise(async (resolve, reject) => {
      let pro = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })

      let image1 = pro.image[0]
      let image2 = pro.image[1]
      let image3 = pro.image[2]
      let image4 = pro.image[3]
      let uploadImg = []
      if (img.img1) {
        uploadImg[0] = urls[0]
        if (urls == null) {
        } else {
          urls.shift()
        }
      } else {
        uploadImg[0] = image1
      }
      if (img.img2) {
        uploadImg[1] = urls[0]
        if (urls == null) {

        } else {
          urls.shift()
        }
      } else {
        uploadImg[1] = image2
      }

      if (img.img3) {
        uploadImg[2] = urls[0]
        if (urls == null) {

        } else {
          urls.shift()
        }
      } else {
        uploadImg[2] = image3
      }

      if (img.img4) {
        uploadImg[3] = urls[0]
        if (urls == null) {

        } else {
          urls.shift()
        }
      } else {
        uploadImg[3] = image4
      }




      let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Name: pro.Category })

      let checkCategoryOffer = category.categoryDiscount
      let checkProductOffer = pro.OfferPrice

      // if (checkCategoryOffer==0) {

      // } else {

      // }
      if (checkProductOffer || checkCategoryOffer) {

        if (checkProductOffer > checkCategoryOffer) {

          currentOffer = checkProductOffer

          discount = pro.Price * currentOffer / 100

        } else {

          currentOffer = checkCategoryOffer

          discount = pro.Price * currentOffer / 100

        }



        pro.Offerprice = parseInt(pro.Price) - discount


        pro.Offerprice = parseInt(Math.ceil(pro.Offerprice))

      }

      pro.Price = parseInt(pro.Price)
      // proDetails.stock =parseInt( proDetails.stock)


      db.get().collection(collection.PRODUCT_COLLECTION)
        .updateOne({ _id: objectId(proId) }, {
          $set: {
            Name: proDetails.name,
            // description: proDetails.description,
            Category: proDetails.category,
            Price: proDetails.price,

            Offerprice: pro.Offerprice,

            Offerprice: proDetails.stock,
            image: uploadImg,

            // offerPrice: proDetails.offerprice

          }
        }).then((response) => {

          resolve()
        })
    })
  },


  getproductPrice: (id) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }, { Price: 1 }).then((priceDetails) => {
        resolve(priceDetails)

      })
    })
  },

  getCategoryPrice: (id) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({}, { projection: { _id: objectId(id), Price: 1 } }).then((priceDetails) => {
        resolve(priceDetails)

      })
    })
  },


  addProductOffer: (proDetails, priceDetails, product) => {

    let categoryDiscount = product.categoryDiscount

    let price = priceDetails.Price;

    let productDiscount = proDetails.Offer;
    if (categoryDiscount >= productDiscount) {
      discount = categoryDiscount;
    } else {
      discount = productDiscount
    }
    let newPrice = Math.ceil(price * (1 - discount / 100));

    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proDetails.id) }, {
        $set: {
          Offerprice: newPrice,
          offer: discount,
        }
      }).then((response) => {
        resolve(response)

      })



    })
  },

  getCategoryProducts: (Name) => {

    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: Name }).toArray()

      resolve(products)
    })
  },

  // addCategoryOffer: (proDetails, priceDetails) => {

  //   let price = priceDetails.Price;
  //   let percentage = proDetails.Offer;
  //   let newPrice = Math.ceil(price * (1 - percentage / 100));

  //   return new Promise((resolve, reject) => {
  //     db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proDetails.id) }, {
  //       $set: {
  //         Offerprice: newPrice,
  //         offer: percentage,
  //       }
  //     }).then((response) => {
  //       resolve(response)

  //     })



  //   })

  // },

  addCategoryOffer: (proDetails, products) => {
    let categoryDiscount = Number(proDetails.Offer);
    productDiscount = products[0].offer
    category = proDetails.Name;
    // price = products[0].Price;
    if (categoryDiscount >= productDiscount) {
      discount = categoryDiscount
    } else {
      discount = productDiscount
    }


    return new Promise((resolve, reject) => {
      const productss = products.map((data) => {
        data.categoryOffer = Math.ceil(data.Price - data.Price * (discount / 100))

        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: data._id }, {
          $set: {
            categoryOffer: data.categoryOffer,
            categoryDiscount: discount,
            offer: discount,
            Offerprice: data.categoryOffer,
          }
        }).then((response) => {

        })

        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ Name: proDetails.Name },
          { $set: { categoryDiscount: discount } })
          .then((response) => {

          })
        return data
      })

      resolve(productss)
    })

  },

  //DELETE PORDUCT OFFER
  deleteProductOffer: (prodId, product) => {

    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
        {
          $set: {
             offer: 0 ,
             
          }
        }
      ).then((product) => {
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then(async (product) => {
          if (product.offer == 0) {
            product.OfferPrice = product.Price
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
              $set: {
                Offerprice: product.Price,
                Price: product.Price,
                offer: 0
              }
            })
          } else if (product.offer <= product.categoryDiscount) {
            let temp = (product.Price * product.categoryDiscount) / 100
            let updatedOfferPrice = (product.Price - temp)
            let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
              {
                _id: prodId
              },
              {
                $set: {
                  Offerprice: updatedOfferPrice,
                  Price: 0,
                  offer: product.categoryDiscount
                }
              }
            )
            resolve(updatedProduct)

          }
        })
        resolve()
      })
    })
  },

  //DELETE CATEGORY OFFER
  deleteCategoryOffer: (category) => {

    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ Name: category.Name }, { $set: { categoryDiscount: 0 } })
      db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ Category: category.Name }, { $set: { categoryDiscount: 0,offer :0 } }).then(async (response) => {
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: category.Name }).toArray()

        for (i = 0; i < products.length; i++) {
          if (products[i].offer == 0 && products[i].categoryDiscount == 0) {
            products[i].Offerprice = products[i].Price
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(products[i]._id) }, { $set: { Offerprice: products[i].Offerprice, offer: 0 } })
          } else if (products[i].categorydiscount < products[i].offer) {
            let temp = (products[i].Price * products[i].offer) / 100
            let updatedOfferPrice = (products[i].Price - temp)
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
              _id: objectId(products[i]._id)
            },
              {
                $set: {
                  Offerprice: updatedOfferPrice,
                  offer: products[i].offer
                }
              }
            )
          }
        }
      })
      resolve()
    })
  },



  categoryOfferDetails: () => {

    return new Promise(async (resolve, reject) => {
      let categoryOfferDetails = await db.get().collection(collection.PRODUCT_COLLECTION).find({}, { projection: { "Category": 1, "categoryDiscount": 1 } }).toArray()
      let unique = Array.from(new Set(categoryOfferDetails));
      resolve(categoryOfferDetails)

    })

  },

  // updateCategory: (catId, catDetails) => {
  //   return new Promise((resolve, reject) => {
  //     db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, {
  //       $set: {
  //         Name: catDetails.Name
  //       }
  //     }).then((response) => {
  //       resolve()
  //     })
  //   })
  // },

  updateCategory: (catId, catDetails, urls, img) => {
    return new Promise(async (resolve, reject) => {
      let cat = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) })

      let image1 = cat.image[0]
      let uploadImg = []
      if (img.img1) {
        uploadImg[0] = urls[0]
        if (urls == null) {
        } else {
          urls.shift()
        }
      } else {
        uploadImg[0] = image1
      }
      db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, {
        $set: {
          Name: catDetails.Name,
          image: uploadImg
        }
      }).then((response) => {
        resolve()
      })
    })
  },


  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
        resolve(product)
      })
    })
  },

  getSingleProduct: (proId) => {

    return new Promise(async (resolve, reject) => {
      let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
      resolve(product)
    })


  },

  // //GET UPDATED PRODUCT WITH OFFER
  // getProductOffer: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let productOffer = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate(
  //       [
  //         {
  //           '$match': {
  //             'productOffer': {
  //               '$gt': 0
  //             }
  //           }
  //         }, {
  //           '$project': {
  //             'name': 1,
  //             'productOffer': 1
  //           }
  //         }
  //       ]
  //     ).toArray()
  //     resolve(productOffer)
  //   })
  // },

  // //DELETE PORDUCT OFFER
  // deleteProductOffer: (prodId, product) => {
  //   return new Promise((resolve, reject) => {
  //     db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
  //       {
  //         $set: { productOffer: 0 }
  //       }
  //     ).then((response) => {
  //       db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then(async (response) => {
  //         if (response.productOffer == 0 && response.categoryOffer == 0) {
  //           response.offerPrice = response.actualPrice
  //           db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
  //             $set: {
  //               offerPrice: response.offerPrice,
  //               actualPrice: response.actualPrice,
  //               currentOffer: 0
  //             }
  //           })
  //         } else if (product.productOffer < product.categoryOffer) {
  //           let temp = (product.actualPrice * product.categoryOffer) / 100
  //           let updatedOfferPrice = (product.actualPrice - temp)
  //           let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
  //             {
  //               _id: prodId
  //             },
  //             {
  //               $set: {
  //                 offerPrice: updatedOfferPrice,
  //                 actualPrice: 0,
  //                 currentOffer: product.categoryOffer
  //               }
  //             }
  //           )
  //           resolve(updatedProduct)
  //         }
  //       })
  //       resolve()
  //     })
  //     })
  //   },

  // //GET UPDATED CATEGORY WITH OFFER
  // getCategoryOffer: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let categoryOffer = await db.get().collection(collection.CATEGORY_COLLECTION).find(
  //       {
  //         categoryOffer: { $gt: 0 }
  //       }
  //     ).toArray()
  //     resolve(categoryOffer)
  //   })
  // },

  // //DELTE CATEGORY OFFER
  // deleteCategoryOffer: (category) => {
  //   return new Promise(async (resolve, reject) => {
  //     db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ category: category }, { $set: { categoryOffer: 0 } })
  //     db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ category: category }, { $set: { categoryOffer: 0 } }).then(async (response) => {
  //       let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
  //       for (i = 0; i < products.length; i++) {
  //         if (products[i].productOffer == 0 && products[i].categoryOffer == 0) {
  //           products[i].offerPrice = products[i].actualPrice
  //           db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(products[i]._id) }, { $set: { offerPrice: products[i].offerPrice, currentOffer: 0 } })
  //         } else if (products[i].categoryOffer < products[i].productOffer) {
  //           let temp = (products[i].actualPrice * products[i].productOffer) / 100
  //           let updatedOfferPrice = (products[i].actualPrice - temp)
  //           db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
  //             _id: objectId(products[i]._id)
  //           },
  //             {
  //               $set: {
  //                 offerPrice: updatedOfferPrice,
  //                 currentOffer: products[i].productOffer
  //               }
  //             }
  //           )
  //         }
  //       }
  //     })
  //     resolve()
  //     })
  //   },

  // //ADD CATEGORY OFFER
  // addCategoryOffer: (offer) => {
  //   let category = offer.category
  //   let offerPercentage = Number(offer.categoryOffer)
  //   return new Promise(async (resolve, reject) => {
  //     await db.get().collection(collection.CATEGORY_COLLECTION).updateOne(
  //       {
  //         category: category
  //       },
  //       {
  //         $set: {
  //           categoryOffer: offerPercentage
  //         }
  //       }
  //     )
  //     await db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
  //       {
  //         category: category
  //       },
  //       {
  //         $set: {
  //           categoryOffer: offerPercentage
  //         }
  //       }
  //     )
  //     let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({
  //       category: category
  //     }).toArray()

  //     for (let i = 0; i < products.length; i++) {
  //       if (products[i].categoryOffer >= products[i].productOffer) {
  //         let temp = (products[i].price * products[i].categoryOffer) / 100
  //         let updatedOfferPrice = (products[i].price - temp)
  //         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
  //           _id: objectId(products[i]._id)
  //         },
  //           {
  //             $set: {
  //               offerPrice: updatedOfferPrice,
  //               currentOffer: products[i].categoryOffer
  //             }
  //           }
  //         )
  //       } else if (products[i].categoryOffer < products[i].productOffer) {
  //         let temp = (products[i].price * products[i].productOffer) / 100
  //         let updatedOfferPrice = (products[i].price - temp)
  //         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({
  //           _id: objectId(products[i]._id)
  //         },
  //           {
  //             $set: {
  //               offerPrice: updatedOfferPrice,
  //               currentOffer: products[i].productOffer
  //             }
  //           }
  //         )
  //       }
  //     }
  //     resolve()
  //     })

  //   },

  // //ADD PRODUCT OFFER
  // addProductOffer: (offer) => {
  //   let prodId = objectId(offer.product)
  //   let offerPercentage = Number(offer.productOffer)
  //   return new Promise(async (resolve, reject) => {
  //     await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
  //       {
  //         _id: prodId
  //       },
  //       {
  //         $set: { productOffer: offerPercentage }
  //       }
  //     )
  //     let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: prodId })
  //     if (product.productOffer >= product.categoryOffer) {
  //       let temp = (product.price * product.productOffer) / 100
  //       let updatedOfferPrice = (product.price - temp)
  //       let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
  //         {
  //           _id: prodId
  //         },
  //         {
  //           $set: {
  //             offerPrice: updatedOfferPrice,
  //             currentOffer: product.productOffer
  //           }
  //         }
  //       )
  //       resolve(updatedProduct)
  //     } else if (product.productOffer < product.categoryOffer) {
  //       let temp = (product.price * product.categoryOffer) / 100
  //       let updatedOfferPrice = (product.price - temp)
  //       let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
  //         {
  //           _id: prodId
  //         },
  //         {
  //           $set: {
  //             offerPrice: updatedOfferPrice,
  //             currentOffer: product.categoryOffer
  //           }
  //         }
  //       )
  //       resolve(updatedProduct)
  //     }
  //     resolve()
  //   })
  // },
  // //GET UPDATED PRODUCT WITH OFFER
  // getProductOffer: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let productOffer = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate(
  //       [
  //         {
  //           '$match': {
  //             'productOffer': {
  //               '$gt': 0
  //             }
  //           }
  //         }, {
  //           '$project': {
  //             'name': 1,
  //             'productOffer': 1
  //           }
  //         }
  //       ]
  //     ).toArray()

  //     resolve(productOffer)
  //   })
  // },

  // //DELETE PORDUCT OFFER
  // deleteProductOffer: (prodId, product) => {
  //   return new Promise((resolve, reject) => {
  //     db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
  //       {
  //         $set: { productOffer: 0 }
  //       }
  //     ).then((response) => {
  //       db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then(async (response) => {
  //         if (response.productOffer == 0 && response.categoryOffer == 0) {
  //           response.offerPrice = response.actualPrice
  //           db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
  //             $set: {
  //               offerPrice: response.offerPrice,
  //               actualPrice: response.actualPrice,
  //               currentOffer: 0
  //             }
  //           })
  //         } else if (product.productOffer < product.categoryOffer) {
  //           let temp = (product.actualPrice * product.categoryOffer) / 100
  //           let updatedOfferPrice = (product.actualPrice - temp)
  //           let updatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
  //             {
  //               _id: prodId
  //             },
  //             {
  //               $set: {
  //                 offerPrice: updatedOfferPrice,
  //                 actualPrice: 0,
  //                 currentOffer: product.categoryOffer
  //               }
  //             }
  //           )
  //           resolve(updatedProduct)
  //         }
  //       })
  //       resolve()
  //     })
  //     })
  //   },



  // addCategory:(category,callback)=>{

  //   db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data)=>{

  //   callback(data.insertedId.toString())
  //   })
  // },

  // getAllCategory:()=>{

  //   return new Promise(async(resolve,reject)=>{
  //     let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()

  //     resolve(category)

  //   })
  // },

  // deleteCategory:(catId)=>{
  //   return new Promise((resolve,reject)=>{
  //     db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then((response)=>{

  //       resolve(response)
  //     })
  //   })
  // },

  // getCategoryDetails:(catId)=>{
  //   return new Promise((resolve,reject)=>{
  //     db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)}).then((category)=>{
  //       resolve(category)
  //   })
  // })
  // },

  // updateCategory:(catId,catDetails)=>{
  //   return new Promise((resolve,reject)=>{
  //     db.get().collection(collection.CATEGORY_COLLECTION)
  //     .updateOne({_id:objectId(catId)},{
  //       $set:{
  //         Name:catDetails.Name
  //       }
  //     }).then((response)=>{
  //       resolve()
  //     })
  //   })
  // }


}