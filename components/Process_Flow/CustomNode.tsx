import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

const CustomNode = ({ data }) => {
    return (
        <motion.div
            initial={{ scale: 1 }}
            whileHover={{
                scale: 1.3,
                background: 'linear-gradient(90deg, #1565C0, #1E88E5)', // Darker blue on hover
                transition: { duration: 0 },
                borderRadius: '15px',
                boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.3)',
            }}
            whileTap={{ scale: 1, transition: { duration: 0.2 } }}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '300px',
                height: '150px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fff',
                textAlign: 'center',
                cursor: 'pointer',
            }}
        >
            {data.label}
        </motion.div>

    );
};

export default CustomNode;
