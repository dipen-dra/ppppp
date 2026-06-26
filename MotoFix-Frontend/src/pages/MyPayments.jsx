// Filename: pages/MyPayments.jsx

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const MyPayments = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // This effect runs when the component loads, checking for URL parameters
        // The 'location.search' gives you the query string (e.g., "?status=success&message=...")
        const params = new URLSearchParams(location.search);
        const status = params.get('status');
        const message = params.get('message');

        // If a status and message are found in the URL...
        if (status && message) {
            if (status === 'success') {
                toast.success(message);
            } else if (status === 'failure') {
                toast.error(message);
            }

            // This is an optional but recommended step:
            // It removes the query parameters from the URL in the browser's address bar.
            // This prevents the toast from re-appearing if the user refreshes the page.
            // 'location.pathname' is the current path without query params (e.g., '/user/my-payments')
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]); // This dependency array ensures the effect runs if the URL changes

    // ... Your existing logic to fetch and display the list of payments would go here

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">My Payments</h1>
            
            {/* Example of where you might display the list of payments */}
            <div className="bg-white shadow rounded-lg p-6">
                <p>Your payment history will be displayed here.</p>
                {/* You would typically have a map function here to list out payment records */}
            </div>
        </div>
    );
};

export default MyPayments;