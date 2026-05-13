import "./navbar.css"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Logo from "./assets/failsafe_logo.svg"

function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <div>
            <div className="navbar-container">
                <div className="logo">
                    <img src={Logo} alt="logo" /> 
                </div>  
                <div className="nav-links">
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About</Link></li>
                        {isAuthenticated && (
                            <li><Link to="/dashboard">Dashboard</Link></li>
                        )}
                    </ul>
                </div>  
                <div className="sign-in">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <span className="user-name">{user?.name}</span>
                            <button className="logout-btn" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <Link to="/login" className="signin-btn">Sign In</Link>
                    )}
                </div>  
            </div>  
        </div>
    );
}
export default Navbar;    
