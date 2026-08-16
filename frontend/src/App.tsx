import Tracker from './pages/Tracker'
import Home from './pages/Home';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tasks" element={<Tracker />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Signup />} />

            </Routes>
        </BrowserRouter>
    )
}

export default App