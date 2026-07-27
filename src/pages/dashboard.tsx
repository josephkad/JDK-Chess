import { House, Settings, ChartNoAxesCombined, BookOpen, Diamond, Gem } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"
import { useEffect, useRef, useState } from "react";
import '../styles/default.css'
import '../styles/dashboard.css'
import '../styles/settings.css'
import '../styles/home.css'
import '../styles/stats.css'

function Dashboard() {
    //States
    const [user, setUser] = useState<any>(null);
    const [hasPremium, setHasPremium] = useState(user? (user.subscription.status === "active" && new Date(user.subscription.currentPeriodEnd) > new Date()) : false)
    const port = 'http://localhost:3000/api/user'
    //Effects
    useEffect(() => {
        fetch(port, {
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) return null;
            return res.json();
        })
        .then(data => {
            if (!data) {return;}
            setUser(data);
            setHasPremium(data? (data.subscription.status === "active" && new Date(data.subscription.currentPeriodEnd) > new Date()) : false)
        })
    }, []);
    
    //Html
    return (
    <>
    <section className="page">
        <aside className="dashboard">
            <section className="top">
                <article className="top-stat">
                    <h1>Vox</h1>
                </article>
            </section>

            <section className="middle">
                <NavLink to='stats' className={({isActive}) => isActive? 'stat active' : 'stat'}>
                    <ChartNoAxesCombined/>
                    <p>Stats</p>
                </NavLink>
                <NavLink to='practice' className={({isActive}) => isActive? 'stat active' : 'stat'}>
                    <BookOpen/>
                    <p>Practice</p>
                </NavLink>
                <NavLink to='premium' className={({isActive}) => isActive? 'stat active' : 'stat'}>
                    <Gem/>
                    <p>Premium</p>
                </NavLink>
                <NavLink to='settings' className={({isActive}) => isActive? 'stat active' : 'stat'}>
                    <Settings/>
                    <p>Settings</p>
                </NavLink>
            </section>

            <section className="bottom">

                <article id="profile">
                    <span className="profile-left">
                        <img className="profile-img" src={user?.photo} alt = 'profile' />
                    </span>

                    <span className="profile-right">
                        <p className="profile-name">
                            {user?.displayName}
                        </p>
                        <p className={!hasPremium? 'profile-plan' : 'profile-plan purple-txt'}>
                            {!hasPremium? 'Free Plan' : 'Premium'}
                        </p>
                    </span>
                </article>
            </section>
        </aside>

        <main className="content">
            <Outlet />
        </main>
    </section>
    </>
    )
}

export default Dashboard