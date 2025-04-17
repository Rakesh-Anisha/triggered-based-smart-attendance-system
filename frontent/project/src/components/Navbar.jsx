import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/admin">Admin Dashboard</Link>
      <Link to="/teacher">Teacher Dashboard</Link>
    </nav>
  );
}

export default Navbar;