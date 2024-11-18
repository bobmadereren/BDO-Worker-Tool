import dataa from './nodes.json' with {type: 'json'};

let data = dataa.filter(({ type }) => type == "Town" || type == "City");

let margin = { top: 150, right: 80, bottom: 20, left: 80 };  // Increased top margin for more spacing. 
let width = 1500 - margin.left - margin.right;
let height = 800 - margin.top - margin.bottom;

let x = d3.scaleLinear(d3.extent(data, d => d.pos.x), [0, width]);
let y = d3.scaleLinear(d3.extent(data, d => d.pos.y), [height, 0]);
let color = d3.scaleOrdinal(data.map(({ type }) => type), d3.schemePaired);

let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")  // Make the SVG block element
    .style("margin", "0 auto")  // Center the block element
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let xAxis = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

let yAxis = svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

let tooltip = d3.select("body")
    .append("div")
    .attr("class", "node-tooltip")
    .style("position", "absolute")
    .style("width", "240px")
    .style("height", "2.5em")
    .style("color", "white")
    .style("background", "grey")
    .style("opacity", 0);

tooltip.append("text", "hei");

function updateTooltip(e, d) {
    tooltip.html(d.name + ", " + d.type)
        .style("left", e.pageX + "px")
        .style("top", e.pageY + "px")
        .style("opacity", 1);
}

let nodes = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "node")
    .on("mouseover", updateTooltip)
    .on("mouseout", () => tooltip.style("opacity", 0));


nodes.append("circle")
    .attr("r", 5)
    .attr("cx", d => x(d.pos.x))
    .attr("cy", d => y(d.pos.y))
    .style("fill", d => color(d.type));

nodes.append("text")
    .attr("x", d => x(d.pos.x))
    .attr("y", d => y(d.pos.y))
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")  // Center the text horizontally
    .attr("dy", "-0.7em")  // Position the text above the circle
    .text(({ name }) => name);

console.log(color.domain());

let legend = svg.append("g")
    .attr("class", "legends")
    .selectAll(".lengends")
    .data(color.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (_, i) => `translate(0, ${i * 20})`);

legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .style("fill", color)
    .text(d => d);
