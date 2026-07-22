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
import { ChartNoAxesColumnIncreasing, Check, ChessBishop, Clock, Flag, Lightbulb, Puzzle, RotateCcw, Shield, ShieldCheck, Spotlight } from 'lucide-react';
import {CircularProgress} from '../components/circular'

type moveHistory = {
  [key: number] : {
    w: string | null;
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

const g_vars = {
  maxPosition: 10,
  minMoves: 2,
}

const survivalHistoryTemp : number[] = []

for (let v = 1; v <= g_vars.maxPosition; v++) {
  survivalHistoryTemp.push(v)
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
  const didStartGame = useRef(false);

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
  const [startedGame, setStartedGame] = useState(false);

  const [g_currentPosition, g_setCurrentPosition] = useState(0);
  const [g_currentMoveSurvived, g_setCurrentMoveSurvived] = useState(0);
  const [g_variation, g_setVariation] = useState('King\'s Indian Defense: ... Variation');
  const [g_info, g_setInfo] = useState('This position is from a game you lost on May 12, 2025...');
  const [g_timeSaved, g_setTimeSaved] = useState('00:00');
  const [g_OriginalTimeSaved, g_setOriginalTimeSaved] = useState(0);
  const [g_survival, g_setSurvival] = useState({});
  const [g_currentColor, g_setCurrentColor] = useState('---');


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
    let wasWhite = false;

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

      if (!engineTurn) {
        g_setCurrentMoveSurvived(g_currentMoveSurvived - 1)
      }

      const checkmate = gameCopy.isCheckmate();
      const check = gameCopy.isCheck();
      const promotion = move.promotion == 'q';
      const captured = move.captured;
      const castled = move.flags == 'k' || move.flags == 'q';
      
      decideAudio(checkmate, check, promotion, captured, castled);
      setEngineTurn(!fromEngine? true : false)
      wasWhite = white;
    }

    setGame(gameCopy);
    gameRef.current = gameCopy;
    setOptionSquares({});
    
    return true;
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
      if (chosen == null || Math.floor(Math.random() * 15) == 10) {
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

  function getSurvivalActive(item : number){
    let classN = 'survival-history '

    if (item == g_currentPosition) {
      classN += 'surv-on'
    }

    if (item > g_currentPosition) {
      classN += 'surv-inactive'
    }

    if (item < g_currentPosition) {
      classN += 'surv-active'
    }
    
    return classN;
  }

  function defaultStartGame() {
    const randomGame : any = getRandomGame()
    const colorPlaying = randomGame.black.result == 'win' ? 'white' : 'black';
    const computerColor = colorPlaying == 'white'? 'black' : 'white';
    const newGame = new Chess()

    newGame.loadPgn(randomGame.pgn)
    g_setCurrentMoveSurvived(g_vars.minMoves)
    g_setCurrentColor(computerColor);

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
    let stopped = false;
    
    const newBoard = new Chess()
    console.log(colorPlaying)
    for (const [key, value] of Object.entries(tempHistory)) {
      if (stopped) break;
      for (const moveValue of Object.entries(value)) {
        loopedThrough++;
        const newLength = Object.keys(newTempHistory).length + 1
        const player_is_black_and_stopped_at_black = colorPlaying == 'black' && !newTempHistory[newLength - 1]?.b
        const player_is_white_and_stopped_at_white = colorPlaying == 'white' && newTempHistory[newLength - 1]?.b
        let validStopLength = player_is_white_and_stopped_at_white || player_is_black_and_stopped_at_black;

        if (((loopedThrough > 5 && (Math.floor(Math.random() * 10)) == 5) || loopedThrough > chosenStart) && validStopLength) {
          stopped = true;
          break;
        } else {
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

    /*for (const [key, value] of Object.entries(tempHistory)) {
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
    }*/
    
    /*console.log(newTempHistory, newTempPreview)
    const isBlackCurrently = !newTempPreview?.white && colorPlaying == 'black';
    const isWhiteCurrently = newTempPreview?.white && colorPlaying == 'white';

    if ((isWhiteCurrently) || (isBlackCurrently)) {
      console.log('WRONG!!')
      const currLength = Object.keys(newTempHistory).length;
      const white = isWhiteCurrently? true : false;
      console.log(isWhiteCurrently, isBlackCurrently)
      if (isWhiteCurrently) {
        newTempHistory[currLength].b = null;

        newTempPreview = {
          index: currLength,
          white: white
        }
      }

      if (isBlackCurrently) {
        delete newTempHistory[currLength]
        
        newTempPreview = {
          index: currLength - 1,
          white: white
        }
      }
    }*/

    setGame(newBoard)
    gameRef.current = newBoard

    setBoardOrientation(colorPlaying)
    setHistory(newTempHistory)
    setPreview(newTempPreview)
    setEngineTurn(false)
    setOptionSquares({})
  }

  function initialStartGame() {
    if (!startedGame) {
      setStartedGame(true);
      defaultStartGame();
      didStartGame.current = true;
    }
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
    const timer = setInterval(() => {
      if (didStartGame.current) {
        const timeSaved = g_OriginalTimeSaved + 1;
        let string = ''
        let minutesString = ''
        let secondsString = ''
        let seconds = timeSaved
        let minutes = 0;
        g_setOriginalTimeSaved(g_OriginalTimeSaved + 1);

        for (let i = seconds; i > 59; i -= 60) {
          minutes++;
          seconds -= 60;
        }

        minutesString = '0' + String(minutes)

        if (minutes > 9) {
          minutesString = String(minutes)
        }

        secondsString = '0' + seconds

        if (seconds > 9) {
          secondsString = String(seconds)
        }

        string = minutesString + ':' + secondsString
        g_setTimeSaved(string);
      }
    }, 1000)

    return () => clearInterval(timer)
  })
  
  // Html
  return (
    <>
    <section className='full-page p'>

    <section className='page-vert'>
      <div className='page-start'>
        <article className='dark-box'>
          <div className='side-by'>
            <Lightbulb/>
            <p className='big-title'>About This Position</p>
          </div>

          <p className='grey-txt'>{g_variation}</p>
          <p className='grey-txt'>{g_info}</p>
        </article>

        <article className='dark-box'>
          <div className='side-by'>
            <ChartNoAxesColumnIncreasing />
            <p className='big-title'>Progress</p>
          </div>

         <div className='side-by gap'>
          <CircularProgress percentage={Math.round((g_currentPosition / g_vars.maxPosition) * 100)} size={100} color="#6366f1"/>
          
          <div className='down-by'>
            <p className='grey-txt'>{g_currentPosition} / {g_vars.maxPosition}</p>
            <p className='grey-txt'>Positions</p>
          </div>
         </div>
        </article>

        <article className='dark-box small-box'>
          <div className='side-by'>
            <ShieldCheck />
            <p className='big-title'>Survival History</p>
          </div>

          <div className='side-by surv'>
            {survivalHistoryTemp.map((item, index) => (
              <p key={index} className={getSurvivalActive(item)}>{item < g_currentPosition ? <Check size={20}/> : item}</p>
            ))}
          </div>
        </article>

        <article className='dark-box tips'>
          <div className='side-by'>
            <Spotlight/>
            <p className='big-title'>Tips</p>
          </div>

          <div>
            <p className='grey-txt'>The goal is to survive {g_vars.maxPosition} moves.</p>
            <p className='grey-txt'>Focus on piece safety and king safety.</p>
            <p className='grey-txt'>Good Luck!</p>
          </div>
        </article>
      </div>

      <div className='general-chess-area'>
        <section className='mid-bar'>
          <article >
            <Puzzle size={35}/>

            <div>
              <p className='top-txt'>Position {g_currentPosition} / {g_vars.maxPosition}</p>
              <p className='grey-txt'>From your lost games</p>
            </div>
          </article>

          <article >
            <Shield size={35}/>

            <div>
              <p className='top-txt'>Survive {g_currentMoveSurvived} more moves</p>
              <p className='grey-txt'>Computer is {g_currentColor}</p>
            </div>
          </article>

          <article >
            <Clock size={35}/>

            <div>
              <p className='top-txt'>{g_timeSaved}</p>
              <p className='grey-txt'>Time Survived</p>
            </div>
          </article>
        </section>

        <article className='chess-holder'>
          {startedGame ? (<section className='chess-container'>
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
                backgroundColor: "#D0C7B8"
              },
            }}/>
          </section>
          ) : (
            <>
            <div className='start-game-section'>
              <div className='side-by'>
                <ChessBishop/>
                <h2>Practice</h2>
              </div>
              <p className='grey-txt desc'>Survive {g_vars.maxPosition} moves from your previous lost positions, data is collected from your stats</p>
              <button className='start-game-btn' onClick={initialStartGame}>Start</button>
            </div>
            </>
            )}
        </article>

        <div className='bottom-btns-p'>
          <button>
            <Flag/>
            <p>Skip</p>
          </button>

          <button>
            <RotateCcw/>
            <p>Restart Position</p>
          </button>
        </div>
      </div>

      <section className='page-horizontal'>
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
    </section>

    </section>
    </>
  )
}

export default PracticePage