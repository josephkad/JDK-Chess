import '../styles/default.css'
import { ArrowBigDown, ArrowBigUp, Recycle, Search, Target, Zap } from 'lucide-react'
import { Diamond } from 'lucide-react'

function LandingPage() {
  const googleLink = "http://localhost:3000/auth/google";
  
  return (
    <>
    <nav>
      <div className='left'>
        <h1><Diamond/> JDK Chess</h1>
      </div>

      <div className='right'>
        <a className='gradient-btn' href={googleLink}>
          Start Training
        </a>
      </div>
    </nav>

    <section id='hero'>
      <div className='left'>
        <div className='gradient-txt-container'>
          <h4 className='gradient-txt'>Build Opening Instinct.</h4>
        </div>

        <h1>
          Train from your<br />
          games. <span className="purple-txt">Get stronger.</span>
        </h1>

        <p className='secondary-txt'>
          We analyze your lost games, identify your weakest openings, and turn them into personalized training sessions.
        </p>

        <span id='btns-pair'>
          <a className='gradient-btn' href={googleLink}>
            Start Training Now
          </a>
        </span>
      </div>

      <div className='right'>
        <video></video>
      </div>
    </section>

    <section id='bottom'>
      <div className='card'>
        <div className='card-icon'>
          <Search/>
        </div>

        <p className='card-title'>
          Opening Analysis
        </p>

        <p className='card-info secondary-txt'>
          We break down your games to find openings where you struggle most.
        </p>
      </div>

      <div className='card'>
        <div className='card-icon'>
          <Target/>
        </div>

        <p className='card-title'>
          Personalized Training
        </p>

        <p className='card-info secondary-txt'>
          Practice against real positions you've lost in, not random drills.
        </p>
      </div>

      <div className='card'>
        <div className='card-icon'>
          <ArrowBigUp/>
        </div>

        <p className='card-title'>
          Track Progress
        </p>

        <p className='card-info secondary-txt'>
          See your improvement over time and turn weaknesses into strength.
        </p>
      </div>

      <div className='card'>
        <div className='card-icon'>
          <Recycle/>
        </div>

        <p className='card-title'>
          Unlimited Practice
        </p>

        <p className='card-info secondary-txt'>
          Practice your lost games until you master them.
        </p>
      </div>
    </section>
    </>
  )
}

export default LandingPage
