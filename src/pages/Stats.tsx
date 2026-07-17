import { useState } from "react";
import { useUserVar } from "../userVar";
import { Clock, Flame, Minus, Swords, Target, Trophy, User, Zap } from "lucide-react";

function StatsPage() {
  //variables
  const {user, setUser} = useUserVar();

  //states
  const [username, setUsername] = useState('');
  const [canAnalyze, setCanAnalyze] = useState(true);
  const [userStats, setUserStats] : any = useState(user?.stats? user.stats[0] : null);
  const [timeClass, setTimeClass] = useState('blitz')

  const [months, setMonths] = useState(4)

  // functions
  async function analyze(){
    if (canAnalyze && username.trim()){
      setCanAnalyze(false);

      try{
        await fetch('http://localhost:3000/api/saveStats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({username: username, timeClass: timeClass, months : months})
        })
        .then(res => res.json())
        .then(updatedUser => {
          setUser(updatedUser);
          setUserStats(updatedUser.stats[0])
        })
      } catch (err) {
        console.log(err);
      }
      finally {
        setCanAnalyze(true);
        setUsername('');
      }
    }
  }

  function selectTime(control : string) {
    setTimeClass(control);
  }

  function handleMonths(e : any) {
    setMonths(e.target.value);
  }
  
  if (!user) {
    throw new Error('no user found!')
  };
  
  return (
    <>
     <section className='full-page'>
      <h1 className='title'>Stats</h1>

      <aside className="anaylze-card">
        <button className="style-btn" onClick={analyze}>Analyze</button>
        <input placeholder="Chess.com username" value={username} onChange={(e) => setUsername(e.target.value)}></input>
        <button className={timeClass == 'bullet'? 'active-class style-btn' : 'style-btn'} onClick={() => selectTime('bullet')}>Bullet</button>
        <button className={timeClass == 'blitz'? 'active-class style-btn' : 'style-btn'} onClick={() => selectTime('blitz')}>Blitz</button>
        <button className={timeClass == 'rapid'? 'active-class style-btn' : 'style-btn'} onClick={() => selectTime('rapid')}>Rapid</button>

        <select name="Months" onChange={(e) => handleMonths(e)} defaultValue={months}>
          {Array.from({length : 12}, (_, index) => (
            <option key={index} value = {index + 1}>
              {index + 1} month{index + 1 > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </aside>

      {!canAnalyze && (
        <>
        <section className="spin-center">
          <div className="spinner"></div>
        </section>
        </>
      )}
      {userStats && canAnalyze && (
        <>
        <section className="allStats">
          <section className="games-section">
            <article className='stats-box g'>
              <article className='icon-box'>
                <Trophy color="#65E57B"/>
              </article>

              <article className="stats-game-box">
                <p>Games Won</p>
                <p className='stat-num'> {userStats.games_won}</p>
                <p className="stat-percentage">{userStats.win_rate + '%'}</p>
              </article>
            </article>

            <article className='stats-box r'>
              <article className='icon-box'>
                <Swords color="#FF6B6B"/>
              </article>

              <article className="stats-game-box">
                <p>Games Lost</p>
                <p className='stat-num'> {userStats.games_lost}</p>
                <p className="stat-percentage">{userStats.loss_rate + '%'}</p>
              </article>
            </article>

            <article className='stats-box b'>
              <article className='icon-box'>
                <Minus color="#8FB5FF"/>
              </article>

              <article className="stats-game-box">
                <p>Draws</p>
                <p className='stat-num'> {userStats.games_draw}</p>
                <p className="stat-percentage">{userStats.draw_rate + '%'}</p>
              </article>
            </article>
          </section>

          <section className='other-stats-section'>
            <article className="stat-box personal">
              <p className="stat-title">Personal Stats</p>

              <div className="personal-stats">
                <div className="p-left">
                  <article className='p-stat'>
                    <Clock/>
                    <p>Total Games</p>
                    <strong>{userStats.total_games}</strong>
                  </article>

                  <article className='p-stat'>
                    <Zap/>
                    <p>Win Rate</p>
                    <strong>{userStats.win_rate + '%'}</strong>
                  </article>

                  <article className='p-stat'>
                    <Flame/>
                    <p>Best Win Streak</p>
                    <strong>{userStats.best_streak}</strong>
                  </article>


                </div>

                <div className="p-right">
                  <article className='p-stat'>
                    <User/>
                    <p>Average Opponent Rating</p>
                    <div className="purple">{userStats.average_opponent_rating}</div>
                  </article>

                  <article className='p-stat'>
                    <Target/>
                    <p>Highest Rating</p>
                    <div className="purple">{userStats.highest_rating}</div>
                  </article>
                </div>
              </div>
            </article>
          </section>
          
          <section className="openings-section">
            <article className="stat-box g">
              <p className="stat-title"><span></span>Openings You Win With</p>

              <article className='stat-box-top'>
                <p>Opening</p>
                <p className="opening-stat-middle">Win Rate</p>
                <p>Games</p>
              </article>

              <article className="opening-stats">
                {userStats.openings_won_with.map((opening : any, index : any) => (
                  <article className="opening-stat-box" key={index}>
                    <p>{opening[0]}</p>

                    <article className="opening-stat-box-middle">
                      <div className="bar"><i style={{width: `${opening[1].percent}%`}}></i></div>
                      <p>{opening[1].percent + '%'}</p>
                    </article>

                    <strong>{opening[1].games}</strong>
                  </article>
                ))}
              </article>
            </article>

            <article className="stat-box r">
              <p className="stat-title"><span></span>Openings You Lose To</p>

              <article className='stat-box-top'>
                <p>Opening</p>
                <p className="opening-stat-middle">Loss Rate</p>
                <p>Games</p>
              </article>

              <article className="opening-stats">
                {userStats.openings_lost_to.map((opening : any, index : any) => (
                  <article className="opening-stat-box" key={index}>
                    <p>{opening[0]}</p>

                    <article className="opening-stat-box-middle">
                      <div className="bar"><i style={{width: `${opening[1].percent}%`}}></i></div>
                      <p>{opening[1].percent + '%'}</p>
                    </article>

                    <strong>{opening[1].games}</strong>
                  </article>
                ))}
              </article>
            </article>

            <article className="stat-box b">
              <p className="stat-title"><span></span>Openings You Face</p>

              <article className='stat-box-top'>
                <p>Opening</p>
                <p>Games</p>
              </article>

              <article className="opening-stats">
                {userStats.openings_faced.map((opening : any, index : any) => (
                  <article className="opening-stat-box" key={index}>
                    <p>{opening[0]}</p>
                    <strong>{opening[1].games}</strong>
                  </article>
                ))}
              </article>
            </article>
          </section>
        </section>
        </>
      )}
    </section>
    </>
  )
}

export default StatsPage