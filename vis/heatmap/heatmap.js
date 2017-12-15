/* Scatterplot prototype
 * Andrew Phillips & Jake Rourke
 * Nov 13, 2017 */

// Code adapted from my Lab 4 scatterplot


var NS = {}; // create namespace

NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
//NS.datapath = "../../Data/SCDB_M_caseCentered.csv"

//NS.datapath = "../../Data/SCDB_small.csv"

NS.margin = { top: 50, right: 0, bottom: 100, left: 100 },

NS.width = 960 - NS.margin.left - NS.margin.right,
NS.height = 2000 - NS.margin.top - NS.margin.bottom,

NS.gridSize = Math.floor(NS.width / 14),
NS.gridHeight = Math.floor(NS.width / 40),

NS.legendElementWidth = NS.gridSize*2,

NS.buckets = 9,

NS.colors = ['#dc143c','#c70a4e','#b2025f','#9b0070','#800080','#7a368d',
            '#70539a','#616ba7','#4682b4']
// https://gka.github.io/palettes/#colors=crimson,purple,steelblue|steps=9|bez=0|coL=0

NS.civil_list = ["Civil Liberty", "Other"]

NS.issueAreas = [
  "Criminal Procedure",    // 1
  "Civil Rights",          // 2
  "First Amendment",       // 3
  "Due Process",           // 4
  "Privacy",               // 5
  "Attorneys",             // 6
  "Unions",                // 7
  "Economic Activity",     // 8
  "Judicial power",        // 9
  "Federalism",            // 10
  "Interstate Relations",  // 11
  "Federal Taxation",      // 12
  "Miscellaneous",         // 13
  "Private Action"         // 14
]


//////////////////////////////////////////////////////////////////////
// functions


function aggregateData() {
  // Nest the data by justice, and aggregate the relevant information.
  NS.dataByJustice = d3.nest()
    .key(function(d) {return d.justiceName})
    .rollup( function(v) {
      // originally, we had hoped to use such functions as d3.mean and d3.sum
      // for each issue area, but these functions turned out to be incredibly
      // inefficient when used so many times on a very large dataset. Instead,
      // we are aggregating the data by iterating through the data ourselves.

      // v is an array of all of the cases of a given justice

      // initialize and populate an array to store aggregate information,
      // indexed by issue area.
      aggregates = [];
      for(var issueArea = 0; issueArea < 14; issueArea++) {
        aggregates[issueArea] =
          {
            direction: 0,
            opinion: {
              majority: 0,
              minority: 0,
              other: 0
            },
            n: 0
          }
      }
      // iterate through each case in the array, incrementing counters by issue area
      for(var i = 0; i < v.length; i++) {
        var d = v[i]; // shorthand to make the syntax more similar to d3 methods

        // ignore all cases where the direction is NOT between 1 and 2 (either
        // 3, meaning unspecifiable, which is not significant in this field,
        // or data is simply missing). Similarly, ignore if the issue area is
        // not specified.
        if(d.direction >= 1 && d.direction <= 2 && d.issueArea != "") {
          // increment the decision direction, and keep track of n to take the mean later on
          aggregates[+d.issueArea - 1].direction += +d.direction;
          aggregates[+d.issueArea - 1].n++;

          // increment the opinion counts (minority/majority/other)
          if(d.majority == 2)       aggregates[+d.issueArea - 1].opinion.majority++;
          else if(d.majority == 1)  aggregates[+d.issueArea - 1].opinion.minority++;
          else                      aggregates[+d.issueArea - 1].opinion.other++;
        }
      }

      // in each issue area, divide aggregate direciton by n in order to get the mean
      // unless the direction is 0 (meaning it has never been recorded)
      for(var issueArea = 0; issueArea < 14; issueArea++) {
          // set to undefined if there were no cases in which the justice had a
          // specifiable direction; these will be ignored in the heatmap
        if(aggregates[issueArea].direction > 0) 
          aggregates[issueArea].direction /= aggregates[issueArea].n;
        else
          aggregates[issueArea] = undefined;
      }
      return aggregates;
    })
    .entries(NS.dataset);


  // make a list of the justices
  NS.justices = [];

  // make a new dataset in the form:
  //  justiceName, issueArea, direction
  NS.dataGood = [];
  NS.dataByJustice.forEach(function (d, i) {
    // add justice to the list of justices
    NS.justices[i] = d.key;
    // do stuff
    NS.issueAreas.forEach(function (v, j) {
      if(typeof d.value[j] == "undefined") return undefined;
      else {
        line = {
          justiceName: i,
          issueArea: j,
          direction: d.value[j].direction,
          majority:  d.value[j].opinion.majority,
          minority:  d.value[j].opinion.minority,
          n: d.value[j].n
        }
     }
      NS.dataGood.push(line);
    })
  })

  NS.civilLiberties = []
  NS.otherGroup = []


/*
  NS.dataGood.forEach(function (d) {
    if (d.issueArea >= 0 && d.issueArea <= 5) {
        NS.civilLiberties.push(d);
    }

    else {
      NS.otherGroup.push(d);
    }

  })
*/

  NS.dataGood.forEach(function (d) {
    if (d.issueArea >= 0 && d.issueArea <= 5) {
        d["typeX"] = "Civil Liberty";
        d["typeNum"] = 0;
    }

    else {
        d["typeX"] = "Other";
        d["typeNum"] = 1;
    }
  });



  NS.civilDataGood = [];

  var justiceCount = 0;

  //change the data to 37x2 data points for civil liberties view
  NS.dataByJustice.forEach(function (d) {

    var count = 0;
    var civil = [];
    var other = [];

    //get values into seperate lists
    d.value.forEach(function (d) {
      if (count <= 5) {
        civil.push(d);
      }

      else {
        other.push(d);
      }

      count++;


    });

    //counts for missing data
    var civilMissing = 0;
    var otherMissing = 0;


    //get averages for each
    var civilTotal = 0;
    civil.forEach(function (d) {
      if (d == "NaN") {
        civilMissing++;
        return;
      }

      civilTotal += Number(d);
    });

    var otherTotal = 0;
    other.forEach(function (d) {
      if (d == "NaN") {
        otherMissing++;
        return;
      }
      if(d == "0.00") {
        otherMissing++;
        return;
      }


      otherTotal += Number(d);
    });

    //console.log(civilTotal)
    console.log(other)


    var civilVal = civilTotal / (6 - civilMissing);
    var otherVal = otherTotal / (8 - otherMissing);

    NS.civilDataGood.push({ direction: civilVal, justiceName: justiceCount, typeNum: 0});
    NS.civilDataGood.push({ direction: otherVal, justiceName: justiceCount, typeNum: 1});

    justiceCount++;


  });







// data processing for pie chart






};


function main () {
  console.log("main function");

  // aggregate data
  aggregateData();

  // make SVG
  svg = d3.select("body").append("svg")
          .attr("width", NS.width + NS.margin.left + NS.margin.right)
          .attr("height", NS.height + NS.margin.top + NS.margin.bottom)
          .attr("id", "heatmap")
          .append("g")
          .attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")");

  

  heatmap_2(svg);
}

function heatmap(svg) {
  console.log("here");
  colorScale = d3.scaleQuantile()
    .domain([1, 2])
    .range(NS.colors);

  cards = svg.selectAll(".issueArea")
      .data(NS.dataGood)

  justiceLabels = svg.selectAll(".justiceLabel")
    .data(NS.justices)
    .enter().append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", (d, i) => i * NS.gridHeight)
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + NS.gridHeight / 1.5 + ")")
      .attr("class", (d, i) => ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"));

  issueLabels = svg.selectAll(".issueLabel")
    .data(d3.keys(NS.issueAreas))
    .enter().append("text")
      .text((d) => +d + 1)
      .attr("x", (d, i) => i * NS.gridSize)
      .attr("y", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(" + NS.gridSize / 2 + ", -6)")
      .attr("class", (d, i) => ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"));


  cards.append("title");

  function filterColors(dir) {
    if(dir > 0)
      return colorScale(dir);
    else
      return "#FFFFFF";
  }




  cards.enter().append("rect")
      .attr("x", function(d) {
        return d.issueArea * NS.gridSize;
      })
      .attr("y", function(d) {
        return d.justiceName * NS.gridHeight;
      })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("class", "issueArea bordered")
      .attr("width", NS.gridSize)
      .attr("height", NS.gridHeight)
      .style("fill", function(d) {
        return filterColors(d.direction);
      });

      legend = svg.selectAll(".legend")
          .data([0].concat(colorScale.quantiles()), (d) => d);

      legend_g = legend.enter().append("g")
          .attr("class", "legend");

      legend_g.append("rect")
        .attr("x", (d, i) => NS.legendElementWidth * i)
        .attr("y", NS.height)
        .attr("width", NS.legendElementWidth)
        .attr("height", NS.gridHeight / 2)
        .style("fill", (d, i) => NS.colors[i]);

      legend_g.append("text")
        .attr("class", "mono")
        .text((d) => "≥ " + Math.round(d))
        .attr("x", (d, i) => NS.legendElementWidth * i)
        .attr("y", NS.height + NS.gridHeight);

} // end heatmap

function heatmap_2(svg) {
  console.log("here");
  colorScale = d3.scaleQuantile()
    .domain([1, 2])
    .range(NS.colors);



  tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d.direction; });

  svg.call(tip);

  cards = svg.selectAll(".typeNum")
      .data(NS.civilDataGood)

  justiceLabels = svg.selectAll(".justiceLabel")
    .data(NS.justices)
    .enter().append("text")
      .text(function (d) { return d; })
      .attr("x", 0)
      .attr("y", (d, i) => i * NS.gridHeight)
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + NS.gridHeight / 1.5 + ")")
      .attr("class", (d, i) => ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"));

  issueLabels = svg.selectAll(".issueLabel")
    .data(NS.civil_list)
    .enter().append("text")
      .text(function (d) { return d; })
      .attr("x", (d, i) => i * NS.gridSize)
      .attr("y", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(" + NS.gridSize / 2 + ", -6)")
      .attr("class", (d, i) => ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"));


  cards.append("title");

  function filterColors(dir) {
    if(dir > 0)
      return colorScale(dir);
    else
      return "#FFFFFF";
  }

  console.log("got here!!")


  cards.enter().append("rect")
      .attr("x", function(d) {
      
        return d.typeNum * NS.gridSize;
      })
      .attr("y", function(d) {
        return d.justiceName * NS.gridHeight;
      })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("class", "issueArea bordered")
      .attr("width", NS.gridSize)
      .attr("height", NS.gridHeight)
      .style("fill", function(d) {
        return filterColors(d.direction);
      })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

      console.log("Gothere22!!!")

      /*

      legend = svg.selectAll(".legend")
          .data([0].concat(colorScale.quantiles()), (d) => d);

      legend_g = legend.enter().append("g")
          .attr("class", "legend");

      legend_g.append("rect")
        .attr("x", (d, i) => NS.legendElementWidth * i)
        .attr("y", NS.height)
        .attr("width", NS.legendElementWidth)
        .attr("height", NS.gridHeight / 2)
        .style("fill", (d, i) => NS.colors[i]);

      legend_g.append("text")
        .attr("class", "mono")
        .text((d) => "≥ " + Math.round(d))
        .attr("x", (d, i) => NS.legendElementWidth * i)
        .attr("y", NS.height + NS.gridHeight);

      */

} // end heatmap


//Remove SVG before creating new heatmap
function removeHSVG() {
  d3.select("#heatmap").remove();

} // end removeSVG


function civilButton() {
  removeHSVG();
  // make SVG
  svg = d3.select("body").append("svg")
          .attr("width", NS.width + NS.margin.left + NS.margin.right)
          .attr("height", NS.height + NS.margin.top + NS.margin.bottom)
          .attr("id", "heatmap")
          .append("g")
          .attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")");

  heatmap_2(svg);

}

function regularButton() {

  removeHSVG();
  svg = d3.select("body").append("svg")
          .attr("width", NS.width + NS.margin.left + NS.margin.right)
          .attr("height", NS.height + NS.margin.top + NS.margin.bottom)
          .attr("id", "heatmap")
          .append("g")
          .attr("transform", "translate(" + NS.margin.left + "," + NS.margin.top + ")");

  heatmap(svg);

}


var sample = [16, 4];

function pieChart(sample) {

  var w = 300,                        //width
  h = 300,                            //height
  r = 150,                            //radius
  color = d3.scaleOrdinal(["#98abc5", "#ff8c00"]);    //builtin range of colo 
  
  data = [{"label":"majority", "value":20}, 
          {"label":"minority", "value":50}];
  
  var vis = d3.select("body")
      .append("svg:svg")              //create the SVG element inside the <body>
      .data([data])                   //associate our data with the document
          .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
          .attr("height", h)
      .append("svg:g")                //make a group to hold our pie chart
          .attr("transform", "translate(" + r + "," + r + ")")    //move the center of the pie chart from 0, 0 to radius, radi  
  
  var arc = d3.arc()              //this will create <path> elements for us using arc data
              .innerRadius(0)
              .outerRadius(r)
  
  var pie = d3.pie()           //this will create arc data for us given a list of values
      .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data arr 
  
  var arcs = vis.selectAll("g.slice")     //this selects all <g> elements with class slice (there aren't any yet)
      .data(pie)                          //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties) 
      .enter()                            //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
          .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
              .attr("class", "slice");    //allow us to style things in the slices (like tex  
      arcs.append("svg:path")
              .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
              .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing functi  
      arcs.append("svg:text")                                     //add a label to each slice
              .attr("transform", function(d) {                    //set the label's origin to the center of the arc
              //we have to make sure to set these before calling arc.centroid
              d.innerRadius = 0;
              d.outerRadius = r;
              return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
          })
          .attr("text-anchor", "middle")                          //center the text on it's origin
          .text(function(d, i) { return data[i].label; });        //get the label from our original data array
        
}









function initialize() {


  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;
    main();
  });
}


//////////////////////////////////////////////////////////////////////

initialize()

pieChart(sample)
