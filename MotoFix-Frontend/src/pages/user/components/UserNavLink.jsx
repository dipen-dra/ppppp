import React from 'react';
import { Link } from 'react-router-dom';

const UserNavLink = ({ to, icon: Icon, children, badgeCount, activePage, pageName }) => {
    const isActive = activePage === pageName || (pageName === 'dashboard' && activePage === '');

    return (
        <Link to={to} className={`sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={17} />
            <span className="flex-1">{children}</span>
            {badgeCount > 0 && (
                <span className="bg-[#F5C000] text-[#0D0D14] text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                    {badgeCount}
                </span>
            )}
        </Link>
    );
};

export default UserNavLink;