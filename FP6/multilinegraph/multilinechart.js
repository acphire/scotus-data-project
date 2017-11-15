1
// Namespace
var NS = {}; // create namespace

  NS.datapath = "../../Data/SCDB_2017_01_justiceCentered_LegalProvision.csv"
  //NS.datapath = "../../Data/SCDB_small.csv"


function aggregateData() {
  NS.dataNested = d3.nest()
    // nest by justice
    .key(function(d) {return d.justiceName})
    // nest by year
    .key(function(d) {return d.dateDecision.split("/")[2]; } )

    // roll up mean votes
    .rollup(function(v) {
      return d3.mean(v, function(d) {
                      // ignore cases with no direction
                      if(d.direction >= 1) {
                        return d.direction;
                      }
                    })
    })
    .entries(NS.dataset);


}

function initialize() {

  // Load census data and call main
  d3.csv(NS.datapath, function(d) {
    NS.dataset = d;

    main();
  });
}

function createGraph() {

  var svg = d3.select("svg"),
      margin = {top: 20, right: 80, bottom: 30, left: 50},
      width = svg.attr("width") - margin.left - margin.right,
      height = svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  console.log("got here 1")

  var x = d3.scaleLinear().range([0, width]),
      y = d3.scaleLinear().range([height, 0]),
      z = d3.scaleOrdinal(d3.schemeCategory20);

  console.log("got here 2")

  var line = d3.line()
    //.curve(d3.curveBasis)
    .x(function(d) { return x(d.key); })
    .y(function(d) {
      return y(d.value )
    });


  x.domain(d3.extent(NS.dataset, function(d) {
    return +(d.dateDecision.split("/")[2]);
  }));

  y.domain([1, 2])

  z.domain(NS.dataNested.map(function(c) { return c.key; }));

  // Add x axis
 var xAxis = d3.axisBottom(x)
            .tickFormat(function(d) {
              return d;
            });

  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y))
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text("Preference Value");


  // Create an object for each justice
  var justice = g.selectAll(".justice")
    .data(NS.dataNested)
    .enter().append("g")
      .attr("class", "justice");

  var shownJustices = ["JPStevens", "DHSouter", "SDOConnor", "WHRehnquist", "BRWhite"];

  function fade (c, j) {
      if(shownJustices.includes(j)) {
        return c;
      } else {
        // fade it
        var color = d3.color(c)
        color.opacity = 0.1;
        return color.toString();
      }
  }

  // Add lines for each justice
  justice.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .style("stroke", function(d) {
      return fade(z(d.key), d.key);
    })
    .style("stroke-width", 2);

  // Add labels for each justice
  justice.append("text")
      .datum(function(d) { return {justice: d.key, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { 
        return "translate(" + x(d.value.key) + "," + y(d.value.value) + ")";
      })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .style("font", "10px sans-serif")
      .style("fill", function(d) {
        return fade("black", d.justice);
      })
      .text(function(d) { return d.justice; });

}

function main() {
  aggregateData();

  createGraph();


}

initialize();

