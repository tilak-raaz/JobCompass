import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#242424] text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.h1 
          className="text-8xl font-bold text-purple-500 mb-4"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-8">Sorry, the page you're looking for doesn't exist or has been moved.</p>
        <Link 
          to="/" 
          className="inline-block bg-gradient-to-r from-purple-600 via-purple-400 to-blue-500 text-white px-6 py-3 font-bold rounded-md hover:opacity-80 transition duration-300"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;