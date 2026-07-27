import { useState } from 'react';
import '../styles/premium.css'
import {useUserVar} from '../userVar'
import { ChartNoAxesColumnIncreasing, Check, Clock, Gem, Infinity, Lock, Pencil, Star } from 'lucide-react';

function PremiumPage() {
  const {user} = useUserVar();
  const [loading, setLoading] = useState(false);
  const port = 'http://localhost:3000'
  
  if (!user) {
    throw new Error('no user found!')
  };
  
  const subscribe = async () => {
    if (loading) return
    setLoading(true)

    try {
        const res = await fetch(
            `${port}/api/create-checkout-session`,
            {
                method: "POST",
                credentials: "include"
            }
        );
    
        const data = await res.json();
        window.location.href = data.url;
    } catch (err){
        console.log(err)
    } finally{
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false)
    }
  };
  
  return (
    <>
    <section className='full-page'>
      <div className='p-container'>
        <div className='p-left-side'>
            <h1>Vox Premium <Gem size={35} color='#7C5CFF'/></h1>
            <p className='grey-txt'>Unlock the full power of Vox and take your chess to the next level.</p>

            <div className='side-by for-dark-box'>
                <div className='p-dark-box'>
                    <article className='p-dark-icon'>
                        <ChartNoAxesColumnIncreasing size={50} color='#7C5CFF'/>
                    </article>

                    <article className='p-main'>
                        <p className='p-title'>Advanced Stats</p>
                        <p className='grey-txt'>Deep insights into your openings, performance, and progress.</p>
                    </article>
                </div>
                <div className='p-dark-box'>
                    <article className='p-dark-icon'>
                        <Infinity size={50} color='#7C5CFF'/>
                    </article>

                    <article className='p-main'>
                        <p className='p-title'>Unlimited Practice</p>
                        <p className='grey-txt'>Practice as much as you want with unlimited positions.</p>
                    </article>
                </div>
            </div>

            <div className='p-dark-box p-left'>
                <div className='side-by'>
                    <h2 className='p-title'>$4.99</h2>
                    <p className='grey-txt'>/ month</p>
                </div>

                <div className='p-container-list'>
                    <div className='side-by'>
                        <Check color='#7C5CFF'/>
                        <p>Unlimited practice positions</p>
                    </div>
                    <div className='side-by'>
                        <Check color='#7C5CFF'/>
                        <p>Advanced opening & performance stats</p>
                    </div>
                    <div className='side-by'>
                        <Check color='#7C5CFF'/>
                        <p>Cancel anytime</p>
                    </div>
                </div>

                <button className='premium-btn auto-top' onClick={subscribe}>
                    {loading?
                        (
                        <>
                        <section className="spin-center prem">
                            <div className="spinner"></div>
                        </section>
                        </>
                        )
                        :
                        (
                            <div className='side-by'>
                                <Gem color='white'/>
                                <p className='p-title'>Upgrade to Premium</p>
                            </div>
                        )
                    }
                </button>

                <p className='grey-txt side-by auto-top p-center'><Lock/> Secure payment powered by Stripe</p>
            </div>

            <p className='side-by grey-txt p-center'>Already have Premium? Manage your subscription in settings.</p>
        </div>

        <div className='p-right-side'>
            <h3>Compare Plans</h3>

            <div className='side-by p-side'>
                <p>Feature</p>
                <p className='p-side-far-right'>Free Plan</p>
                <p className='purple-txt'>Premium</p>
            </div>

            <div className='down-box'>
                <div className='side-by'>
                    <div className='side-first'>
                        <div className='icon'>
                           <Clock/>
                        </div>

                        <article>
                            <p>Practice Positions</p>
                            <p className='grey-txt'>Every 24 hours</p>
                        </article>
                    </div>

                    <div className='side-middle'>
                        10
                    </div>

                    <div className='side-end purple-txt '>
                        Unlimited
                    </div>
                </div>

                <div className='side-by'>
                    <div className='side-first'>
                        <div className='icon'>
                            <ChartNoAxesColumnIncreasing/>
                        </div>

                        <article>
                            <p>Stats Access</p>
                            <p className='grey-txt'>Basic insights</p>
                        </article>
                    </div>

                    <div className='side-middle'>
                        Basic
                    </div>

                    <div className='side-end purple-txt'>
                        Advanced
                    </div>
                </div>

                <div className='side-by'>
                    <div className='side-first'>
                        <div className='icon'>
                            <Pencil/>
                        </div>

                        <article>
                            <p>New Features</p>
                            <p className='grey-txt'>Early access</p>
                        </article>
                    </div>

                    <div className='side-middle'>
                        Limited
                    </div>

                    <div className='side-end purple-txt'>
                        Priority
                    </div>
                </div>
            </div>

            <div className='p-right-dark-box-bottom side-by'>
                <Star color='#7C5CFF'/>

                <div>
                    <p className='purple-txt'>Premium members get the most out of Vox.</p>
                    <p>More practice. Deeper insights. Faster improvement</p>
                </div>
            </div>
        </div>
      </div>
    </section>
    </>
  )
}

export default PremiumPage