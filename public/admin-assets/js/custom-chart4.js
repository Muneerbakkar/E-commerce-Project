(function ($) {
  "use strict";
  let price = [];
  console.log("afjakfke");
  $.ajax({
    url: "/admin/test3",

    method: "get",
    success: (response) => {
        console.log(response,response[0]._id);
        let one=response[0]._id;
        let two=response[1]._id;
        let three=response[2]._id;
       
        
     /Payment method/;
      if ($("#myChart4").length) {
        var ctx = document.getElementById("myChart4").getContext("2d");

        var xValues = [one, two,three];
var yValues = [response[0].count,response[1].count,response[2].count];
var barColors = [
  "#b91d47",
  "#00aba9",
  "#2b5797",
  
];

        var chart = new Chart(ctx, {
          // The type of chart we want to create
          type: "pie",

          // The data for our dataset
          
          data: {
            labels: xValues,
            datasets: [{
              backgroundColor: barColors,
              data: yValues
            }]
          },
          options: {
            title: {
              display: true,
              text: "World Wide Wine Production 2018"
            }
          }
        });
      } //End if
    },
  });
  })(jQuery);