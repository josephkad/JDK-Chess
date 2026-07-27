import { BrowserRouter, Routes, Route, data } from 'react-router-dom'
import LandingPage from './pages/landingPage.tsx'
import PracticePage from './pages/Practice.tsx'
import Dashboard from './pages/dashboard.tsx'
import StatsPage from './pages/Stats.tsx'
import PremiumPage from './pages/Premium.tsx'
import SettingsPage from './pages/Settings.tsx'
import { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom'
import { userVar } from './userVar.tsx'

function App() {
    // States
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const port = 'http://localhost:3000'

    //Effects
    useEffect(() => {
        fetch(`${port}/api/user`, {
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) return null;
            return res.json();
        })
        .then(data => {
            setLoading(false);
            if (!data) {return;}
            setUser(data);
        })
        .catch(err => {
            console.error('Failed to fetch user:', err);
        })
        .finally(() => {
            setLoading(false);
        })
    }, []);

    if (loading) {
        return (<section className="spin-center v">
          <div className="spinner"></div>
        </section>)
    }
        
    return (
        <userVar.Provider value={{user, setUser}}>
            <BrowserRouter>
                <Routes>
                <Route path='/' element={user? <Navigate to='/dashboard/stats' replace /> : <LandingPage/>} />
            
                <Route path='/dashboard' element={user? <Dashboard/> : <Navigate to="/" replace />}>
                    <Route index element={<Navigate to="stats" replace />} />
                    <Route path='stats' element={<StatsPage/>} />
                    <Route path='practice' element={<PracticePage/>} />
                    <Route path='premium' element={<PremiumPage/>} />
                    <Route path='settings' element={<SettingsPage/>} />
                </Route>
                </Routes>
            </BrowserRouter>
        </userVar.Provider>
        
    )
}

export default App;