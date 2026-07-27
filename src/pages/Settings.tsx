import { ChevronRight, LogOut, Shield, WalletMinimal } from "lucide-react"
import { useState } from "react";

function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const defaultSubClass = 'subscription-btn'
  const manageSubscription = async () => {
    if (loading) return;
    try{
      setLoading(true);
      const res = await fetch(
          "http://localhost:3000/api/create-portal-session",
          {
              method: "POST",
              credentials: "include"
          }
      );
  
      const data = await res.json();
      window.location.href = data.url;
    } catch(err) {
      console.log('error occured:', err)
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false)
    }
  };
  return (
    <>
    <section className='full-page'>
      <h1 className='title'>Settings</h1>
      <article className='setting-box sub'>
        <div className="side-by">
          <WalletMinimal/>
          <p>Manage Subscription</p>
        </div>

        <p className='grey-txt marg-top bill-txt'>View billing history, update payment method, or cancel your subscription.</p>
        <button className={loading? defaultSubClass + ' loader' : defaultSubClass} onClick={manageSubscription}>
          {loading ? (
            <>
              <section className="spin-center prem">
                <div className="spinner"></div>
              </section>
            </>
          ) : (
            <>
              Manage Subscription 
              <ChevronRight/>
            </>
          )}
          </button>
      </article>
      <article className='setting-box'>
        <div className="side-by">
          <Shield/>
          <p>Account</p>
        </div>

        <p className="grey-txt marg-top">Sign out of your account on this device.</p>
        <a className='setting-btn signout-btn' href='http://localhost:3000/logout'>Sign out <LogOut color='#D43A46'/></a>
      </article>
    </section>
    </>
  )
}

export default SettingsPage