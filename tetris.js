// 캔버스 및 컨텍스트 설정
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

// 게임 상태 변수
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;
let gameStarted = false;
let dropInterval = 1000; // 블록이 떨어지는 속도 (밀리초)
let lastTime = 0;
let dropCounter = 0;

// 게임 보드 설정
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const EMPTY = 0;

// 색상 설정
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// 테트로미노 형태 정의
const SHAPES = [
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// 게임판 생성
let board = createBoard();
let player = createPlayer();
let nextPiece = getRandomPiece();

// 게임 보드 생성
function createBoard() {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
    return board;
}

// 플레이어 객체 생성
function createPlayer() {
    return {
        pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
        matrix: getRandomPiece(),
        score: 0
    };
}

// 랜덤 테트로미노 가져오기
function getRandomPiece() {
    const pieceIndex = Math.floor(Math.random() * SHAPES.length);
    return JSON.parse(JSON.stringify(SHAPES[pieceIndex]));
}

// 게임판 그리기
function drawBoard() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
    
    drawNextPiece();
}

// 다음 피스 표시
function drawNextPiece() {
    const nextPieceCanvas = document.getElementById('next-piece-canvas');
    const container = document.getElementById('next-piece');
    
    if (!nextPieceCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        canvas.id = 'next-piece-canvas';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const size = BLOCK_SIZE * 0.8;
        const offsetX = (canvas.width - nextPiece[0].length * size) / 2;
        const offsetY = (canvas.height - nextPiece.length * size) / 2;
        
        nextPiece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
                    
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);
                }
            });
        });
    } else {
        const ctx = nextPieceCanvas.getContext('2d');
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        const size = BLOCK_SIZE * 0.8;
        const offsetX = (nextPieceCanvas.width - nextPiece[0].length * size) / 2;
        const offsetY = (nextPieceCanvas.height - nextPiece.length * size) / 2;
        
        nextPiece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value];
                    ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
                    
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(offsetX + x * size, offsetY + y * size, size, size);
                }
            });
        });
    }
}

// 매트릭스 그리기
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(
                    (offset.x + x) * BLOCK_SIZE,
                    (offset.y + y) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
                
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    (offset.x + x) * BLOCK_SIZE,
                    (offset.y + y) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        });
    });
}

// 충돌 확인
function collide(board, player) {
    const m = player.matrix;
    const o = player.pos;
    
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && 
                (board[y + o.y] === undefined || 
                 board[y + o.y][x + o.x] === undefined ||
                 board[y + o.y][x + o.x] !== 0)) {
                return true;
            }
        }
    }
    
    return false;
}

// 회전 기능
function rotate(matrix, dir) {
    const result = [];
    for (let y = 0; y < matrix.length; ++y) {
        result.push([]);
        for (let x = 0; x < matrix[y].length; ++x) {
            result[y][x] = 0;
        }
    }
    
    if (dir > 0) { // 시계 방향
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                result[x][matrix.length - 1 - y] = matrix[y][x];
            }
        }
    } else { // 반시계 방향
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                result[matrix.length - 1 - x][y] = matrix[y][x];
            }
        }
    }
    
    return result;
}

// 플레이어 회전
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    
    const originalMatrix = player.matrix;
    player.matrix = rotate(player.matrix, dir);
    
    // 벽에 닿았을 때 조정
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        
        // 회전이 불가능하면 원래대로 복귀
        if (offset > originalMatrix[0].length) {
            player.matrix = originalMatrix;
            player.pos.x = pos;
            return;
        }
    }
}

// 아래로 이동
function playerDrop() {
    player.pos.y++;
    
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        clearLines();
        updateScore();
    }
    
    dropCounter = 0;
}

// 하드 드롭 (즉시 바닥으로 이동)
function playerHardDrop() {
    while (!collide(board, player)) {
        player.pos.y++;
    }
    
    player.pos.y--;
    merge(board, player);
    playerReset();
    clearLines();
    updateScore();
    
    dropCounter = 0;
}

// 좌우 이동
function playerMove(dir) {
    player.pos.x += dir;
    
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

// 게임판과 테트로미노 병합
function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 라인 제거
function clearLines() {
    let linesCleared = 0;
    
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        // 라인이 꽉 찼을 경우
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        
        // 레벨 업
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = lines;
    }
}

// 플레이어 리셋
function playerReset() {
    player.matrix = nextPiece;
    nextPiece = getRandomPiece();
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    
    // 게임 오버 확인
    if (collide(board, player)) {
        gameOver = true;
        alert('게임 오버! 점수: ' + score);
    }
}

// 점수 업데이트
function updateScore() {
    document.getElementById('score').textContent = score;
}

// 업데이트 함수
function update(time = 0) {
    if (gameOver || !gameStarted || isPaused) {
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    drawBoard();
    requestAnimationFrame(update);
}

// 키보드 이벤트
document.addEventListener('keydown', event => {
    if (gameOver || !gameStarted || isPaused) {
        return;
    }
    
    switch (event.key) {
        case 'ArrowLeft': // 왼쪽 화살표
            playerMove(-1);
            break;
        case 'ArrowRight': // 오른쪽 화살표
            playerMove(1);
            break;
        case 'ArrowDown': // 아래쪽 화살표
            playerDrop();
            break;
        case 'ArrowUp': // 위쪽 화살표
            playerRotate(1);
            break;
        case ' ': // 스페이스바
            playerHardDrop();
            break;
        case 'p': // P
        case 'P':
            togglePause();
            break;
    }
});

// 일시정지 토글
function togglePause() {
    isPaused = !isPaused;
    if (!isPaused) {
        lastTime = performance.now();
        requestAnimationFrame(update);
    }
}

// 게임 시작
function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        gameOver = false;
        isPaused = false;
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        dropCounter = 0;
        
        board = createBoard();
        player = createPlayer();
        nextPiece = getRandomPiece();
        
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = lines;
        
        lastTime = performance.now();
        update(lastTime);
    }
}

// 게임 재시작
function resetGame() {
    gameStarted = false;
    gameOver = false;
    isPaused = false;
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    dropCounter = 0;
    
    board = createBoard();
    player = createPlayer();
    nextPiece = getRandomPiece();
    
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
    
    startGame();
}

// 버튼 이벤트 리스너
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('pause-button').addEventListener('click', togglePause);
document.getElementById('reset-button').addEventListener('click', resetGame);

// 초기 보드 그리기
drawBoard(); 