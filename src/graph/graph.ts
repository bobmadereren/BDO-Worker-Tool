import { MinPriorityQueue } from "@datastructures-js/priority-queue";

function path<Node extends { prev: Node | undefined }>(node: Node): Node[] {
    if (node.prev == undefined) return [node];
    let result = path(node.prev);
    result.push(node);
    return result;
}

/**
 * Cheapest path from a node to another node, where each node has a cost.
 * @param from Source node.
 * @param to Target nodes.
 * @param neighbors The neighbors of a node.
 * @param cost Cost of going through a node.
 * @returns The cheapest path including source and target node, together with the total cost.
 */
function shortestPath<T>(from: T, to: (vertex: T) => boolean, neighbors: (vertex: T) => Iterable<T>, cost: (vertex: T) => number): { path: T[], cost: number } | undefined {
    type Node = { vertex: T, dist: number, prev: Node | undefined };
    let marked = new Set<T>();
    let queue = new MinPriorityQueue<Node>(({ dist }) => dist);

    queue.enqueue({ vertex: from, dist: cost(from), prev: undefined });

    while (!queue.isEmpty()) {
        let node = queue.dequeue();
        if (to(node.vertex)) return { path: path(node).map(({ vertex }) => vertex), cost: node.dist };

        for (let neighbor of [...neighbors(node.vertex)].filter((neighbor) => !marked.has(neighbor))) {
            marked.add(neighbor);
            queue.enqueue({ vertex: neighbor, dist: node.dist + cost(neighbor), prev: node });
        }
    }
}

export { shortestPath };