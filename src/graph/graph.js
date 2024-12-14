import { MinPriorityQueue } from "@datastructures-js/priority-queue";

/**
 * Cheapest path from a node to another node, where each node has a cost.
 * @param {T} source Source node.
 * @param {(node: T) => boolean} target Whether a node is a target.
 * @param {(node: T) => Iterable<T>} neighbors The neighbors of a node.
 * @param {(node: T) => number} cost Cost of a node.
 * @returns {T[]} The cheapest path including source and target node.
 */
function shortestPath(source, target, neighbors, cost) {
    let prev = new Map();
    let dist = new Map();
    let queue = new MinPriorityQueue(node => dist.get(node));

    let path = (node) => {
        if (!node) return [];
        let result = path(prev.get(node));
        result.push(node);
        return result;
    }

    queue.enqueue(source);
    dist.set(source, cost(source));

    while (!queue.isEmpty()) {
        let node = queue.dequeue();
        if (target(node)) return path(node);

        for (let neighbor of neighbors(node))
            if (!dist.has(neighbor)) {
                prev.set(neighbor, node);
                dist.set(neighbor, dist.get(node) + cost(neighbor));
                queue.enqueue(neighbor);
            }
    }
}

/**
 * All dependants of a node.
 * 
 * A node ```B``` is dependent on a node ```A``` if ```B = A``` or if ```B``` is not connected to a root in ```Graph - A```.
 * @param {T} node The node for which to find dependants.
 * @param {(node: T) => Iterable<T>} neighbors Neighbors of a node.
 * @param {(node: T) => Boolean} root Whether a node is a root or not.
 * @returns {Set<T>}
 */
function dependants(node, neighbors, root) {

    let dependants = [node];
    let sources = [...neighbors(node)];

    while (sources.length > 0) {
        let [source] = sources;
        let marked = new Set();
        let stack = [source];

        while (stack.length > 0) {
            let n = stack.pop();
            if (marked.has(n)) continue;
            marked.add(n);

            for (let neighbor of neighbors(n))
                if (neighbor != node)
                    stack.push(neighbor);
        }

        sources = sources.filter(source => !marked.has(source));

        if (![...marked].some(root)) dependants.push(...marked);
    }

    return dependants;
}

export { shortestPath, dependants };
