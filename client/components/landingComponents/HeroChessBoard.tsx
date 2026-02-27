'use client';

import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

const PIECE_IMAGE: Record<string, string> = {
    wp: '/chessPieces/P-white.png',
    wn: '/chessPieces/N-white.png',
    wb: '/chessPieces/B-white.png',
    wr: '/chessPieces/R-white.png',
    wq: '/chessPieces/Q-white.png',
    wk: '/chessPieces/K-white.png',
    bp: '/chessPieces/p.png',
    bn: '/chessPieces/n.png',
    bb: '/chessPieces/b.png',
    br: '/chessPieces/r.png',
    bq: '/chessPieces/q.png',
    bk: '/chessPieces/k.png',
};

type AnimatingPiece = {
    key: string;
    type: PieceSymbol;
    color: Color;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
};

function squareToCoords(sq: string): { row: number; col: number } {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { row, col };
}

export default function HeroChessBoard() {
    const chessRef = useRef(new Chess());
    const [board, setBoard] = useState(chessRef.current.board());
    const [animating, setAnimating] = useState<AnimatingPiece | null>(null);
    const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
    const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const makeRandomMove = useCallback(() => {
        const chess = chessRef.current;
        if (chess.isGameOver()) {
            // Reset the game when it's over
            chess.reset();
            setBoard(chess.board());
            setLastMove(null);
            return;
        }

        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return;

        const move = moves[Math.floor(Math.random() * moves.length)];
        const from = squareToCoords(move.from);
        const to = squareToCoords(move.to);

        // Start animation
        setAnimating({
            key: `${move.from}-${move.to}-${Date.now()}`,
            type: move.piece,
            color: move.color,
            fromRow: from.row,
            fromCol: from.col,
            toRow: to.row,
            toCol: to.col,
        });

        // After animation, apply the move
        animTimeoutRef.current = setTimeout(() => {
            chess.move(move);
            setBoard(chess.board());
            setLastMove({ from: move.from, to: move.to });
            setAnimating(null);
        }, 400);
    }, []);

    useEffect(() => {
        // Make a move every 1.2 seconds
        moveIntervalRef.current = setInterval(makeRandomMove, 1200);

        return () => {
            if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
            if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
        };
    }, [makeRandomMove]);

    return (
        <div className="w-full aspect-square max-w-[280px] grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-lg relative">
            {board.map((row, rowIdx) =>
                row.map((square, colIdx) => {
                    const isLight = (rowIdx + colIdx) % 2 === 0;
                    const sqName = String.fromCharCode(97 + colIdx) + (8 - rowIdx);
                    const isLastMoveSquare =
                        lastMove && (lastMove.from === sqName || lastMove.to === sqName);

                    // Hide the piece at the source during animation
                    const isAnimatingFrom =
                        animating &&
                        animating.fromRow === rowIdx &&
                        animating.fromCol === colIdx;

                    // Also hide captured piece at destination during animation
                    const isAnimatingTo =
                        animating &&
                        animating.toRow === rowIdx &&
                        animating.toCol === colIdx;

                    return (
                        <div
                            key={`${rowIdx}-${colIdx}`}
                            className={`relative flex items-center justify-center ${
                                isLight
                                    ? 'bg-amber-100 dark:bg-amber-200'
                                    : 'bg-green-700 dark:bg-green-800'
                            } ${isLastMoveSquare ? (isLight ? 'bg-yellow-200 dark:bg-yellow-300' : 'bg-green-500 dark:bg-green-600') : ''}`}
                        >
                            {square && !isAnimatingFrom && !isAnimatingTo && (
                                <Image
                                    src={PIECE_IMAGE[`${square.color}${square.type}`]}
                                    alt={`${square.color}${square.type}`}
                                    width={40}
                                    height={40}
                                    className="w-[85%] h-[85%] object-contain pointer-events-none select-none"
                                    draggable={false}
                                />
                            )}
                            {/* Show piece at destination that will be captured (keep visible until animation ends) */}
                            {square && isAnimatingTo && !isAnimatingFrom && (
                                <Image
                                    src={PIECE_IMAGE[`${square.color}${square.type}`]}
                                    alt={`${square.color}${square.type}`}
                                    width={40}
                                    height={40}
                                    className="w-[85%] h-[85%] object-contain pointer-events-none select-none opacity-60"
                                    draggable={false}
                                />
                            )}
                        </div>
                    );
                })
            )}

            {/* Animating piece overlay */}
            {animating && (
                <div
                    className="absolute pointer-events-none z-10 transition-all duration-400 ease-in-out"
                    style={{
                        width: '12.5%',
                        height: '12.5%',
                        left: `${animating.fromCol * 12.5}%`,
                        top: `${animating.fromRow * 12.5}%`,
                        transform: `translate(${(animating.toCol - animating.fromCol) * 100}%, ${(animating.toRow - animating.fromRow) * 100}%)`,
                    }}
                >
                    <div className="w-full h-full flex items-center justify-center">
                        <Image
                            src={PIECE_IMAGE[`${animating.color}${animating.type}`]}
                            alt="moving piece"
                            width={40}
                            height={40}
                            className="w-[85%] h-[85%] object-contain drop-shadow-lg"
                            draggable={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
