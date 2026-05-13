import "./footer.css";
function Footer(){

    return (
        <div className ='footer-container'>
             <div className = "location">
                <h3>location</h3>
                <p> Somra</p>
                <p>Balagarh</p>
                <p>Hooghly</p>
                <p>West Bengal</p>
                <p>712123</p>
             </div>
             <div className="contact">
                <h3>Contact</h3>
                <p>test@gmail.com</p>
                <p>+91 xxxxxxxxxx</p>

             </div>
             <div className="quick-links">
                <h3>Quick Links</h3>
                <p>Home</p>
                <p>About</p>
                <p>Dashboard</p>
                <p>Contact</p>
                <p>Help</p>
             </div>
             <div className="social">
                <h3>Social</h3>
                <p>Facebook</p>
                <p>Twitter</p>
                <p>Instagram</p>
             </div>

        </div>
    );
}
export default Footer;