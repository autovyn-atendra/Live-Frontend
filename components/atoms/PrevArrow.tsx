import { MdArrowBack, MdArrowForward } from "react-icons/md";


const PrevArrow = ({ onClick }) => (
  <button
    className="absolute top-1/2 left-4 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 p-2 z-10"
    onClick={onClick}
    style={{ zIndex: 10 }} // Inline style for higher z-index
  >
    <MdArrowBack size={24} />
  </button>
);

export default  PrevArrow