import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { treeData } from "@/constant/modules";
import { MdClose } from "react-icons/md";

function flattenTreeData(data) {
    let flattened = [];
    data.forEach(item => {
        flattened.push({ title: item.title, url: item.url });
        if (item.children) {
            flattened = flattened.concat(flattenTreeData(item.children));
        }
    });
    return flattened;
}

export default function GlobalSearch({ firstHeaderVisible }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const ref = useRef();

    useEffect(() => {
        if (firstHeaderVisible) {
            ref.current?.focus();
        }
    }, [firstHeaderVisible]);

    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (!term) {
            setResults([]);
            setIsVisible(false);
            return;
        }

        const flattenedData = flattenTreeData(treeData);
        const filteredResults = flattenedData.filter(item =>
            item.title.toLowerCase().includes(term)
        );

        setResults(filteredResults);
        setIsVisible(true);
    };

    const handleRedirect = (url) => {
        if (url) router.push(url);
        setResults([]);
        setIsVisible(false);
    };

    const clearSearch = () => {
        setSearchTerm("");
        setResults([]);
        setIsVisible(false);
    };

    return (
        <div className="relative w-full max-w-3xl mr-5">
            {/* Search Input */}
            <input
                ref={ref}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full h-9 px-4 text-lg rounded dark:bg-input shadow-md  focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            {/* Search Results Dropdown */}
            {isVisible && results.length > 0 && (
                <div className="absolute left-0 right-0  top-20 mt-2 bg-white dark:bg-input border border-gray-300 shadow-lg rounded-lg max-h-64 overflow-y-auto z-50">
                    {/* Close Button */}
                    <button
                        onClick={clearSearch}
                        className="absolute top-2 right-2"
                    >
                        <MdClose size={24} />
                    </button>

                    {/* Results List */}
                    <ul className="p-2">
                        {results.map((result, index) => (
                            <li
                                key={index}
                                onClick={() => handleRedirect(result.url)}
                                className="p-3 rounded-lg  cursor-pointer transition duration-200 hover:bg-off hover:bg-opacity-20 dark:hover:bg-primary dark:hover:bg-opacity-20 "
                            >
                                {result.title}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
