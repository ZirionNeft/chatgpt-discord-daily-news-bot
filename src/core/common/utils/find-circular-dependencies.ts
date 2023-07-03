export interface GraphResult<Node> {
  graph: Map<Node, Node[]>;
  circularDependencies: Node[][];
}

export function findCircularDependencies<Node extends string | symbol | Type>(
  graph: Map<Node, Node[]>,
): GraphResult<Node> {
  const visited: Set<Node> = new Set();
  const stack: Set<Node> = new Set();
  const result: Node[][] = [];
  const circularDependencies: Node[][] = [];

  function dfs(node: Node) {
    visited.add(node);
    stack.add(node);

    const dependencies = graph.get(node);
    if (dependencies) {
      for (const dependency of dependencies) {
        if (!visited.has(dependency)) {
          dfs(dependency);
        } else if (stack.has(dependency)) {
          result.push(Array.from(stack));
        }
      }
    }

    stack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  for (const cycle of result) {
    const lastNode = cycle[cycle.length - 1];
    const firstIndex = cycle.findIndex((node) => node === lastNode);
    circularDependencies.push(cycle.slice(firstIndex));
  }

  return {
    graph,
    circularDependencies,
  };
}
