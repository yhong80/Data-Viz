// Color mapping based on year
var yearColors = {2000: '#8c8c8c', 2010: '#ffcc00'};
var valueColors = ['#fcc9b5','#fa8873','#d44951','#843540'];
var colors={0:['#fcc9b5','#fa8873','#d44951','#843540'],1:['#ccffcc','#99ff66','#009900','#336600'],2:['#ccffff','#66ffff','#33ccff','#0033cc']};
var padding = {t: 20, b: 30, l: 20, r: 20};
var barPlotPadding = {t: 30, b: 30, l: 110, r: 10};
var offset = 50;

// legend
var keysize = 16;
var numRows = 1, numCols = 3;
var svg = d3.select("svg");
var width = (svg.attr("width") -  (padding.l + padding.r))/numCols;
var height = (svg.attr("height") - (padding.t + padding.b))/numRows;
var barPlotWidth = width - (0.4*padding.l + barPlotPadding.l + barPlotPadding.r);
var barPlotHeight = height/2 - (barPlotPadding.t + barPlotPadding.b);

var yScaleBottom = d3.scaleLinear()
    .range([height, height/2]);
    
var xScaleBottom = d3.scaleLinear()
    .range([0, width - offset]);
   
var xScaleTop = d3.scaleLinear()
    .range([0, barPlotWidth]);
    
var yScaleTop0 = d3.scaleBand()
    .rangeRound([0, barPlotHeight])
    .paddingInner(0.1);
var yScaleTop1 = d3.scaleBand()
    .padding(0.05);
    
var colorScale = [d3.scaleQuantize().range(colors[0]),d3.scaleQuantize().range(colors[1]),d3.scaleQuantize().range(colors[2])]  
var topCharts = [];
for (var i = 0; i < numCols; i++) {
    for (var j = 0; j < numRows; j++) {
        var x = i*width + padding.l + 0.4*padding.l;
        var y = j*height/2 + padding.t;
        
 
        
        var chart = d3.select("svg")
          .append("g")
          .attr("transform", "translate(" + (x + barPlotPadding.l) + "," + (y + barPlotPadding.t) + ")")
        topCharts.push({chart: chart, x: x, y: y});
    }
}    
    
var bottomCharts = [];
for (var i = 0; i < numCols; i++) {
    for (var j = 0; j < numRows; j++) {
        var x = i*width + padding.l;
        var y = j*height + padding.t;
        var chart = d3.select("svg")
          .append("g")
          .attr("transform", "translate(" + x + "," + y + ")");
        bottomCharts.push({chart: chart, x: x, y: y});
    }
}

var titles = {top: ['Avg. population density (in persons/sq. km)', 'Urban population', 'Urban land (in sq. km)'],
              bottom: ['avg. population density', 'population', 'urban land']
             }

var legendKeys = [
  ['< 5k', '5k-10k', '10k-15k', '> 15k'],
  ['< 2M', '2M-3M', '3M-4M', '> 4M'],
  ['< 0.4k', '0.4k-0.6k', '0.6k-0.8k', '> 0.8k']
];
// Dataset from http://nbremer.github.io/urbanization/
d3.csv('./data/asia_urbanization.csv',
function(row){
    // This callback formats each row of the data
    return {
        city: row.city,
        country: row.country,
        type_country: row.type_country,
        land_2000: +row.land_2000,
        land_2010: +row.land_2010,
        land_growth: +row.land_growth,
        pop_2000: +row.pop_2000,
        pop_2010: +row.pop_2010,
        pop_growth: +row.pop_growth,
        density_2000: +row.density_2000,
        density_2010: +row.density_2010,
        density_growth: +row.density_growth
    }
},
function(error, dataset){
    if(error) {
        console.error('Error while loading ./data/asia_urbanization.csv dataset.');
        console.error(error);
        return;
    }
    var countryAggregate = d3.nest()
        .key(function(d) {return d.country})
        .rollup(function(v) { return {
          density_2000 : d3.mean(v, function(d) { return d.density_2000; }),
          density_2010 : d3.mean(v, function(d) { return d.density_2010; }),
          pop_2000     : d3.sum(v, function(d) { return d.pop_2000; }),
          pop_2010     : d3.sum(v, function(d) { return d.pop_2010; }),
          land_2000    : d3.sum(v, function(d) { return d.land_2000; }),
          land_2010    : d3.sum(v, function(d) { return d.land_2010; })
        }; })
        .entries(dataset);
    
    var countryDensity = countryAggregate.map(function (d) {
      return {
        country: d.key,
        2000: d.value.density_2000,
        2010: d.value.density_2010
      }
    })
    //console.log(countryDensity)  
    var countryPopulation = countryAggregate.map(function (d) {
      return {
        country: d.key,
        2000: d.value.pop_2000,
        2010: d.value.pop_2010
      }
    })
      
    var countryLand = countryAggregate.map(function (d) {
      return {
        country: d.key,
        2000: d.value.land_2000,
        2010: d.value.land_2010
      }
    })
    
    var barPlotData = [countryDensity, countryPopulation, countryLand];

    var barPlotMaxValue = barPlotData.map(function (v) {
        return d3.max(v, function (d) {
            return Math.max(d[2000], d[2010]);
        });
    });
  
    for (var i = 0; i < topCharts.length; i++) {
        var chart = topCharts[i].chart;
        
        // chart title
        chart.append("text")
          .attr("y", 5 - barPlotPadding.t)
          .attr("dy", "1em")
          .style("text-anchor", "left")
          .text(titles.top[i]); 
        
        var sortedData = barPlotData[i].sort(function(x, y){
            return d3.descending(x[2010], y[2010]);});
        var keys = [2000, 2010];
        
        yScaleTop0.domain(sortedData.map(function(d) { return d.country; }));
        yScaleTop1.domain(keys).rangeRound([0, yScaleTop0.bandwidth()]);
        
        xScaleTop.domain([0, barPlotMaxValue[i]]);
        
        // Define the axes
        var xAxis = d3.axisBottom(xScaleTop)
          .tickFormat(d3.format(".1s"))
          .ticks(5);
          
        // Add the X Axis
        chart.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0, " + (barPlotHeight + 5)  + ")")
          .call(xAxis);
          
         // Add the Y Axis
         chart.append("g")
          .attr("class", "y-axis")
          .call(d3.axisLeft(yScaleTop0));      
        chart.append("g")
          .selectAll("g")
          .data(sortedData)
          .enter().append("g")
            .attr("transform", function(d) { return "translate(0," + yScaleTop0(d.country) +")"; })
            .attr("class", function(d) {return "gBar " + d.country;})
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
      
      
          .selectAll("rect")
          .data(function(d) {
            //console.log(d)
            return keys.map(function(key) { return {key: key, value: d[key]}; }); })
          .enter().append("rect")
            .attr("y", function(d) { return yScaleTop1(d.key); })
            .attr("height", yScaleTop1.bandwidth())
            .attr("width", function(d){ return xScaleTop(d.value); })
            .attr("fill", function(d) { return yearColors[d.key]; });
         
    }
    
    // Create Event Handlers for mouse
    function handleMouseOver(d) {
      var country = d3.select(this).attr("class").split(" ")[1];

      d3.selectAll(".gBar > rect")
        .transition()
        .attr("fill-opacity", 0.4);
      
      d3.selectAll("circle.city")
        .transition()
        .attr("fill-opacity", 0.4);
      d3.selectAll("." + country + " > rect")
        .transition()
        .attr("fill-opacity", 1.0);
        
      d3.selectAll("circle." + country)
        .transition()
        .attr("fill-opacity", 1.0);
    }
    function handleMouseOut(d) {
      d3.selectAll(".gBar > rect")
        .transition()
        .attr("fill-opacity", 1.0);
      
      d3.selectAll("circle.city")
        .transition()
        .attr("fill-opacity", 1.0);
    }
    
   
    
    
    //set x-domains of three columns
    var colorMax = [15000, 5e6, 1000];
    var keys = ['density_growth', 'pop_growth', 'land_growth'];
    var xDomain = keys.map(function (v) {

      return [d3.min(dataset, function (d) {return d[v];}), d3.max(dataset, function (d) {return d[v];})]
    });
    
    for (var i = 0; i < topCharts.length; i++) {
        var chart = bottomCharts[i].chart;
       
        //sorting based on each var.
        var sortKey = keys[i].replace('growth', '2010'); 
        var sortFunction = function(x, y){
          return d3.descending(x[sortKey], y[sortKey]);}
        
        xScaleBottom.domain(xDomain[i]);
        colorScale[i].domain([0, colorMax[i]]);
            
        // set the parameters for the histogram
        var histogram = d3.histogram()
          .value(function(d) { return d[keys[i]]; })
          .domain(xScaleBottom.domain())
          .thresholds(xScaleBottom.ticks(80));
        
        var bins = histogram(dataset).map(function (v){return v.sort(sortFunction)});
        yScaleBottom.domain([0, 156]);
        
        // chart title
        chart.append("text")
          .attr("y", 0.62*height)
          .attr("dy", "1em")
          .attr("font-size", "11")
          .style("text-anchor", "left")
            .append("tspan")
              .attr("x", 0.5*width)
              .attr("dy", "1.2em")
              .text("Growth in " + titles.bottom[i])
            .append("tspan")
              .attr("x", 0.5*width)
              .attr("dy", "1.2em")
              .text("between 2000 and 2010"); 
              
         // Define the axes
        var xAxis = d3.axisBottom(xScaleBottom)
          .tickFormat(d3.format(".0%"))
          .ticks(7-i);
         
        var yAxis = d3.axisLeft(yScaleBottom)
            .ticks(8);
            
        // Add the X Axis
        chart.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(" + offset + ", " + (height + 5)  + ")")
          .call(xAxis);
       
        
        // Add the Y Axis
        chart.append("g")
          .attr("class", "y-axis")
          .attr("transform", "translate(" + (offset + 5) + ", 0)")
          .call(yAxis);
        
        // add the Y gridlines
        chart.append("g")           
            .attr("class", "grid")
            .attr("transform", "translate(" + (offset + 5) + ", 0)")
            .call(yAxis
                .ticks(5)
                .tickSize(-(width - offset - 10))
                .tickFormat("")
            )
          
        // text label for the Y axis
        chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", -height)
        .text("Number of Cities");    
        
        // plot data
        chart.append("g")
          .selectAll("g")
          .data(bins)
          .enter().append("g")
            .attr("transform", function(d) { return "translate(" + (offset + xScaleBottom((d.x0 + d.x1)/2)) + ", 0)"; })
          .selectAll("circle")
          .data(function(v) { return v.map(function (d, i){
              return {
                'idx': i,
                'r': (xScaleBottom(v.x1) - xScaleBottom(v.x0)),
                'country': d.country,
                'color': d[sortKey]
              };
            }) 
          })
          .enter().append("circle")
            .attr("cx", 0)
            .attr("cy", function(d, i) {return height - i * d.r/1.5; })
            .attr("r", function(d) {return d.r/3})
            .attr("class", function(d) {return "city " + d.country})
            .attr("fill", function(d) { return colorScale[i](d.color) });
            
        // make legend 
        var legend = chart.append("g")
            .attr("transform", "translate (" + (width-2.5*offset) + "," + (0.71*height) + ")")
            .attr("class", "legend");
        
        legend.append("text")
          .attr("y", 30)
          .attr("x", 0)
          .text("Urban " + keys[i].split("_")[0] + " - 2010"); 
        
        // make quantized key legend items
        var li = legend.append("g")
            .attr("transform", "translate (8," + 30 + ")")
            .attr("class", "legend-items");
        
        li.selectAll("rect")
          .data(colorScale[i].range().map(function(color) {
            var d = colorScale[i].invertExtent(color);
            return d;
          }))
          .enter().append("rect")
          .attr("y", function(d, i) { return -i*keysize-30; })
          .attr("width", keysize)
          .attr("height", keysize)
          .style("fill", function(d) { return colorScale[i](d[0]); });
        
        li.selectAll("text")
          .data(legendKeys[i])
          .enter().append("text")
          .attr("x", keysize + 10)
          .attr("y", function(d, i) { return -(i+1)*keysize-2; })
          .text(function(d) { return d; });
         
    }

});