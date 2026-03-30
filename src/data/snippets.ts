export interface Snippet {
  id: string;
  title: string;
  tags: string[];
  code: string;
}

export const snippets: Snippet[] = [
  {
    id: "trie",
    title: "Trie (Prefix Tree)",
    tags: ["string", "tree", "prefix"],
    code: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_word = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_word

    def startsWith(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True`
  },
  {
    id: "union_find",
    title: "Union Find (Disjoint Set)",
    tags: ["graph", "union_find"],
    code: `class UnionFind:
    def __init__(self, size):
        self.root = [i for i in range(size)]
        self.rank = [1] * size
        self.count = size

    def find(self, x):
        if x == self.root[x]:
            return x
        # Path compression
        self.root[x] = self.find(self.root[x])
        return self.root[x]

    def union(self, x, y):
        rootX = self.find(x)
        rootY = self.find(y)
        if rootX != rootY:
            # Union by rank
            if self.rank[rootX] > self.rank[rootY]:
                self.root[rootY] = rootX
            elif self.rank[rootX] < self.rank[rootY]:
                self.root[rootX] = rootY
            else:
                self.root[rootY] = rootX
                self.rank[rootX] += 1
            self.count -= 1
            return True
        return False`
  },
  {
    id: "grid_bfs",
    title: "Grid BFS (Shortest Path)",
    tags: ["graph", "bfs", "matrix"],
    code: `import collections

def bfs_grid(grid):
    if not grid or not grid[0]:
        return 0
    
    ROWS, COLS = len(grid), len(grid[0])
    queue = collections.deque([(0, 0)]) # start position
    visited = set([(0, 0)])
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    steps = 0
    
    while queue:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            
            # Process node here if needed
            
            for dr, dc in directions:
                nr, nc = r + dr, c + dc
                if 0 <= nr < ROWS and 0 <= nc < COLS and (nr, nc) not in visited:
                    visited.add((nr, nc))
                    queue.append((nr, nc))
        steps += 1
        
    return steps`
  }
];
