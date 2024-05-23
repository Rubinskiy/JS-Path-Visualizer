// Initialize Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Grid parameters
const gridSize = 10;
const grid = [];
const cubeSize = 1;
let startPoint = null;
let endPoint = null;
let isRunning = false;

// Create the 3D grid
for (let x = 0; x < gridSize; x++) {
    grid[x] = [];
    for (let y = 0; y < gridSize; y++) {
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const lineGeometry = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(lineGeometry, lineMaterial);
        line.position.set(x - gridSize / 2, y - gridSize / 2, 0);
        scene.add(line);
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x - gridSize / 2, y - gridSize / 2, 0);
        scene.add(cube);
        grid[x][y] = { cube, isObstacle: false };
    }
}

camera.position.z = 9;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// Utility functions
function resetGrid() {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            grid[x][y].cube.material.color.set(0x00ff00);
            grid[x][y].isObstacle = false;
        }
    }
    startPoint = null;
    endPoint = null;
    isRunning = false;
}

function markCube(position, color) {
    grid[position.x][position.y].cube.material.color.set(color);
}

function addNumberToCube(position, number) {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new THREE.TextGeometry(number.toString(), {
            font: font,
            size: 0.4,
            height: 0.1
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(position.x - gridSize / 2 - 0.2, position.y - gridSize / 2 - 0.2, 0.5);
        scene.add(textMesh);
    });
}

function markPath(cameFrom, end) {
    let current = end;
    let distance = 0;
    while (current !== null) {
        markCube(current, 0xffffff);
        addNumberToCube(current, distance);
        current = cameFrom[`${current.x},${current.y}`];
        distance++;
    }
    alert(`Path found! Distance: ${distance - 1} blocks.`);
}


function getNeighbors(position) {
    const neighbors = [];
    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];
    directions.forEach(dir => {
        const nx = position.x + dir.x;
        const ny = position.y + dir.y;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && !grid[nx][ny].isObstacle) {
            neighbors.push({ x: nx, y: ny });
        }
    });
    return neighbors;
}

// Pathfinding algorithms
async function bfs(start, end) {
    const queue = [start];
    const visited = new Set();
    const cameFrom = {};
    visited.add(`${start.x},${start.y}`);
    cameFrom[`${start.x},${start.y}`] = null

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === end.x && current.y === end.y) {
            markCube(current, 0x0000ff);
            markPath(cameFrom, end);
            document.getElementById('ins').innerText = 'Path found using BFS!';
            return true;
        }
        markCube(current, 0xff0000);
        await new Promise(resolve => setTimeout(resolve, 100));

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push(neighbor);
                cameFrom[key] = current;
            }
        }
    }
    document.getElementById('ins').innerText = 'No path found using BFS!';
    return false;
}

async function dfs(start, end) {
    const stack = [start];
    const visited = new Set();
    const cameFrom = {};
    visited.add(`${start.x},${start.y}`);
    cameFrom[`${start.x},${start.y}`] = null;

    while (stack.length > 0) {
        const current = stack.pop();
        if (current.x === end.x && current.y === end.y) {
            markCube(current, 0x0000ff);
            markPath(cameFrom, end);
            document.getElementById('ins').innerText = 'Path found using DFS!';
            return true;
        }
        markCube(current, 0xff0000);
        await new Promise(resolve => setTimeout(resolve, 100));

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const key = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(key)) {
                visited.add(key);
                stack.push(neighbor);
                cameFrom[key] = current;
            }
        }
    }
    document.getElementById('ins').innerText = 'No path found using DFS!';
    return false;
}

async function dijkstra(start, end) {
    const pq = [{ position: start, cost: 0 }];
    const distances = Array.from({ length: gridSize }, () => Array(gridSize).fill(Infinity));
    const cameFrom = {};
    distances[start.x][start.y] = 0;
    cameFrom[`${start.x},${start.y}`] = null;

    while (pq.length > 0) {
        pq.sort((a, b) => a.cost - b.cost);
        const { position, cost } = pq.shift();
        if (position.x === end.x && position.y === end.y) {
            markCube(position, 0x0000ff);
            markPath(cameFrom, end);
            document.getElementById('ins').innerText = 'Path found using Dijkstra\'s!';
            return true;
        }
        markCube(position, 0xff0000);
        await new Promise(resolve => setTimeout(resolve, 100));

        const neighbors = getNeighbors(position);
        for (const neighbor of neighbors) {
            const newCost = cost + 1;
            if (newCost < distances[neighbor.x][neighbor.y]) {
                distances[neighbor.x][neighbor.y] = newCost;
                pq.push({ position: neighbor, cost: newCost });
                cameFrom[`${neighbor.x},${neighbor.y}`] = position;
            }
        }
    }
    document.getElementById('ins').innerText = 'No path found using Dijkstra\'s!';
    return false;
}

// Event listeners for control buttons
document.getElementById('bfs').addEventListener('click', () => {
    if (!isRunning && startPoint && endPoint) {
        isRunning = true;
        bfs(startPoint, endPoint).then(() => isRunning = false);
    }
});

document.getElementById('dfs').addEventListener('click', () => {
    if (!isRunning && startPoint && endPoint) {
        isRunning = true;
        dfs(startPoint, endPoint).then(() => isRunning = false);
    }
});

document.getElementById('dijkstra').addEventListener('click', () => {
    if (!isRunning && startPoint && endPoint) {
        isRunning = true;
        dijkstra(startPoint, endPoint).then(() => isRunning = false);
    }
});

// Default reset button
document.getElementById('reset').addEventListener('click', resetGrid);

// Add interactivity for setting start, end, and obstacles
renderer.domElement.addEventListener('click', (event) => {
    if (isRunning) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const vector = new THREE.Vector3(mouseX, mouseY, 0.5).unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    const x = Math.round(pos.x + gridSize / 2);
    const y = Math.round(pos.y + gridSize / 2);

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        if (!startPoint) {
            startPoint = { x, y };
            markCube(startPoint, 0x0000ff);
        } else if (!endPoint) {
            endPoint = { x, y };
            markCube(endPoint, 0xffff00);
        } else {
            grid[x][y].isObstacle = !grid[x][y].isObstacle;
            markCube({ x, y }, grid[x][y].isObstacle ? 0x000000 : 0x00ff00);
        }
    }
});
