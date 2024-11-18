import dataa from './nodes.json' with {type: 'json'};

let data = dataa.filter(({ type }) => type == "Town" || type == "City");

let margin = { top: 20, right: 100, bottom: 20, left: 50 };
let width = 1500 - margin.left - margin.right;
let height = 800 - margin.top - margin.bottom;

let x = d3.scaleLinear(d3.extent(data, d => d.pos.x), [0, width]);
let y = d3.scaleLinear(d3.extent(data, d => d.pos.y), [height, 0]);
let color = d3.scaleOrdinal(data.map(({ type }) => type), d3.schemePaired);

let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

let gx = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

let gy = svg.append("g")
    .call(d3.axisLeft(y));


let circles = svg.selectAll("circle")
    .data(data)
    .enter()
    .append("g");

circles.append("circle")
    .attr("r", 5)
    .attr("cx", d => x(d.pos.x))
    .attr("cy", d => y(d.pos.y))
    .style("fill", d => color(d.type))

circles.append("text")
    .attr("x", d => x(d.pos.x))
    .attr("y", d => y(d.pos.y))
    .style("fill", d => color(d.type))
    .text(({ name }) => name);
