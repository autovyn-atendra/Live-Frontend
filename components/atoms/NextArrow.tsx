import { MdArrowBack, MdArrowForward } from "react-icons/md";

const NextArrow = ({ onClick }) => (
    <button
      className="absolute top-1/2 right-4 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 p-2 z-10"
      onClick={onClick}
      style={{ zIndex: 10 }} // Inline style for higher z-index
    >
      <MdArrowForward size={24} />
    </button>
  );


export default NextArrow