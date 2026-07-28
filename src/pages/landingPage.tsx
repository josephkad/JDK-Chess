import '../styles/default.css'
import {  ArrowBigUp, Play, Recycle, Search, Target } from 'lucide-react'
import { Diamond } from 'lucide-react'
import { useEffect, useRef, useState } from 'react';

function LandingPage() {
  const port = import.meta.env.VITE_API_URL;
  const googleLink = `${port}/auth/google`;
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<any>(null)
  
  useEffect(() => {
    function clickedOutside(event: MouseEvent) {
      if (videoRef.current && !videoRef.current.contains(event.target as Node)) {
        setPlaying(false)
      }
    }

    if (playing) {
      document.addEventListener('mousedown', clickedOutside)
    }

    return () => {
      document.removeEventListener('mousedown', clickedOutside)
    }
  }, [playing])

  return (
    <>
    {playing && (
      <>
      <div className='vid-par'>
        <iframe ref={videoRef} allowFullScreen className='vid' src='https://www.youtube.com/embed/NG-cLiTH8tQ?autoplay=1' allow="autoplay; encrypted-media"/>
      </div>
      </>
    )}
    
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
        <div className='video'>
          <button className='vid-btn' onClick={() => setPlaying(true)}>
            <Play size={40} color='rgb(93, 0, 255)'/>
          </button>
        </div>
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
