// (function ($) {
//     "use strict";

//     /*Sale statistics Chart*/
//     if ($('#myChart').length) {
//         var ctx = document.getElementById('myChart').getContext('2d');
//         var chart = new Chart(ctx, {
//             // The type of chart we want to create
//             type: 'line',

//             // The data for our dataset
//             data: {
//                 labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
//                 datasets: [{
//                         label: 'Sales',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(44, 120, 220, 0.2)',
//                         borderColor: 'rgba(44, 120, 220)',
//                         data: [18, 17, 4, 3, 2, 20, 25, 31, 25, 22, 20, 9]
//                     },
//                     {
//                         label: 'Visitors',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(4, 209, 130, 0.2)',
//                         borderColor: 'rgb(4, 209, 130)',
//                         data: [40, 20, 17, 9, 23, 35, 39, 30, 34, 25, 27, 17]
//                     },
//                     {
//                         label: 'Products',
//                         tension: 0.3,
//                         fill: true,
//                         backgroundColor: 'rgba(380, 200, 230, 0.2)',
//                         borderColor: 'rgb(380, 200, 230)',
//                         data: [30, 10, 27, 19, 33, 15, 19, 20, 24, 15, 37, 6]
//                     }

//                 ]
//             },
//             options: {
//                 plugins: {
//                 legend: {
//                     labels: {
//                     usePointStyle: true,
//                     },
//                 }
//                 }
//             }
//         });
//     } //End if

//     /*Sale statistics Chart*/
//     if ($('#myChart2').length) {
//         var ctx = document.getElementById("myChart2");
//         var myChart = new Chart(ctx, {
//             type: 'bar',
//             data: {
//             labels: ["900", "1200", "1400", "1600"],
//             datasets: [
//                 {
//                     label: "US",
//                     backgroundColor: "#5897fb",
//                     barThickness:10,
//                     data: [233,321,783,900]
//                 }, 
//                 {
//                     label: "Europe",
//                     backgroundColor: "#7bcf86",
//                     barThickness:10,
//                     data: [408,547,675,734]
//                 },
//                 {
//                     label: "Asian",
//                     backgroundColor: "#ff9076",
//                     barThickness:10,
//                     data: [208,447,575,634]
//                 },
//                 {
//                     label: "Africa",
//                     backgroundColor: "#d595e5",
//                     barThickness:10,
//                     data: [123,345,122,302]
//                 },
//             ]
//             },
//             options: {
//                 plugins: {
//                     legend: {
//                         labels: {
//                         usePointStyle: true,
//                         },
//                     }
//                 },
//                 scales: {
//                     y: {
//                         beginAtZero: true
//                     }
//                 }
//             }
//         });
//     } //end if

// })(jQuery);


(function ($) {
    "use strict";
    let price = []

    $.ajax({
        url: "/admin/test",

        method: 'get',
        success: (response) => {
            console.log('dfgjdgkfdjhgkfhgkfdh', response);



            for (let i = 1; i <= 30; i++) {
                for (let j = 0; j < 30; j++) {

                    if (response[j]?._id == i) {
                        console.log(i);
                        price[i] = response[j]?.totalAmount
                        console.log(price[i]);
                        break;
                    } else {
                        price[i] = 0
                    }
                }
            }
            /Sale statistics Chart/
            if ($('#myChart').length) {
                var ctx = document.getElementById('myChart').getContext('2d');
                var chart = new Chart(ctx, {

                    type: 'line',


                    data: {
                        labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'],

                        datasets: [{
                            label: 'Sales',
                            tension: 0.3,
                            fill: true,
                            backgroundColor: 'rgba(44, 120, 220, 0.2)',
                            borderColor: 'rgba(44, 120, 220)',
                            data: [price[1], price[2], price[3], price[4], price[5], price[6], price[7], price[8], price[9], price[10], price[11], price[12], price[13], price[14], price[15], price[16], price[17], price[18], price[19], price[20], price[21], price[22], price[23], price[24], price[25], price[26], price[27], price[28], price[29], price[30], price[31]]

                        },



                        ]
                    },
                    options: {
                        plugins: {
                            legend: {
                                labels: {
                                    usePointStyle: true,
                                },
                            }
                        }
                    }
                });
            } //End if

       
    }
    })

})(jQuery);