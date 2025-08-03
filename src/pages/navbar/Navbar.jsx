import React from 'react';
import { FaSearch, FaUser } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import companyname from '../../assets/companyname.png';

function Navbar() {
  return (
    <nav className="bg-gray-900 items-center py-4 px-8 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-8 mr-2" />
          <img src={companyname} alt="Company Name" className="h-8 w-60" />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;