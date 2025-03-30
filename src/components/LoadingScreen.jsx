import { motion } from "framer-motion";

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-[#242424] text-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div 
          className="relative w-24 h-24 mx-auto mb-6"
        >
          <motion.div 
            className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-purple-600 border-r-blue-500 border-b-sky-400 border-l-purple-400"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        </motion.div>
        <motion.h2 
          className="text-2xl font-bold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.h2>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;