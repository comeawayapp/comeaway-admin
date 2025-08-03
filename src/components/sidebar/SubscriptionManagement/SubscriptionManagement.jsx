import React, { useState } from 'react';
import ReactPaginate from 'react-paginate';

const SubscriptionManagement = ({ subscriptions }) => {
    const [searchTransactionIdQuery, setSearchTransactionIdQuery] = useState('');
    const [searchUserIdQuery, setSearchUserIdQuery] = useState('');
    const [searchUserNameQuery, setSearchUserNameQuery] = useState('');
    const [searchPurchaseDateQuery, setSearchPurchaseDateQuery] = useState('');
    const [searchExpiryDateQuery, setSearchExpiryDateQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;

    // Dummy subscriptions data
    // const dummySubscriptions = [
    //     { id: 1, userId: 101, userName: 'John Doe', purchaseDate: '2025-02-01', expiryDate: '2026-02-01' },
    //     { id: 2, userId: 102, userName: 'Jane Doe', purchaseDate: '2025-03-01', expiryDate: '2026-03-01' },
    //     { id: 3, userId: 103, userName: 'Alice Smith', purchaseDate: '2025-04-01', expiryDate: '2026-04-01' },
    //     { id: 4, userId: 104, userName: 'Bob Johnson', purchaseDate: '2025-05-01', expiryDate: '2026-05-01' },
    //     { id: 5, userId: 105, userName: 'Charlie Brown', purchaseDate: '2025-06-01', expiryDate: '2026-06-01' },
    //     { id: 6, userId: 106, userName: 'David Williams', purchaseDate: '2025-07-01', expiryDate: '2026-07-01' },
    //     { id: 7, userId: 107, userName: 'Eve Davis', purchaseDate: '2025-08-01', expiryDate: '2026-08-01' },
    // ];

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        if (name === 'transactionId') setSearchTransactionIdQuery(value);
        if (name === 'userId') setSearchUserIdQuery(value);
        if (name === 'userName') setSearchUserNameQuery(value);
        if (name === 'purchaseDate') setSearchPurchaseDateQuery(value);
        if (name === 'expiryDate') setSearchExpiryDateQuery(value);
        setCurrentPage(0); // Reset to first page on search
    };

    const handlePageClick = (data) => {
        setCurrentPage(data.selected);
    };

    const filteredSubscriptions = dummySubscriptions.filter(subscription =>
        subscription.id.toString().includes(searchTransactionIdQuery) &&
        subscription.userId.toString().includes(searchUserIdQuery) &&
        subscription.userName.toLowerCase().includes(searchUserNameQuery.toLowerCase()) &&
        subscription.purchaseDate.includes(searchPurchaseDateQuery) &&
        subscription.expiryDate.includes(searchExpiryDateQuery)
    );

    const offset = currentPage * itemsPerPage;
    const currentPageData = filteredSubscriptions.slice(offset, offset + itemsPerPage);

    return (
        <div className="container mx-auto p-4">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-center mt-6">Subscription Management</h1>
            </div>
            <div className="container mx-auto p-4 bg-white rounded shadow-md">
                <div className="mb-4 grid grid-cols-5 gap-4">
                    <input
                        type="text"
                        placeholder="Search Transaction ID"
                        name="transactionId"
                        value={searchTransactionIdQuery}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Search User ID"
                        name="userId"
                        value={searchUserIdQuery}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Search User Name"
                        name="userName"
                        value={searchUserNameQuery}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Search Purchase Date"
                        name="purchaseDate"
                        value={searchPurchaseDateQuery}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Search Expiry Date"
                        name="expiryDate"
                        value={searchExpiryDateQuery}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">Transaction ID</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">User ID</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">User Name</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">Purchase Date</th>
                                <th className="py-2 px-4 border-b border-gray-300 text-left bg-gray-100">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPageData.map((subscription, index) => (
                                <tr key={subscription.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b border-gray-300">{offset + index + 1}</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{subscription.userId}</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{subscription.userName}</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{subscription.purchaseDate}</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{subscription.expiryDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <ReactPaginate
                        previousLabel={"Previous"}
                        nextLabel={"Next"}
                        breakLabel={"..."}
                        pageCount={Math.ceil(filteredSubscriptions.length / itemsPerPage)}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={5}
                        onPageChange={handlePageClick}
                        containerClassName={"pagination flex space-x-2"}
                        pageClassName={"page-item"}
                        pageLinkClassName={"page-link px-3 py-1 border rounded"}
                        previousLinkClassName={"page-link px-3 py-1 border rounded"}
                        nextLinkClassName={"page-link px-3 py-1 border rounded"}
                        breakLinkClassName={"page-link px-3 py-1 border rounded"}
                        activeClassName={"active"}
                        activeLinkClassName={"bg-gray-300 text-white"}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagement;