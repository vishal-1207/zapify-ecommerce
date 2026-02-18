import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalItems, 
    itemsPerPage, 
    onPageChange 
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Calculate page numbers to show (simple version: show all or max 5-7)
    // For now, let's just show a simple range or all if few.
    // Enhanced logic: always show first, last, current, and neighbors.
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show 1
            pages.push(1);
            
            // Calculate start/end neighbors
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if near start or end
            if (currentPage <= 3) {
                end = Math.max(4, end); // Ensure we show at least up to 4
            }
            if (currentPage >= totalPages - 2) {
                start = Math.min(totalPages - 3, start);
            }

            if (start > 2) pages.push('...');

            for (let i = start; i <= end; i++) {
                if (i > 1 && i < totalPages) pages.push(i);
            }

            if (end < totalPages - 1) pages.push('...');
            
            // Always show last
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center space-x-2 mt-8">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${currentPage === 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-indigo-600'}`}
            >
                <ChevronLeft size={20} />
            </button>

            {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                    {page === '...' ? (
                        <span className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                        <button
                            onClick={() => onPageChange(page)}
                            className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-indigo-600'
                            }`}
                        >
                            {page}
                        </button>
                    )}
                </React.Fragment>
            ))}

            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${currentPage === totalPages ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-indigo-600'}`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default Pagination;
