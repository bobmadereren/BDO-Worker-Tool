import nodeData from './data/nodes.json' with {type: 'json'};
import investedData from './config/investedNodes.json' with {type: 'json'};
import * as d3 from 'd3';
import { Axe, Castle, createElement, createIcons, Factory, FishSymbol, Handshake, Landmark, Leaf, Package, Pickaxe, Shovel, TriangleAlert, UtilityPole, Wheat } from 'lucide';
import { shortestPath } from './graph/graph.ts';

function buy(e, d) {

    if (!d.neighbors.some(id => investedNodes.has(id))) {
        alert('You can only invest in a node adjacent to a node that has allrady been invested in.');
        return;
    }

    // Add the current node to the owned set
    investedNodes.add(d.id);

    // Update the visualization
    d3.select(e.target) // Assuming the target is the node element
        .select('image') // Update the node's image
        .style('opacity', 1); // Example: Change opacity to indicate ownership

    // Optional: Update the tooltip
    updateTooltip(e, d);

    // Update the total CP display
    document.getElementById('total-cp').textContent = `Total CP Spent: ${calculateTotalCP()}`;

    alert(`House bought at ${d.name}!`);
}

function calculateTotalCP() {
    let totalCP = 0;
    investedNodes.forEach(nodeId => {
        const node = nodeMap.get(nodeId);
        if (node && node.cp) {
            totalCP += node.cp;
        }
    });
    return totalCP;
}


/**
 * Icons to use for different node types
 */
let icons = {
    'Connection': UtilityPole,
    'Town': Castle,
    'City': Castle,
    'Gateway': UtilityPole,
    'Farming': Wheat,
    'Trade': Handshake,
    'Gathering': Leaf,
    'Mining': Pickaxe,
    'Lumbering': Axe,
    'Danger Zone': TriangleAlert,
    'Investment Bank': Landmark,
    'Fish Drying Yard': FishSymbol,
    'Specialties': Package,
    'Production': Factory,
    'Excavation': Shovel,
}

/**
 * Set of ids for all nodes that has been invested in
 */
let investedNodes = new Set(investedData);

// Generate edge data
let nodeMap = new Map(nodeData.map(d => [d.id, d]));
let edgeData = nodeData.flatMap(d => d.neighbors.filter(id => id > d.id).map(id => ({ source: d, target: nodeMap.get(id) })));

// Adjust dimensions and margins
let margin = { top: 20, right: 20, bottom: 20, left: 20 };
let width = window.innerWidth - margin.left - margin.right;
let height = window.innerHeight - margin.top - margin.bottom;

// Define the affine transformation sending the world to the svg
let [x0, x1] = d3.extent(nodeData, d => d.pos.x);
let [y0, y1] = d3.extent(nodeData, d => d.pos.y);
let k = Math.min(width / (x1 - x0), height / (y1 - y0));
let X = x => (x - (x0 + x1) / 2) * k + width / 2;
let Y = y => (y - (y0 + y1) / 2) * (-1) * k + height / 2;

// Edge lines
let line = d3.line();

// Zoom
let zoom = d3.zoom()
    .translateExtent([[0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom]])
    .scaleExtent([1, 500])
    .on("zoom", draw);

let textSize = d3.scaleLog(zoom.scaleExtent(), [0, 20]);
let iconSize = d3.scaleLog(zoom.scaleExtent(), [10, 75]);

// Define a custom color palette
let customColors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    "#bcbd22", "#17becf"
];

let types = [...new Set(nodeData.map(({ type }) => type))]; // Unique types
let color = d3.scaleOrdinal(types, customColors); // Ensure the scale matches the dataset

/**
 * Highlights the shortest path in terms of CP from a node to any node that has been invested in.
 */
function highlightShortestPath(_, node) {
    let { path, cost } = shortestPath(node, ({ id }) => investedNodes.has(id), ({ neighbors }) => neighbors.map(id => nodeMap.get(id)), ({ cp }) => cp);
    let pathSet = new Set(path);
    nodes.filter(d => pathSet.has(d))
        .attr("highlight", '');
}

// Create SVG
let svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .style("margin", "0 auto")
    .style("cursor", "crosshair")
    .call(zoom)
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Tootlip
function updateTooltip(e, d) {
    let tooltip = d3.select("#node-tooltip")
        .style("left", e.pageX + "px")
        .style("top", e.pageY + "px")
        .classed("visible", true);

    createIcons({
        icons: { Axe },
        nameAttr: 'data-lucide',
    })

    //tooltip.select("#icon").html(createElement(icons[d.type]));
    tooltip.select("#name").text(d.name);
    tooltip.select("#territory").text(d.territory);
    tooltip.select("#cp").text(d.cp);
    tooltip.select("#buy-sell").text(investedNodes.has(d.id) ? "sell" : "buy");
}

function hideTooltip() {
    d3.select("#node-tooltip").classed("visible", false);
}

function sell(e, d) {
    if (!investedNodes.has(d.id)) {
        alert('This node is not owned. You cannot sell it.');
        return;
    }

    // Remove the current node from the owned set
    investedNodes.delete(d.id);

    // Update the visualization
    d3.select(`#i${d.id}`) // Target the node element
        .select('image') // Update the node's image
        .style('opacity', 0.5); // Example: Change opacity to indicate it’s unowned

    // Optional: Update the tooltip
    updateTooltip(e, d);

    // Update the total CP display
    document.getElementById('total-cp').textContent = `Total CP Spent: ${calculateTotalCP()}`;

    alert(`House sold at ${d.name}!`);
}

// Create edges
let edges = svg.append("g")
    .attr("class", "edges")
    .selectAll(".edge")
    .data(edgeData, d => d.source.id + '-' + d.target.id)
    .enter()
    .append("path")
    .attr("class", "edge")
    .attr("stroke", d => {
        if (investedNodes.has(d.source.id) && investedNodes.has(d.target.id)) {
            return "green"; // Both nodes owned
        } else if (investedNodes.has(d.source.id) || investedNodes.has(d.target.id)) {
            return "yellow"; // One node owned
        } else {
            return "white"; // No nodes owned
        }
    })
    .attr("stroke-width", d => {
        if (investedNodes.has(d.source.id) && investedNodes.has(d.target.id)) {
            return 3; // Thicker line for both owned
        } else if (investedNodes.has(d.source.id) || investedNodes.has(d.target.id)) {
            return 2; // Medium line for one owned
        } else {
            return 1; // Thin line for none owned
        }
    })
    .attr("fill", "none")
    .on("mouseover", e => d3.select(e.target).attr("stroke", "#ffaa00").attr("stroke-width", 4))
    .on("mouseout", (e, d) => d3.select(e.target)
        .attr("stroke", d => {
            if (investedNodes.has(d.source.id) && investedNodes.has(d.target.id)) {
                return "green";
            } else if (investedNodes.has(d.source.id) || investedNodes.has(d.target.id)) {
                return "yellow";
            } else {
                return "white";
            }
        })
        .attr("stroke-width", d => {
            if (investedNodes.has(d.source.id) && investedNodes.has(d.target.id)) {
                return 3;
            } else if (investedNodes.has(d.source.id) || investedNodes.has(d.target.id)) {
                return 2;
            } else {
                return 1;
            }
        })
    );


function updateEdgeStyles() {
    edges
        .attr("stroke", d => {
            if (investedNodes.has(d.source.id) && investedNodes.has(d.target.id)) {
                return "green";
            } else if (investedNodes.has(d.source.id) || investedNodes.has(d.target.id)) {
                return "yellow";
            } else {
                return "white";
            }
        })
        .attr("stroke-width", d => {
            if (investedNodes.has(d.source.id) && investedNodes.has(d.target.id)) {
                return 3;
            } else if (investedNodes.has(d.source.id) || investedNodes.has(d.target.id)) {
                return 2;
            } else {
                return 1;
            }
        });
}

// Create nodes
let nodes = svg.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodeData, ({ id }) => id)
    .enter()
    .append("g")
    .attr("id", ({ id }) => "i" + id)
    .attr("class", "node")
    .on("click", (e, d) => {
        e.stopPropagation(); // Prevent propagation to avoid unwanted behaviors
        showSidePanel(e, d); // Open the side panel with node details
    });

nodes.append("text")
    .style("fill", d => color(d.type))
    .attr("text-anchor", "middle")
    .attr("dy", "-0.7em")
    .style("user-select", "none")
    .text(({ name }) => name);

nodes.append(d => createElement(icons[d.type]))
    .attr("class", "icon")
    .on("mouseover.tooltip", updateTooltip)
    .on("mouseover.path", highlightShortestPath)
    .on("mousemove", updateTooltip)
    .on("mouseout.tooltip", hideTooltip)
    .on("mouseout.path", () => nodes.attr("highlight", undefined))
    .on('dblclick', (e, d) => {
        e.stopPropagation();
        buy(e, d); // Double-click remains for buying nodes
    });



// Create legend with toggle functionality
d3.select("#legends")
    .selectAll(".legend")
    .data(types)
    .join(enter => {
        let div = enter.append("div")
            .attr("class", "legend active") // Start with all legends active
            .on("click", function (event, type) {
                const legendItem = d3.select(this);
                const isActive = legendItem.classed("active");

                // Toggle between active and inactive states
                legendItem
                    .classed("active", !isActive)
                    .classed("inactive", isActive);

                // Collect all active types
                const activeTypes = new Set(
                    d3.selectAll(".legend.active")
                        .data()
                );

                // Update nodes and edges visibility
                nodes.style('opacity', d =>
                    activeTypes.has(d.type) ? 1 : 0.1 // Show nodes of active types
                );

                edges.style('opacity', d =>
                    activeTypes.has(d.source.type) || activeTypes.has(d.target.type) ? 1 : 0.1 // Show edges with active nodes
                );
            });

        // Append icon and name
        div.append(d => createElement(icons[d]))
            .attr("class", "legend-icon");
        div.append("text").text(d => d);
    });


function draw({ transform }) {
    let x = x => transform.applyX(X(x));
    let y = y => transform.applyY(Y(y));
    let k = transform.k;

    nodes.selectAll("text")
        .attr("x", d => x(d.pos.x))
        .attr("y", d => y(d.pos.y) - iconSize(k))
        .style("font-size", textSize(k) + "px");

    nodes.selectAll('svg')
        .attr("width", iconSize(k))
        .attr("height", iconSize(k))
        .attr("x", d => x(d.pos.x) - iconSize(k) / 2)
        .attr("y", d => y(d.pos.y) - iconSize(k));

    edges.attr("d", d => line([[x(d.source.pos.x), y(d.source.pos.y)], [x(d.target.pos.x), y(d.target.pos.y)]]));
}

function showSidePanel(_, d) {
    let sidePanel = d3.select("#side-panel");
    sidePanel.classed("hidden", false);

    // Display node details
    d3.select("#side-panel-content").html(`
        <div><strong>Name:</strong> ${d.name}</div>
        <div><strong>Type:</strong> ${d.type}</div>
        <div><strong>Territory:</strong> ${d.territory}</div>
        <div><strong>Contribution Points:</strong> ${d.cp}</div>
        <div><strong>Yield:</strong> ${d.yield || 'N/A'}</div>
        <div><strong>Luck Yield:</strong> ${d.luckYield || 'N/A'}</div>
        <div><strong>Is Subnode:</strong> ${d.subNode ? 'Yes' : 'No'}</div>
        <div><strong>Is Monopoly Node:</strong> ${d.isMonopoly ? 'Yes' : 'No'}</div>
        <button id="buy-button" ${investedNodes.has(d.id) ? "disabled" : ""}>Buy House</button>
        <button id="sell-button" ${!investedNodes.has(d.id) ? "disabled" : ""}>Sell House</button>
    `);

    // Add functionality for buying
    d3.select("#buy-button").on("click", function (e) {
        e.stopPropagation(); // Prevent propagation
        if (d.neighbors.some(neighborId => investedNodes.has(neighborId))) {
            buy(e, d);
            d3.select("#buy-button").property("disabled", true);
            d3.select("#sell-button").property("disabled", false);
            showSidePanel(d); // Refresh side panel
        } else {
            alert("You cannot buy this house. Make sure a neighboring node is owned.");
        }
    });

    // Add functionality for selling
    d3.select("#sell-button").on("click", function (e) {
        e.stopPropagation(); // Prevent propagation
        sell(e, d);
        d3.select("#sell-button").property("disabled", true);
        d3.select("#buy-button").property("disabled", false);
        showSidePanel(d); // Refresh side panel
    });
}



function hideSidePanel() {
    d3.select("#side-panel").classed("hidden", true);
}

// Hide panel when clicking outside nodes
d3.select("body").on("click", function (e) {
    if (!e.target.closest(".node") && !e.target.closest("#side-panel")) {
        hideSidePanel();
    }
});

// Initial render
svg.call(zoom.transform, d3.zoomIdentity);

// Initial CP display
document.getElementById('total-cp').textContent = `Total CP Spent: ${calculateTotalCP()}`;

// Search and Filter Functionality
let searchInput = document.getElementById('node-search');
searchInput.addEventListener('input', function () {
    let query = searchInput.value.toLowerCase();
    nodes.style('opacity', d => (d.name.toLowerCase().includes(query) ? 1 : 0.1));
    edges.style('opacity', d => {
        let sourceMatch = d.source.name.toLowerCase().includes(query);
        let targetMatch = d.target.name.toLowerCase().includes(query);
        return sourceMatch || targetMatch ? 1 : 0.1;
    });
});