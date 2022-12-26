var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
module.exports = {
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let usersdetails = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(usersdetails)
        })
    },

    getUserDetails: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((userdetails) => {
                resolve(userdetails)
            })
        })
    },
    updateUser: (userId, userD) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    name: userD.name,
                    email: userD.email
                }
            }).then((response) => {
                resolve()
            })
        })
    },

    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {

            let admin = await db.get().collection("admin").findOne({ Email: adminData.email })

            let response = {}

            if (admin) {
                bcrypt.compare(adminData.password, admin.Password).then((status) => {
                    if (status) {
                        response.admin = admin
                        response.status = true
                       
                        resolve(response)
                    } else {
                        response.status = false
                     
                        resolve(response)
                    }
                })
            } else {
                response.status = false
              
                resolve(response)
            }

        })
    },

    addCategory: (category) => {
    
    },



    getAllOrders: (pageNum) => {
        const perPage = 5;

        return new Promise(async (resolve, reject) => {


            db.get().collection(collection.ORDER_COLLECTION).find().skip((pageNum - 1) * perPage).limit(perPage).toArray().then((orders) => {
                resolve(orders)

            })
        })


    },



    getOrdersCount: () => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).countDocuments().then(orderCount => {
            
                resolve(orderCount)
            })
        })
    },

    getDailySalesGraph: () => {
        return new Promise(async (resolve, reject) => {
            let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $project: { date: 1, totalAmount: 1 }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%d", date: "$date" } },
                        totalAmount: { $sum: "$totalAmount" },
                    },
                },
                {
                    $sort: {
                        _id: 1,
                    }
                },
                {
                    $limit: 31
                }
            ]).toArray().then((respo) => {
                resolve(respo)
             
            })


        })

    },


    //GET COUPONS
    getCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find({}).toArray()
            resolve(coupons)
        })
    },



    //ADD COUPON
    addCoupon: (data) => {
        data.coupon = data.coupon.toUpperCase()
        data.couponOffer = Number(data.couponOffer)
        data.minPrice = Number(data.minPrice)
        data.priceLimit = Number(data.priceLimit)
        data.expDate = new Date(data.expDate)
        data.user = []
        return new Promise(async (resolve, reject) => {
            let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: data.coupon })
            if (couponCheck == null) {
                db.get().collection(collection.COUPON_COLLECTION).insertOne(data).then((response) => {
                    resolve()
                })
            } else {
             
                reject()
            }
        })
    },

    //DELETE COUPON
    deleteCoupon: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(id)})
            resolve()
        })
    },


}



