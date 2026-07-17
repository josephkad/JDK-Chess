import {useUserVar} from '../userVar'
import { ChessKing, ChessPawn, ChessRook, Flame } from 'lucide-react'

function HomePage() {
  const {user} = useUserVar();

  if (!user) {
    throw new Error('no user found!')
  };
  
  return (
    <>
    <section className='full-page'>
      <section className='htop'>
        <h1>Welcome back, {user.displayName}</h1>
        <p>Let's keep your streak alive.</p>

        <aside className='side-boxes'>          
          <article className='streak-box'>
            <aside className='no-column'>
              <Flame fill="#eb8d29" size={50}/>
              <p className='very-large-txt'>99</p>
            </aside>

            <p className='larger-txt'>Day Streak</p>
          </article>

          <article className='goal-box'>
            <aside>
              <p>Today's Goal</p>
              <p className='very-large-txt'>3/5</p>
              <p>drills completed</p>
              <progress value='50' max='100'></progress>
            </aside>

            <ChessRook size={130} fill="#000000"color="#000000"/>
          </article>
        </aside>
      </section>
      
      <section className='hmiddle'>
        <h2>Continue Training</h2>

        <article className='openingBox'>
          <div className='box-start'>
           <ChessPawn fill="#000000"color="#000000" size={40}/>
          </div>

          <span className='box-left'>
            <h3>Sicillan Defense</h3>
            <p>Dragon Variation</p>
            <progress value='50' max='100'></progress>
          </span>

          <span className='box-middle'>
            <p>Progress</p>
            <h3>36%</h3>
          </span>

          <span className='box-right'>
            <ChessKing fill="#000000"color="#ffffff"/>
            <a>Continue</a>
          </span>
        </article>
      </section>

      <section className='hbottom'>
        <h2>Your Openings</h2>

        <article className='openingBox'>
          <div className='box-start'>
           <ChessPawn fill="#000000"color="#000000" size={40}/>
          </div>

          <span className='box-left'>
            <h3>Sicillan Defense</h3>
            <p>Dragon Variation</p>
          </span>

          <span className='box-middle'>
            <progress value='50' max='100'></progress>
          </span>

          <span className='box-right'>
            <h3>36%</h3>
          </span>
        </article>
      </section>
    </section>
    </>
  )
}

export default HomePage