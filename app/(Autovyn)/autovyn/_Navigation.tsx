import Navbar from "./_Navbar";
import NextBreadcrumb from "@/components/molecule/convertBreadcrumb";

const Navigation = ({ children }) => {
  return (
    <Navbar>
      <NextBreadcrumb
        homeElement={"Branch"}
        separator={<span className="text-gray-400 mx-1">›</span>}
        activeClasses="bg-primary text-white "
        containerClasses="flex flex-wrap gap-2 items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-2 rounded-xl "
        listClasses="px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-primary/10 hover:text-primary mx-1"
        capitalizeLinks
      />
      {children}
    </Navbar>
  );
};

export default Navigation;