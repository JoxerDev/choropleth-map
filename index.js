const education_URL =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const county_URL =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

d3.queue()
  .defer(d3.json, county_URL)
  .defer(d3.json, education_URL)
  .await(drawSvg);

function drawSvg(error, county, education) {
  if (error) throw error;

  width = 960;
  height = 600;
  // Zoom
  let zoom = d3
    .zoom()
    .scaleExtent([0.1, 50])
    .on("zoom", function () {
      d3.select(".counties").attr("transform", d3.event.transform);
      d3.select(".states").attr("transform", d3.event.transform);
    });

  let svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

  // Tooltip div
  let tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  // Min and Max Education percentages for later use
  let educationMin = d3.min(education, (d) => d.bachelorsOrHigher);
  let educationMax = d3.max(education, (d) => d.bachelorsOrHigher);

  // Path for TopoJSON
  let path = d3.geoPath();

  // X Axis
  let xScale = d3
    .scaleLinear()
    .domain([educationMin, educationMax])
    .rangeRound([600, 860]);

  // Color
  let color = d3
    .scaleThreshold()
    .domain(
      d3.range(educationMin, educationMax, (educationMax - educationMin) / 8)
    )
    .range(d3.schemeReds[9]);

  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(county, county.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", function (d) {
      let result = education.filter(function (obj) {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      return 0;
    })
    .attr("fill", function (d) {
      let result = education.filter(function (obj) {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }

      return color(0);
    })
    .attr("d", path)
    .on("mousemove", function (d) {
      tooltip.style("opacity", 0.9);
      tooltip
        .html(function () {
          let result = education.filter(function (obj) {
            return obj.fips == d.id;
          });
          if (result[0]) {
            return (
              result[0]["area_name"] +
              "<br/>" +
              "State: " +
              result[0]["state"] +
              "<br/>" +
              result[0].bachelorsOrHigher +
              "%"
            );
          }

          return 0;
        })
        .attr("data-education", function () {
          let educationResult = education.filter(function (obj) {
            return obj.fips == d.id;
          });
          if (educationResult[0]) {
            return educationResult[0].bachelorsOrHigher;
          }
          return 0;
        })
        .style("left", d3.event.pageX + 20 + "px")
        .style("top", d3.event.pageY - 30 + "px");
    })
    .on("mouseout", function (d) {
      tooltip.style("opacity", 0);
    });

  svg
    .append("path")
    .datum(
      topojson.mesh(county, county.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "states")
    .attr("d", path);

  // Legend SVG
  let legendSVG = d3.select("#chart")
.append("svg")
.attr("id", "legendSvg")
.attr("width", width)
.attr("height",60);

  let legend = legendSVG
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(0,30)");

  legend
    .selectAll("rect")
    .data(
      color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = xScale.domain()[0];
        if (d[1] == null) d[1] = xScale.domain()[1];
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("height", 8)
    .attr("x", (d) => xScale(d[0]))
    .attr("width", (d) => xScale(d[1]) - xScale(d[0]))
    .attr("fill", (d) => color(d[0]));

  legend
    .call(
      d3
        .axisBottom(xScale)
        .tickValues(color.domain())
        .tickSize(13)
        .tickFormat((xScale) => Math.round(xScale) + "%")
    )
    .select(".domain")
    .remove();
}
