import '../styles/default.css'
import { Zap } from 'lucide-react'
import { Diamond } from 'lucide-react'

function LandingPage() {
  const googleLink = "http://localhost:3000/auth/google";
  
  return (
    <>
    <nav>
      <div className='left'>
        <h1><Diamond/> Vox Openings</h1>
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
          Pick an opening.<br />
          Master it <span className="purple-txt">here.</span>
        </h1>

        <p className='secondary-txt'>
          Memorize opening lines through repetition, then test yourself without hints.
        </p>

        <span id='btns-pair'>
          <a className='gradient-btn'>
            Start Training Now
          </a>

          <a className='bg-btn'>
            Try For Free
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
          <Zap/>
        </div>

        <p className='card-title'>
          Step-by-step learning
        </p>

        <p className='card-info secondary-txt'>
          Lines show you where to move, turn them off to practice.
        </p>
      </div>

      <div className='card'>
        <div className='card-icon'>
          <Zap/>
        </div>

        <p className='card-title'>
          Active recall
        </p>

        <p className='card-info secondary-txt'>
          Recall every move from memory to strengthen long-term retention.
        </p>
      </div>

      <div className='card'>
        <div className='card-icon'>
          <Zap/>
        </div>

        <p className='card-title'>
          Track progress
        </p>

        <p className='card-info secondary-txt'>
          Track completion, accuracy, and mastery across every opening.
        </p>
      </div>

      <div className='card'>
        <div className='card-icon'>
          <Zap/>
        </div>

        <p className='card-title'>
          Repetition
        </p>

        <p className='card-info secondary-txt'>
          Repeat difficult lines until they're effortless.
        </p>
      </div>
    </section>
    </>
  )
}

export default LandingPage
