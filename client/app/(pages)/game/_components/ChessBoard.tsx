'use client'
import { MOVE } from "@/app/messages/messages";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

// Map square string like "e4" to {row, col} indices (0-based, row 0 = rank 8)
function squareToCoords(sq: Square): { row: number; col: number } {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { row, col };
}

type AnimatingPiece = {
    type: PieceSymbol;
    color: Color;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
};

type DragState = {
    square: Square;
    piece: { type: PieceSymbol; color: Color };
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    squareSize: number;
};

export default function ChessBoard({ board, socket, setBoard, chess, playerColor, onMove }: {
    chess: Chess;
    setBoard: any;
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket | null;
    playerColor: string | null;
    onMove?: (moveInfo: { from: string; to: string; piece: string; notation: string }) => void;
}) {
    const [from, setFrom] = useState<null | Square>(null);
    const [legalMoves, setLegalMoves] = useState<Square[]>([]);
    const [animating, setAnimating] = useState<AnimatingPiece | null>(null);
    const [shakeSquare, setShakeSquare] = useState<Square | null>(null);
    const [drag, setDrag] = useState<DragState | null>(null);
    const [hoverSquare, setHoverSquare] = useState<Square | null>(null);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    // Check if a move is a pawn promotion
    const isPromotionMove = useCallback((fromSq: Square, toSq: Square): boolean => {
        const piece = chess.get(fromSq);
        if (!piece || piece.type !== 'p') return false;
        const toRank = toSq[1];
        if (piece.color === 'w' && toRank === '8') return true;
        if (piece.color === 'b' && toRank === '1') return true;
        return false;
    }, [chess]);

    // When "from" changes, compute legal moves
    useEffect(() => {
        if (from) {
            try {
                const moves = chess.moves({ square: from, verbose: true });
                setLegalMoves(moves.map(m => m.to as Square));
            } catch {
                setLegalMoves([]);
            }
        } else {
            setLegalMoves([]);
        }
    }, [from, chess]);

    // Execute a move (shared between click and drag)
    const executeMove = useCallback((fromSq: Square, toSq: Square, promotion?: PieceSymbol) => {
        const fromCoords = squareToCoords(fromSq);
        const toCoords = squareToCoords(toSq);
        const piece = chess.get(fromSq);
        if (!piece) {
            setFrom(null);
            return false;
        }

        // If this is a promotion move and no piece was chosen yet, show the picker
        if (isPromotionMove(fromSq, toSq) && !promotion) {
            setPendingPromotion({ from: fromSq, to: toSq });
            setFrom(null);
            return true; // not a failure — waiting for selection
        }

        const visualFromRow = playerColor === 'black' ? 7 - fromCoords.row : fromCoords.row;
        const visualFromCol = playerColor === 'black' ? 7 - fromCoords.col : fromCoords.col;
        const visualToRow = playerColor === 'black' ? 7 - toCoords.row : toCoords.row;
        const visualToCol = playerColor === 'black' ? 7 - toCoords.col : toCoords.col;

        try {
            chess.move({ from: fromSq, to: toSq, promotion });

            // Get the last move notation from history
            const history = chess.history();
            const notation = history[history.length - 1] || '';

            setAnimating({
                type: piece.type,
                color: piece.color,
                fromRow: visualFromRow,
                fromCol: visualFromCol,
                toRow: visualToRow,
                toCol: visualToCol,
            });

            socket?.send(JSON.stringify({
                type: MOVE,
                payload: { move: { from: fromSq, to: toSq, promotion } }
            }));

            setTimeout(() => {
                setBoard(chess.board());
                setAnimating(null);
                onMove?.({
                    from: fromSq,
                    to: toSq,
                    piece: piece.type,
                    notation,
                });
            }, 200);

            setFrom(null);
            return true;
        } catch {
            setShakeSquare(fromSq);
            setTimeout(() => setShakeSquare(null), 400);
            setFrom(null);
            return false;
        }
    }, [chess, playerColor, socket, setBoard, onMove, isPromotionMove]);

    // Click handler
    const handleSquareClick = useCallback((squareRepresentation: Square, square: { type: PieceSymbol; color: Color } | null) => {
        // Don't handle click if we just finished a drag
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            return;
        }

        const myColor = playerColor === 'white' ? 'w' : 'b';

        if (!from) {
            if (square && square.color === myColor) {
                setFrom(squareRepresentation);
            }
            return;
        }

        if (square && square.color === myColor && squareRepresentation !== from) {
            setFrom(squareRepresentation);
            return;
        }

        if (squareRepresentation === from) {
            setFrom(null);
            return;
        }

        executeMove(from, squareRepresentation);
    }, [from, playerColor, executeMove]);

    // Get square from client coordinates
    const getSquareFromPoint = useCallback((clientX: number, clientY: number): Square | null => {
        if (!boardRef.current) return null;
        const rect = boardRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const sqSize = rect.width / 8;
        let col = Math.floor(x / sqSize);
        let row = Math.floor(y / sqSize);
        if (col < 0 || col > 7 || row < 0 || row > 7) return null;
        // Convert visual coords back to board coords based on orientation
        const boardRow = playerColor === 'black' ? 7 - row : row;
        const boardCol = playerColor === 'black' ? 7 - col : col;
        return (String.fromCharCode(97 + boardCol) + (8 - boardRow)) as Square;
    }, [playerColor]);

    // --- Pointer-based drag handlers ---
    const handlePointerDown = useCallback((e: React.PointerEvent, squareRepresentation: Square, square: { type: PieceSymbol; color: Color } | null) => {
        const myColor = playerColor === 'white' ? 'w' : 'b';
        if (!square || square.color !== myColor) return;
        if (!boardRef.current) return;

        const rect = boardRef.current.getBoundingClientRect();
        const sqSize = rect.width / 8;

        // Only store drag start info — don't call setFrom yet
        // setFrom will be called by handlePointerMove once the drag threshold is exceeded,
        // or by handleSquareClick for a normal tap
        setDrag({
            square: squareRepresentation,
            piece: { type: square.type, color: square.color },
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            squareSize: sqSize,
        });
        isDraggingRef.current = false;

        // Capture pointer for smooth dragging
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, [playerColor]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!drag) return;

        const dx = Math.abs(e.clientX - drag.startX);
        const dy = Math.abs(e.clientY - drag.startY);
        // Only start visual drag after moving a bit (3px threshold)
        if (dx > 3 || dy > 3) {
            if (!isDraggingRef.current) {
                isDraggingRef.current = true;
                // Show legal moves when drag starts
                setFrom(drag.square);
            }
        }

        setDrag(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

        // Update hover square for highlighting
        if (isDraggingRef.current) {
            const sq = getSquareFromPoint(e.clientX, e.clientY);
            setHoverSquare(sq);
        }
    }, [drag, getSquareFromPoint]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!drag) return;

        const wasDrag = isDraggingRef.current;
        const targetSquare = getSquareFromPoint(e.clientX, e.clientY);

        setDrag(null);
        setHoverSquare(null);

        if (wasDrag) {
            // Was a real drag — handle here, skip the upcoming click event
            if (targetSquare && targetSquare !== drag.square) {
                const success = executeMove(drag.square, targetSquare);
                if (!success) {
                    // Failed drag — keep piece selected so user can retry via click
                    setFrom(drag.square);
                }
            } else {
                // Dropped back on same square or outside — keep selected
                setFrom(drag.square);
            }
            // isDraggingRef stays true so the click handler skips
        } else {
            // Wasn't a drag (just a tap) — let the click handler deal with it
            isDraggingRef.current = false;
        }
    }, [drag, getSquareFromPoint, executeMove]);

    // Handle promotion piece selection
    const handlePromotionSelect = useCallback((piece: PieceSymbol) => {
        if (!pendingPromotion) return;
        executeMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
    }, [pendingPromotion, executeMove]);

    const cancelPromotion = useCallback(() => {
        setPendingPromotion(null);
    }, []);

    // Compute drag ghost position
    const dragGhostStyle = drag && isDraggingRef.current ? (() => {
        if (!boardRef.current) return undefined;
        const rect = boardRef.current.getBoundingClientRect();
        const size = drag.squareSize;
        return {
            position: 'absolute' as const,
            width: size,
            height: size,
            left: drag.currentX - rect.left - size / 2,
            top: drag.currentY - rect.top - size / 2,
            zIndex: 50,
            pointerEvents: 'none' as const,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
            transform: 'scale(1.1)',
        };
    })() : null;

    return (
        <div
            ref={boardRef}
            className="w-full max-w-[576px] mx-auto relative rounded-sm overflow-hidden shadow-lg select-none touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Click-move animated piece overlay */}
            {animating && !drag && (
                <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                        width: `${100 / 8}%`,
                        height: `${100 / 8}%`,
                        left: `${(animating.fromCol * 100) / 8}%`,
                        top: `${(animating.fromRow * 100) / 8}%`,
                        transition: 'left 0.2s ease, top 0.2s ease',
                    }}
                    ref={(el) => {
                        if (el) {
                            requestAnimationFrame(() => {
                                el.style.left = `${(animating.toCol * 100) / 8}%`;
                                el.style.top = `${(animating.toRow * 100) / 8}%`;
                            });
                        }
                    }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <Image
                            className="w-[75%] h-[75%] object-contain"
                            alt={animating.type}
                            width={48}
                            height={48}
                            src={`/chessPieces/${animating.color === 'b' ? `${animating.type}.png` : `${animating.type.toUpperCase()}-white.png`}`}
                        />
                    </div>
                </div>
            )}

            {/* Drag ghost piece */}
            {drag && isDraggingRef.current && dragGhostStyle && (
                <div style={dragGhostStyle}>
                    <div className="w-full h-full flex items-center justify-center">
                        <Image
                            className="w-[75%] h-[75%] object-contain"
                            alt={drag.piece.type}
                            width={48}
                            height={48}
                            src={`/chessPieces/${drag.piece.color === 'b' ? `${drag.piece.type}.png` : `${drag.piece.type.toUpperCase()}-white.png`}`}
                        />
                    </div>
                </div>
            )}

            {board.map((_, _i) => {
                const i = playerColor === "black" ? 7 - _i : _i;
                const row = board[i];
                return (
                    <div key={i} className="flex">
                        {row.map((_, _j) => {
                            const j = playerColor === "black" ? 7 - _j : _j;
                            const square = row[j];
                            const squareRepresentation = (String.fromCharCode(97 + (j % 8)) + "" + (8 - i)) as Square;

                            const isSelected = from === squareRepresentation;
                            const isLegalTarget = legalMoves.includes(squareRepresentation);
                            const isCapture = isLegalTarget && square !== null;
                            const isShaking = shakeSquare === squareRepresentation;
                            const isDark = (i + j) % 2 === 0;
                            const isDragHover = hoverSquare === squareRepresentation && drag && squareRepresentation !== drag.square;

                            // Hide piece on the origin square while dragging
                            const isDragOrigin = drag && isDraggingRef.current && drag.square === squareRepresentation;

                            // Hide piece at animation origin
                            const animFromSquare = animating
                                ? (String.fromCharCode(97 + (playerColor === 'black' ? 7 - animating.fromCol : animating.fromCol)) + "" + (8 - (playerColor === 'black' ? 7 - animating.fromRow : animating.fromRow))) as Square
                                : null;
                            const shouldHidePiece = (animating && squareRepresentation === animFromSquare) || isDragOrigin;

                            return (
                                <div
                                    key={j}
                                    className={`
                                        flex-1 aspect-square flex justify-center items-center cursor-pointer relative
                                        transition-colors duration-150
                                        ${isDark
                                            ? isSelected ? 'bg-yellow-600' : isDragHover && isLegalTarget ? 'bg-yellow-700/70' : 'bg-green-700'
                                            : isSelected ? 'bg-yellow-300' : isDragHover && isLegalTarget ? 'bg-yellow-200/70' : 'bg-amber-200'
                                        }
                                        ${isShaking ? 'animate-shake' : ''}
                                    `}
                                    onClick={() => handleSquareClick(squareRepresentation, square)}
                                    onPointerDown={(e) => handlePointerDown(e, squareRepresentation, square)}
                                >
                                    {/* Legal move indicator */}
                                    {isLegalTarget && !isCapture && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                            <div className="w-[30%] h-[30%] rounded-full bg-black/20" />
                                        </div>
                                    )}

                                    {/* Capture indicator — ring on the edges */}
                                    {isLegalTarget && isCapture && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                            <div className="w-full h-full rounded-full border-[5px] border-black/20 box-border" />
                                        </div>
                                    )}

                                    {/* Piece */}
                                    {square && !shouldHidePiece ? (
                                        <Image
                                            className={`w-[75%] h-[75%] object-contain relative z-0 ${isDragOrigin ? 'opacity-0' : ''}`}
                                            alt={square.type}
                                            width={48}
                                            height={48}
                                            src={`/chessPieces/${square.color === 'b' ? `${square.type}.png` : `${square.type.toUpperCase()}-white.png`}`}
                                            draggable={false}
                                        />
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                )
            })}

            {/* Pawn Promotion Picker */}
            {pendingPromotion && (() => {
                const myColor = playerColor === 'white' ? 'w' : 'b';
                const toCoords = squareToCoords(pendingPromotion.to);
                const visualCol = playerColor === 'black' ? 7 - toCoords.col : toCoords.col;
                // Show picker from the promotion rank, expanding downward for white, upward for black
                const isWhite = playerColor === 'white';
                const visualStartRow = isWhite ? 0 : 4;
                const promotionPieces: PieceSymbol[] = ['q', 'r', 'b', 'n'];

                return (
                    <>
                        {/* Backdrop to cancel */}
                        <div
                            className="absolute inset-0 z-40 bg-black/30"
                            onClick={cancelPromotion}
                        />
                        {/* Piece options */}
                        <div
                            className="absolute z-50 flex flex-col shadow-xl rounded overflow-hidden"
                            style={{
                                left: `${(visualCol * 100) / 8}%`,
                                top: `${(visualStartRow * 100) / 8}%`,
                                width: `${100 / 8}%`,
                            }}
                        >
                            {promotionPieces.map((p) => (
                                <button
                                    key={p}
                                    className="aspect-square flex items-center justify-center bg-white hover:bg-amber-200 transition-colors border-b border-gray-200 last:border-b-0"
                                    onClick={() => handlePromotionSelect(p)}
                                >
                                    <Image
                                        className="w-[75%] h-[75%] object-contain"
                                        alt={p}
                                        width={48}
                                        height={48}
                                        src={`/chessPieces/${myColor === 'b' ? `${p}.png` : `${p.toUpperCase()}-white.png`}`}
                                    />
                                </button>
                            ))}
                        </div>
                    </>
                );
            })()}
        </div>
    )
}
