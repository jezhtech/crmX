import { Link } from "react-router-dom";

// Import the version from package.json
const APP_VERSION = "1.1.1";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white py-4 px-6 border-t text-center text-sm text-gray-500 w-full z-20">
      <div className="container mx-auto">
        <p>
          Copyright &copy; {currentYear} crmX | Developed by <a href="https://jezx.in" className="hover:text-primary" target="_blank" rel="noopener noreferrer">JezX</a> | 
          <a href="https://jezhtechnologies.com" className="hover:text-primary ml-1" target="_blank" rel="noopener noreferrer">Jezh Technologies</a>
          <span className="ml-2">•</span>
          <span className="ml-2">v{APP_VERSION}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 