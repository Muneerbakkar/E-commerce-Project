var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const { CURSOR_FLAGS } = require("mongodb");
var ObjectId = require("mongodb").ObjectID;
const Razorpay = require('razorpay');
const { log } = require("console");
const { resolve } = require("path");

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

module.exports = {
  // doSignup: (userData) => {

  //   return new Promise(async (resolve, reject) => {
  //     userData.Password = await bcrypt.hash(userData.Password, 10);

  //     userData.address = []
  //     db.get()
  //       .collection(collection.USER_COLLECTION)
  //       .insertOne(userData)
  //       .then((data) => {

  //         resolve(data.insertedId);
  //       });
  //   });
  // },

  doSignup: (userData) => {

    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);

      userData.address = []
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
      
          resolve(data.insertedId);
        });
    });
  },

  doSignup: (userData) => {
    userData.status = true
    let newUser
    return new Promise(async (resolve, reject) => {
      let emailChecking = await db.get().collection(collection.USER_COLLECTION).find({ Email: userData.Email }).toArray()

      if (emailChecking.length !== 0) {
       
        resolve({ data: false, message: "Email is already used" })

      } else {
      

        userData.referal = parseInt(new Date().getTime()) + userData.Username

        userData.Password = await bcrypt.hash(userData.Password, 10);

        userData.date = new Date()

        newUser = await db.get().collection(collection.USER_COLLECTION).insertOne(userData)



        db.get().collection(collection.WALLET_COLLECTION).insertOne({
          userId: userData._id,
          walletBalance: parseInt(0),
          referralId: userData.referal,
          transaction: []
        })


      }

      // new one
      let frdReferal = await db.get().collection(collection.USER_COLLECTION).findOne({ 'referal': userData.referralCode })
    
      if (frdReferal !== 0) {
    
        let sinReferral = {
          orderId: new ObjectId(),
          date: new Date().toDateString(),
          mode: "Credit",
          type: "Got referral Amount",
          amount: 100,
        }
        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: ObjectId(userData._id) },
          { $set: { walletBalance: 100 }, $push: { transaction: sinReferral } })
        //old one
        let frndReeferal = {
          orderId: new ObjectId(),
          date: new Date().toDateString(),
          mode: "Credit",
          type: "Amount credited Through Referral",
          amount: 100,
        }
        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: ObjectId(frdReferal._id) },
          { $inc: { walletBalance: 100 }, $push: { transaction: frndReeferal } })
        // if referal is credited
        resolve({ data: true });
      } else {
        // if referal is not credited
        resolve({ data: true });
      }

    })
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });

      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
       
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
     
            resolve({ status: false });
          }
        });
      } else {
    
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, userId) => {
    let proObj = {
      item: ObjectId(proId),
      quantity: 1,
    };

    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
   
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                {

                  $pull: { products: ObjectId(proId) }
                 
                })
                resolve()
              
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
              {

                $pull: { products: ObjectId(proId) }
               
              })
       
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
            {

              $pull: { products: ObjectId(proId) }
             
            })
    
            resolve();
          });
      }
    });
  },

  getCartProducts: (userId) => {

    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: { path: "$products" },
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },

  wallet: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wallet = await db.get().collection(collection.WALLET_COLLECTION).aggregate([
        {
          $match: {
            userId: ObjectId(userId)
          }
        },
        {
          $unwind: {
            path: "$transaction"
          }
        },
        {
          $project: { "transaction": 1 }
        },
        {
          $sort: { "transaction.date": -1 }
        }
      ]).toArray()
      resolve(wallet)

    })
  },

  //GET WALLET
  getWallet: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: ObjectId(userId) }).then((response) => {
        resolve(response)

      })
    })
  },


  //WALLET AMOUNT

  walletAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let walletamt = await db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: ObjectId(userId) })
      if (walletamt) {
        resolve(walletamt)
      }
    })
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get().collection(collection.CART_COLLECTION)
          .updateOne({ _id: ObjectId(details.cart) },
            {
              $pull: { products: { item: ObjectId(details.product) } }
            }
          ).then((response) => {
            resolve({ removeProduct: true })
          })
      } else {

        db.get().collection(collection.CART_COLLECTION)
          .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
            {
              $inc: { 'products.$.quantity': details.count }
            }
          ).then((response) => {

            resolve({ status: true })

          })

      }


    })
  },

    //DECREASE WALLET
    decreaseWallet: (userId, amount) => {
      db.get().collection(collection.WALLET_COLLECTION).findOne({ userId: ObjectId(userId) }).then((response) => {
      
          let updatedBalance = response.walletBalance - amount
          db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: ObjectId(userId) }, { $set: { walletBalance: updatedBalance } })
      })
  },


  walletPurchase: (userId, wallet, total, products) => {

    return new Promise(async (resolve, reject) => {
      if (wallet.walletBalance >= total) {
        const obj4 = {
          orderId: new ObjectId(),
          date: new Date().toDateString(),
          mode: "Debit",
          type: "Purchase",
          amount: total
        }
        await db.get().collection(collection.WALLET_COLLECTION).updateOne(
          { userId: ObjectId(userId) }, { $inc: { walletBalance: -(total) }, $push: { transaction: obj4 } })
          .then((response) => {

            // products.forEach(element => {
          
            //     db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(element.item) }, { $inc: { stock: -(element.quantity) } })
            // })
            resolve(response)

          })

        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) })
        products.forEach(element => {
      
          db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(element.item) }, { $inc: { stock: -(element.quantity) } })
        })


      } else {
        reject("No enough amount")
      }
    })
  },

  // add address
  addaddress: (entry, userId) => {
    return new Promise((resolve, reject) => {

      let Address = {
        _id: new ObjectId(),
        name: entry.name,
        address: entry.address,
        email: entry.email,
        pincode: entry.pincode,
        mobile: entry.mobile,
        userId: entry.userId


      }



     
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, { $push: { address: Address } }).then(() => {
        resolve()
      })
    })
  },


 
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
    
      let total = await db.get().collection(collection.CART_COLLECTION).aggregate(


        [
          {
            '$match': {
              user: ObjectId(userId)

            }
          },
          {
            '$unwind': {
              'path': '$products'
            }
          },
          {
            '$lookup': {
              'from': 'product',
              'localField': 'products.item',
              'foreignField': '_id',
              'as': 'product'
            }
          },
          {
            '$project':
            {
              'product': 1,
              'quantity': '$products.quantity'
            }
          },
          {
            $project: {
              item: 1, quantity: 1, product: {
                $arrayElemAt: ['$product', 0]
              }
            }
          },
          {

            $group: {
              _id: null,
              total: { $sum: { $multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.Offerprice" }] } }
            }
          }
        ]
      ).toArray()

      // resolve(total)
      resolve(total[0]?.total)

    })
  },


  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
 
      let address = user.address

      resolve(address)


    })
  },

  // placeOrder: (user, order, products, total) => {
  //   return new Promise((resolve, reject) => {

  //     let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
  //     let orderObj = {
  //       deliveryDetails: order.address,
  //       userId: user._id,
  //       paymentMethod: order['payment-method'],
  //       products: products,
  //       totalAmount: total,
  //       status: status,
  //       date: new Date()
  //     }
  //     db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
  //       db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })

  //       resolve(response.insertedId)
  //     })
  //   })
  // },


  placeOrder: (user, order, products, total) => {
    return new Promise((resolve, reject) => {

      let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: order.address,
        userId: ObjectId(order.userId),
        paymentMethod: order['payment-method'],
        products: products,
        totalAmount: parseInt(order.total),
        status: status,
        date: new Date(),
        displayDate: new Date().toDateString(),
      }
      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
  
        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
   
        resolve(response.insertedId)
      })
    })
  },

  //REDEEM COUPON
  redeemCoupon: (couponDetails) => {
    let couponName = couponDetails.coupon
    return new Promise(async (resolve, reject) => {
      currentDate = new Date()
      let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ $and: [{ coupon: couponName }, { expDate: { $gte: currentDate } }] })

      if (couponCheck !== null) {
        resolve(couponCheck)
      } else {
        reject()
      }
    })
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })

      resolve(cart.products)
    })
  },






  // getUserOrders: (userId) => {
  //   return new Promise(async (resolve, reject) => {


  //     let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray().then((orders) => {

  //     })
  //     resolve(orders)


  //   })
  // },



  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
 

      let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
      resolve(orders)
   
    })
  },

  getOrdersCount: () => {

    return new Promise(async (resolve, reject) => {
        await db.get().collection(collection.ORDER_COLLECTION).countDocuments().then(orderCount => {

            resolve(orderCount)
        })
    })
},

  getOrderProd: (id) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(id) })
      resolve(orders)
   
    })
  },

  // getOrderProducts:(orderId)=>{
  //   return new Promise(async(resolve,reject)=>{
  //     let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
  //       {
  //         $match:{_id:ObjectId(orderId)}
  //       },
  //       {
  //         $unwind:'$products'
  //       },
  //       {
  //         $project:{
  //           item:'$products.items',
  //           qauntity:'$products.quantity'
  //         }
  //       },
  //       {
  //         $lookup:{
  //           from: 'collection.PRODUCT_COLLECTION',
  //           localField:'item',
  //           foreignField:'_id',
  //           as:'product'
  //         }
  //       },
  //       {
  //         $project:{
  //           item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
  //         }
  //       }
  //     ]).toArray()

  //     resolve(orderItems)
  //   })
  // }

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: ObjectId(orderId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }
      ]).toArray()
  
      resolve(orderItems)
    })
  },

  addToWishlist: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
      if (userWishlist) {
        db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
          {

            $push: { products: ObjectId(proId) }

          }
        ).then((response) => {
          resolve()
        })


      } else {
        let wishlistObj = {
          user: ObjectId(userId),
          products: [ObjectId(proId)]
        }
        db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
          resolve()
        })
      }
    })
  },

  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
        {
          $match: { user: ObjectId(userId) }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            let: { prodList: '$products' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', "$$prodList"]
                  }
                }
              }
            ],
            as: 'wishlistItems'
          }
        }
      ]).toArray()

      let wish
      if (wishlistItems[0]) {
        wish = wishlistItems[0].wishlistItems
      } else {
        wish = null
      }
      resolve(wish)
    })
  },

  deleteCart: (proId, userId) => {

    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) }, {
        $pull: { products: { item: ObjectId(proId) } }
      }).then(() => {
        resolve()
      })
    })
  },


  cancelOrder: (orderId) => {


    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { status: "Cancelled" } }).then((response) => {
    
        resolve()
      })

    })

  },

  returnOrder: (orderId, userId) => {
    return new Promise(async (resolve, reject) => {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
            { $set: { status: "return" } })


        let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
        const obj = {
            orderId: new ObjectId(),
            date: new Date().toDateString(),
            reference: order._id,
            mode: "Credit",
            type: "Refund",
            amount: order.totalAmount,
        }

        let amt = parseInt(order.totalAmount)
        await db.get().collection(collection.WALLET_COLLECTION).updateOne({ userId: ObjectId(userId) }, { $inc: { walletBalance: amt }, $push: { transaction: obj } })

        resolve({status:true});
    }
    )
},


  generateRazorpay: (orderId, totalPrice) => {
  
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100
        ,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
    
        }
        else {
    
          resolve(order)
        }
      });
    })
  },

  verifyPayment: (details) => {
 
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'GErIVQmVw1L26CRC2KE2bZ9Y');

      hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
      hmac = hmac.digest('hex')
      if (hmac == details.payment.razorpay_signature) {
        resolve()
      } else {
        reject()
      }
    })
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({ _id: ObjectId(orderId) },
          {
            $set: {
              status: 'placed'
            }
          }
        ).then((response) => {
          resolve(response)
      
        })
    })
  },

  // getWishlistProducts: (userId) => {

  //   return new Promise(async (resolve, reject) => {
  //     let wishlistItems = await db
  //       .get()
  //       .collection(collection.WISHLIST_COLLECTION)
  //       .aggregate([
  //         {
  //           $match: { user: ObjectId(userId) },
  //         },
  //         {
  //           $unwind: { path: "$products" },
  //         },
  //         {
  //           $project: {
  //             item: "$products.item",
  //             quantity: "$products.quantity",
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: collection.PRODUCT_COLLECTION,
  //             localField: "item",
  //             foreignField: "_id",
  //             as: "wishlistItems",
  //           },
  //         },
  //         {
  //           $project: {
  //             item: 1,
  //             quantity: 1,
  //             product: { $arrayElemAt: ["$product", 0] },
  //           },
  //         },
  //       ])
  //       .toArray();

  //     resolve(wishlistItems);
  //   });
  // },
  viewOrderProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { userId: ObjectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'items',
            foreignField: 'userId',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }
      ]).toArray()
  
      resolve(order)
    })
  },

  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
 
      let address = user.address
    
      resolve(address)


    })
  },



  // updateProduct: (proId, proDetails) => {
  //   return new Promise((resolve, reject) => {
  //     db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(proId) }, {
  //       $set: {
  //         Name: proDetails.Name,
  //         Price: proDetails.Price,
  //         Offerprice: proDetails.Offerprice,
  //         Category: proDetails.Category
  //       }
  //     }).then((response) => {
  //       resolve(response)
  //     })
  //   })
  // },


  getProductDetails: (proId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) }).then((product) => {
        resolve(product)
      })
    })
  },

  // editAddress: async (userId, userdetails) => {

  //   let Adrid = userdetails._id

  //   return new Promise((resolve, reject) => {
  //     db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId), "Address._id": ObjectId(Adrid) }, {
  //       $set: {
  //         "Address.$.CustomerName": userdetails.name,
  //         "Address.$.contactNumber": userdetails.contactNumber,
  //         "Address.$.email": userdetails.email,
  //         "Address.$.address": userdetails.address,
  //         "Address.$.state": userdetails.state,
  //         "Address.$.country": userdetails.country,
  //         "Address.$.pincode": userdetails.pin
  //       }
  //     }).then((response) => {
  //       resolve(response)
  //     
  //     })
  //   })
  // },


  getAddressDetails: (adId) => {
   


    return new Promise(async (resolve, reject) => {
      let address = await db.get().collection(collection.USER_COLLECTION).aggregate([{ $unwind: "$address" }, { $match: { "address._id": ObjectId(adId) } }]).toArray()

      resolve(address)

    })
  },


  updateProfile: (adId, addressDetails) => {

    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ "address._id": ObjectId(adId) }, {

        $set: {
          "address.$.name": addressDetails.name,
          "address.$.address": addressDetails.address,
          "address.$.email": addressDetails.email,
          "address.$.pincode": addressDetails.pincode,
          "address.$.mobile": addressDetails.mobile

        }


      }).then((response) => {
      
        resolve(response, "yyyyyyyyyyyyyyyyyyy")
      })
    })
  },



  deleteAddress: (id, userId) => {

    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
        $pull: {
          address: { _id: ObjectId(id) }
        }

      }).then((response) => {
  
        resolve(response)
      })
    })
  }

};
