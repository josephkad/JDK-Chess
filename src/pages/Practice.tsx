import { useEffect, useRef, useState } from 'react';
import '../styles/practice.css'
import { Chessboard, type PieceDropHandlerArgs, type PieceHandlerArgs, type SquareHandlerArgs } from "react-chessboard";
import { Chess, type Square } from 'chess.js';

import captureSound from '../sounds/capture.mp3'
import moveSound from '../sounds/move-self.mp3'
import castleSound from '../sounds/castle.mp3'
import checkSound from '../sounds/move-check.mp3'
import checkmateSound from '../sounds/game-end.mp3'
import promoteSound from '../sounds/promote.mp3'
import { useUserVar } from '../userVar';

type moveHistory = {
  [key: number] : {
    w: string;
    b: string | null;
  };
};

type movePreview = {
  index: number,
  white: boolean,
}

type redS = {
  [key : string] : {
    backgroundColor: string,
  } | null
}

function PracticePage() {
  // Variables
  const captureAudio = useRef<HTMLAudioElement | null>(null);
  const moveAudio = useRef<HTMLAudioElement | null>(null);
  const castleAudio = useRef<HTMLAudioElement | null>(null);
  const checkAudio = useRef<HTMLAudioElement | null>(null);
  const checkmateAudio = useRef<HTMLAudioElement | null>(null);
  const promoteAudio = useRef<HTMLAudioElement | null>(null);

  const historyRef = useRef<HTMLDivElement>(null);
  const defaultGame = new Chess().fen();
  const engineRef = useRef<any>(null)
  const evalRef = useRef<any>(null)
  const gameRef = useRef(new Chess());
  const moveRef = useRef(movePiece)
  const {user, _} = useUserVar();
  const userStats : any = useState(user?.stats? user.stats[0] : null);

  // States
  const [game, setGame] = useState(new Chess());
  const [optionSquares, setOptionSquares] = useState({});
  const [selectedSquare, setSelectedSquare] : any = useState('');
  const selectedSquareRef = useRef<any>('');
  const [lastMove, setLastMove] = useState<{from: string;to: string;} | null>(null);
  const [history, setHistory] = useState<moveHistory>({});
  const [preview, setPreview] = useState<movePreview | null>(null);
  const [redSquares, setRedSquare] = useState<redS>({});
  const [engineTurn, setEngineTurn] = useState(false);
  const [bordOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [evalSquare, setEvalSquare] = useState({});

  //  Functions
  function playSound(sound : any) {
    sound.current.currentTime = 0;
    sound.current.play();
  }

  function decideAudio(checkmate : boolean, check : boolean, promotion : boolean, captured : any, castled : boolean) {
    const arg = (!checkmate && !check && !promotion)

    if (checkmate) {
      playSound(checkmateAudio);
    }

    if (check) {
      playSound(checkAudio);
    }

    if (promotion && !check) {
      playSound(promoteAudio)
    }

    if (arg) {
      if (captured) {
        playSound(captureAudio);
      } else if (castled) {
        playSound(castleAudio);
      } else {
        playSound(moveAudio);
      }
    }
  }
  
  function movePiece({sourceSquare, targetSquare} : PieceDropHandlerArgs, fromEngine = false) {
    if (!targetSquare || (engineTurn && !fromEngine) ) {
        return false;
    }
    const gameCopy = new Chess(gameRef.current.fen()) //new Chess(game.fen());
    let move;
    let beforeEval;
    let afterEval;
    let wasWhite = false;
    const beforeFen = gameRef.current.fen()

    try {
        move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q"
        });
    } catch (err) {
        return false;
    }

    if (move) {
      if (move) {
          setLastMove({
              from: move.from,
              to: move.to
          });
      }

      const newLength = Object.keys(history).length + 1
      let white = true

      if (history[newLength - 1] && history[newLength - 1].b == null) {
        setHistory(prev => ({
          ...prev,
          [newLength - 1]: {
            ...prev[newLength - 1],
            b: move.san
          }
        }))

        white = false
      } else {        
        setHistory(prev => ({
          ...prev,
          [newLength]: {
            w: move.san,
            b: null,
          }
        }))
      }

      setPreview({
        index: white ? newLength : newLength - 1,
        white: white
      })

      const checkmate = gameCopy.isCheckmate();
      const check = gameCopy.isCheck();
      const promotion = move.promotion == 'q';
      const captured = move.captured;
      const castled = move.flags == 'k' || move.flags == 'q';

      decideAudio(checkmate, check, promotion, captured, castled);
      setEngineTurn(!fromEngine? true : false)
      wasWhite = white;
    }

    const afterFen = gameCopy.fen()
    
    
    setGame(gameCopy);
    gameRef.current = gameCopy;
    setOptionSquares({});


    if (!engineTurn) {
      async function scoreMoves() {        
        beforeEval = await evaluatePosition(beforeFen);
        afterEval = await evaluatePosition(afterFen);
        const evalLoss = Math.max(
            0,
            getEvalLoss(beforeEval, afterEval)
        );

        if (lastMove) {
          setEvalSquare({
            [lastMove.to]: {
              background: "rgba(0,255,0,.3)",
              backgroundImage: "url('/icons/brilliant.svg')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "top right",
              backgroundSize: "25%"
            }
          });
        }
        console.log({
          beforeEval,
          afterEval,
          wasWhite,
          evalLoss,
          classification: classifyMove(evalLoss)
        });
      }

      scoreMoves()
    }

    return true;
  }

  function getEvalLoss(before:number, after:number){
    return Math.max(0, before - after);
  }
  
  function showDots({square} : PieceHandlerArgs) {
    if (!square) {
      return
    };
    
    if (selectedSquareRef.current) {
        const selected = selectedSquareRef.current;

        const legalMoves = game.moves({
            square: selected as Square,
            verbose: true
        });

        const canMove = legalMoves.some(
            move => move.to === square
        );

        if (canMove) {
            movePiece({
                piece: null as any,
                sourceSquare: selected,
                targetSquare: square
            });

            selectedSquareRef.current = null;
            setSelectedSquare(null);
            return;
        }
    }
    
    if (selectedSquareRef.current == square) {
      selectedSquareRef.current = null;
      setSelectedSquare(null);
      setOptionSquares({});
      return;
    }

    const moves = game.moves({
      square: square as Square,
      verbose: true
    });

    const newSquares: any = {};

    moves.forEach((move) => {
      if (move.captured) {
        newSquares[move.to] = {
            boxShadow: "inset 0 0 0 10px rgba(50, 47, 47, 0.4)",
            borderRadius: "50%",
        };
      } else {
        newSquares[move.to] = {
          background: "radial-gradient(circle, #000000 20%, transparent 25%)",
          borderRadius: "50%",
          opacity: '0.2',
        }
      }
    });

    newSquares[square] = {
      backgroundColor: "rgba(255, 255, 51, 0.51)",
    }

    setOptionSquares(newSquares);
    setSelectedSquare(square);
    selectedSquareRef.current = square
  }

  function clickSquare ({square} : SquareHandlerArgs) {
    setRedSquare({});

    if (selectedSquare) {
      movePiece({piece: null as any, sourceSquare : selectedSquare, targetSquare : square})
    }

    if (selectedSquareRef.current != square) {
      selectedSquareRef.current = null;
        setSelectedSquare(null);
        setOptionSquares({});
        return;
    }
  }

  function getFen() {
    const index = preview?.index
    const w = preview?.white;
    
    if (index == 0) {
      return {fen: defaultGame}
    }

    if (index == null) {
      return {fen: game.fen()};
    }

    const lastIndex = Object.keys(history).length;
    const lastWhite = history[lastIndex]?.b == null;

    if (
      index === lastIndex &&
      w === lastWhite
    ) {
      return {fen: game.fen()};
    }

    const temp = new Chess();
    let currentLastMove = null;
    
    for (const [_index, moves] of Object.entries(history)) {
      const moveIndex = Number(_index)
      currentLastMove = temp.move(moves.w);
      if (w && moveIndex == index) {break};
      if (moves.b) {currentLastMove = temp.move(moves.b)}
      if (!w && moveIndex == index) {break};
    }

    return {fen: temp.fen(), last: currentLastMove}
  }

  function playHistorySound(index : number, white : boolean) {
    const specificHistory = history[index];
    if (!specificHistory) return;
    
    const move = white? specificHistory.w : specificHistory.b;
    if (!move) return;

    const checkmate = move.endsWith("#");
    const check = move.endsWith("+");
    const promotion = move.includes("=");
    const captured = move.includes("x");
    const castled = move === "O-O" || move === "O-O-O";
    decideAudio(checkmate, check, promotion, captured, castled);
  }

  function previousMove() {
    if (!preview) {return}
    let newIndex = preview.index - 1
    let newWhite = false
    
    if (!preview.white) {
      newIndex++;
      newWhite = true;
    }

    if (newIndex < 0) {return}
    
    playHistorySound(preview.index, preview.white)

    setPreview({
      index: newIndex,
      white: newWhite
    })
  }

  function nextMove() {
    if (!preview) return;

    let newIndex = preview.index;
    let newWhite = preview.white;

    if (preview.index === 0) {
      newIndex = 1;
      newWhite = true;
    } else if (preview.white) {
      newWhite = false;
    } else {
      newIndex++;
      newWhite = true;
    }

    const lastIndex = Object.keys(history).length;
    const lastIsWhite = history[lastIndex]?.b == null;

    if (newIndex > lastIndex) return;
    if (newIndex === lastIndex && !newWhite && lastIsWhite) return;

    setPreview({
      index: newIndex,
      white: newWhite
    });

    playHistorySound(newIndex, newWhite);
  }

  function currentPosition() {
    if (!preview) return;
    const fullLength = Object.entries(history).length
    const current = history[fullLength]

    if (!current) return;

    setPreview({
      index: fullLength,
      white: current.w? true : false,
    });
  }

  function startingPosition() {
    setPreview({
      index: 0,
      white: true,
    });
  }

  function selectPreview(white : boolean, index : number) {
    setPreview({
      index: index,
      white: white
    })
  }

  function rightClickSquare({square} : SquareHandlerArgs) {
    if (!square) return;

    if (redSquares[square]) {
      setRedSquare(prev => ({
        ...prev,
        [square]: null
      }))
    } else {
      setRedSquare(prev => ({
        ...prev,
        [square]: {
          backgroundColor: "rgba(235, 97, 80, 0.5)"
        }
      }))
    }
  }

  function getRandomGame() {
    if (!userStats) return null;
    let chosen = null;
    
    for (const lost_g of  userStats[0].all_games_lost) {
      if (chosen == null || Math.floor(Math.random() * 4) == 2) {
        const loadedGame = new Chess()
        loadedGame.loadPgn(lost_g.pgn)
        const loadedGameHistoryLength = loadedGame.history().length

        if (loadedGameHistoryLength < 10) continue;
        chosen = lost_g;
      }
    }

    return chosen;
  }

  function evaluatePosition(fen: string): Promise<number> {
    return new Promise((resolve) => {
      const engine = evalRef.current;

      let latestEval = 0;

      const chess = new Chess(fen);
      const whiteToMove = chess.turn() === "w";

      const handler = (event: MessageEvent) => {
        const line = event.data;

        if (line.includes("score cp")) {
          const parts = line.split(" ");
          const index = parts.indexOf("cp");

          if (index !== -1) {
            let score = Number(parts[index + 1]);

            // convert to white perspective
            if (!whiteToMove) {
              score = -score;
            }

            latestEval = score;
          }
        }


        if (line.startsWith("bestmove")) {
          engine.removeEventListener("message", handler);
          resolve(latestEval);
        }
      };


      engine.addEventListener("message", handler);
      engine.postMessage("stop");
      engine.postMessage(`position fen ${fen}`);
      engine.postMessage("go depth 15");
    });
  }

  function classifyMove(loss:number){

    if(loss <= 10)
        return "Best";

    if(loss <= 30)
        return "Excellent";

    if(loss <= 80)
        return "Good";

    if(loss <= 200)
        return "Inaccuracy";

    if(loss <= 500)
        return "Mistake";

    return "Blunder";
  }

  useEffect(() => {
    historyRef.current?.scrollTo({
      top: historyRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [history]);

  useEffect(() => {
    const last = getFen().last

    if (last) {
      setLastMove(last)
    }
  }, [preview, history])

  useEffect(() => {
    function windowKeyDown(event : any) {
      if (event.key == 'ArrowLeft') {
        previousMove();
      }

      if (event.key == 'ArrowRight') {
        nextMove();
      }

      if (event.key == 'ArrowUp') {
        currentPosition();
      }

      if (event.key == 'ArrowDown') {
        startingPosition();
      }
    }

    window.addEventListener('keydown', windowKeyDown);

    return () => {window.removeEventListener('keydown', windowKeyDown);};
  }, [preview])

  useEffect(() => {
    captureAudio.current = new Audio(captureSound);
    moveAudio.current = new Audio(moveSound);
    castleAudio.current = new Audio(castleSound);
    checkAudio.current = new Audio(checkSound);
    checkmateAudio.current = new Audio(checkmateSound);
    promoteAudio.current = new Audio(promoteSound);

    return () => {
      captureAudio.current?.pause();
      moveAudio.current?.pause();
      castleAudio.current?.pause();
      checkAudio.current?.pause();
      checkmateAudio.current?.pause();
      promoteAudio.current?.pause();
    };
  }, []);

  useEffect(() => {
    const engine = new Worker('/stockfish.js');
    engineRef.current = engine;
    engine.postMessage("uci");

    evalRef.current = new Worker('/stockfish.js');
    evalRef.current.postMessage('uci');

    engine.onmessage = (event: any) => {
        const line = event.data;

        if (line.startsWith('info')) {
        }

        if (line.startsWith("bestmove")) {
            const move = line.split(" ")[1];
            const from = move.slice(0,2);
            const to = move.slice(2,4);

            moveRef.current({
                piece: null as any,
                sourceSquare: from,
                targetSquare: to
            }, true);
        }
    };

    return () => {
        engine.terminate();
    };

  }, []);

  useEffect(()=> {
    moveRef.current = movePiece
  }, [movePiece])

  useEffect(() => {
    if (!engineTurn) return;
    engineRef.current.postMessage('setoption name Skill Level value 10')
    engineRef.current.postMessage(`position fen ${game.fen()}`)
    engineRef.current.postMessage('go movetime 250')
  }, [engineTurn, game])

  useEffect(() => {
    const randomGame : any = getRandomGame()
    const colorPlaying = randomGame.black.result == 'win' ? 'white' : 'black';
    const newGame = new Chess()
    newGame.loadPgn(randomGame.pgn)

    const newGameHistory = newGame.history()
    const skipping = Math.round(newGameHistory.length * 0.2)
    let moveNum = 0
    let chosenStart = null

    let tempHistory : moveHistory = {}
    let tempPreview : movePreview | null = null
    let lastWhite = false

    for (const moveMade of newGameHistory) {
      const newLength = Object.keys(tempHistory).length + 1
      let white = true

      if (tempHistory[newLength - 1] && tempHistory[newLength - 1].b == null) {
        tempHistory[newLength - 1] = {
          w: tempHistory[newLength - 1].w,
          b: moveMade
        }

        white = false
      } else {
        tempHistory[newLength] = {
          w: moveMade,
          b: null
        }
      }

      lastWhite = white
      moveNum++;
      if (moveNum <= skipping) continue;
      
      if (chosenStart == null || Math.floor(Math.random() * 20) == 10) {
        chosenStart = moveNum;

        tempPreview = {
          index: white ? newLength : newLength - 1,
          white: white
        }
      }
    }
    
    if (!chosenStart) return
    let loopedThrough = 0
    let newTempHistory : moveHistory = {}
    let newTempPreview : movePreview | null = null
    
    const newBoard = new Chess()

    for (const [key, value] of Object.entries(tempHistory)) {
      for (const moveValue of Object.entries(value)) {
        loopedThrough++;
        
        if (loopedThrough > chosenStart) {
          if (moveValue[0] == 'b') {
            if (!tempHistory[Number(key)]) continue
            tempHistory[Number(key)].b = null
          } else {
            delete tempHistory[Number(key)]
          }
        } else {
          const newLength = Object.keys(newTempHistory).length + 1
          const moveMade = moveValue[0] == 'w' ? value.w : value.b
          if (!moveMade) continue;

          let white = true
          const m = newBoard.move(moveMade)
          setLastMove({from: m.from, to: m.to})

          if (newTempHistory[newLength - 1] && newTempHistory[newLength - 1].b == null) {
            newTempHistory[newLength - 1] = {
              w: newTempHistory[newLength - 1].w,
              b: moveMade
            }

            white = false
          } else {
            newTempHistory[newLength] = {
              w: moveMade,
              b: null
            }
          }

          newTempPreview = {
            index: white ? newLength : newLength - 1,
            white: white
          }
        }
      }
    }

    setGame(newBoard)
    gameRef.current = newBoard

    setBoardOrientation(colorPlaying)
    setHistory(newTempHistory)
    setPreview(newTempPreview)
    setEngineTurn(false)
    setOptionSquares({})
  }, [])
  
  // Html
  return (
    <>
    <section className='full-page p'>
      <section className='chess-container'>
        <Chessboard options={{
          onPieceDrop: movePiece,
          onPieceClick: showDots,
          onPieceDrag: showDots,
          onSquareClick: clickSquare,
          onSquareRightClick: rightClickSquare,

          position: getFen().fen,
          allowDragOffBoard: false,
          dragActivationDistance: 1.1,
          boardOrientation: bordOrientation,
          squareStyles: {
            ...(lastMove && {
              [lastMove.from]: {
                backgroundColor: "rgba(255, 255, 51, 0.51)",
              },
              [lastMove.to]: {
                backgroundColor: "rgb(255, 255, 51, 0.51)",
              },
            }),
            ...optionSquares,
            ...redSquares,
            ...evalSquare
          },

          draggingPieceGhostStyle: {
            opacity: 0
          },

          draggingPieceStyle: {
            transform: "scale(1.05)"
          },

          dropSquareStyle: {
            boxShadow: "inset 0 0 0 7px #ffffff",
          },

          darkSquareStyle: {
            backgroundColor: "#3B4758"
          },
          lightSquareStyle: {
            backgroundColor: "#C7D2DA"
          },
        }}/>
      </section>

      <div className='left-panel'>
        <h2>Game</h2>
        
        <section id='moves' ref={historyRef}>
          {history && (
            Object.values(history).map((move, index) => (
              <article className='move-parent' key={index}>
                <p>{index}.</p>

                <article className='moves-inside'>
                  <button className='first-move game-move' onClick={()=>selectPreview(true, index + 1)}>{move.w}</button>
                  <button className='second-move game-move' onClick={()=>selectPreview(false, index + 1)}>{move.b || ''}</button>
                </article>
              </article>
            ))
          )}
        </section>

        <div className='bottom-buttons'>
          <button className='style-btn' onClick={previousMove}>{'<'}</button>
          <button className='style-btn' onClick={nextMove}>{'>'}</button>
          <button className='style-btn' onClick={startingPosition}>start</button>
          <button className='style-btn' onClick={currentPosition}>end</button>
        </div>
      </div>
    </section>
    </>
  )
}

export default PracticePage