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

    totalRevenue: () => {

        return new Promise(async (resolve, reject) => {
          const data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            { $group: { _id: null, sum: { $sum: "$totalAmount" } } },
            { $project: { _id: 0 } },
          ]).toArray().then((respo) => {
            //  console.log(respo[0].sum);       
            resolve(respo[0]?.sum)
          })
        })
    
      },

    //SALES REPORT
    deliveredOrderList: (yy, mm) => {
        return new Promise(async (resolve, reject) => {
            let agg = [{
                $match: {
                    'status': 'delivered'
                }
            }, {
                $unwind: {
                    path: '$products'
                }
            }, {
                $project: {
                    item: '$products.item',
                    totalAmount: '$totalAmount',
                    paymentMethod: '$paymentMethod',
                    statusUpdateDate: '$statusUpdateDate',
                }
            }, {
                $lookup: {
                    from: 'product',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'result'
                }
            }, {
                $project: {
                    totalAmount: 1,
                    productPrice: '$result.Offerprice',
                    statusUpdateDate: 1,
                    paymentMethod: '$paymentMethod'
                }
            }]

            if (mm) {
                let start = "1"
                let end = "30"
                let fromDate = mm.concat("/" + start + "/" + yy)
                let fromD = new Date(new Date(fromDate).getTime() + 3600 * 24 * 1000)

                let endDate = mm.concat("/" + end + "/" + yy)
                let endD = new Date(new Date(endDate).getTime() + 3600 * 24 * 1000)
                dbQuery = {
                    $match: {
                        statusUpdateDate: {
                            $gte: fromD,
                            $lte: endD
                        }
                    }
                }
                agg.unshift(dbQuery)
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else if (yy) {
                let dateRange = yy.daterange.split("-")
                let [from, to] = dateRange
                from = from.trim("")
                to = to.trim("")
                fromDate = new Date(new Date(from).getTime() + 3600 * 24 * 1000)
                toDate = new Date(new Date(to).getTime() + 3600 * 24 * 1000)
                dbQuery = {
                    $match: {
                        statusUpdateDate: {
                            $gte: fromDate,
                            $lte: toDate
                        }
                    }
                }
                agg.unshift(dbQuery)
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            } else {
                let deliveredOrders = await db
                    .get()
                    .collection(collection.ORDER_COLLECTION)
                    .aggregate(agg).toArray()
                resolve(deliveredOrders)
            }
        })
    },

    //TOTAL AMOUNT OF DELIVERED PRODUCTS
    totalAmountOfdelivered: () => {
        return new Promise(async (resolve, reject) => {
            let amount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$match': {
                        'status': 'delivered'
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'total': {
                            '$sum': '$totalAmount'
                        }
                    }
                }
            ]).toArray()
            resolve(amount[0]?.total)
        })
    },

    getAllOrders: (pageNum) => {
        const perPage = 5;

        return new Promise(async (resolve, reject) => {


            db.get().collection(collection.ORDER_COLLECTION).find().skip((pageNum - 1) * perPage).limit(perPage).toArray().then((orders) => {
                resolve(orders)

            })
        })


    },

    // order details
    getOrderDetails: (pagenumber, limit) => {
        return new Promise(async (resolve, reject) => {


            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).find().skip(pagenumber * limit).limit(limit).toArray()


            resolve(orderItems)
        })
    },


    //ORDER STATUS
    changeOrderStatus: (orderId, status) => {

        return new Promise((resolve, reject) => {
            let dateStatus = new Date()
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                { $set: { status: status, statusUpdateDate: dateStatus } }).then(() => {
                    resolve(status)
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

    paymentMethod: () => {
        console.log('dgdsgbsdbgj');
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    '$project': {
                        'paymentMethod': 1,
                        '_id': 0
                    }
                }, {
                    '$group': {
                        '_id': '$paymentMethod',
                        'count': {
                            '$sum': 1
                        }
                    }
                }
            ]).toArray().then((response) => {
                console.log(response, "jjjjjjjjjgggggggggggggg");
                resolve(response)

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
        data.displayDate = new Date(data.expDate).toDateString()
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
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(id) })
            resolve()
        })
    },


}



