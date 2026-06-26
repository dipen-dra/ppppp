import React from 'react';
import { LayoutDashboard, CalendarDays, User, LogOut, X, CreditCard, PlusCircle, MessageSquare } from 'lucide-react';
import UserNavLink from './UserNavLink';

const UserSidebarContent = ({ activePage, onLogoutClick, onMenuClose, unreadChatCount }) => {
  return (
    <div className="flex flex-col h-full bg-[#F5F3E7] border-r border-black/08">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-black/07">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" fill="#F5C000" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Inter,sans-serif" fill="#111118">M</text>
            </svg>
          </div>
          <div>
            <span className="text-lg font-black text-[#111118]">Moto</span>
            <span className="text-lg font-black text-[#B8860B]">Fix</span>
            <span className="text-[10px] font-semibold text-[#8A8AA8] uppercase tracking-widest block -mt-0.5">My Account</span>
          </div>
        </div>
        {onMenuClose && (
          <button onClick={onMenuClose} className="lg:hidden text-[#8A8AA8] hover:text-[#111118] transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto bg-[#F5F3E7]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8AA8] px-3 mb-3">Dashboard</p>
        <UserNavLink to="/user/dashboard"   icon={LayoutDashboard} activePage={activePage} pageName="dashboard">Dashboard</UserNavLink>
        <UserNavLink to="/user/bookings"    icon={CalendarDays}    activePage={activePage} pageName="bookings">My Bookings</UserNavLink>
        <UserNavLink to="/user/my-payments" icon={CreditCard}      activePage={activePage} pageName="my-payments">Payments</UserNavLink>
        <UserNavLink to="/user/new-booking" icon={PlusCircle}      activePage={activePage} pageName="new-booking">New Booking</UserNavLink>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8AA8] px-3 mb-3 mt-5">Account</p>
        <UserNavLink to="/user/profile"     icon={User}            activePage={activePage} pageName="profile">Profile</UserNavLink>
        <UserNavLink to="/user/chat"        icon={MessageSquare}   activePage={activePage} pageName="chat" badgeCount={unreadChatCount}>Chat</UserNavLink>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-black/07 bg-[#F5F3E7]">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                     text-[rgba(220,38,38,0.7)] hover:text-[#DC2626] hover:bg-[rgba(220,38,38,0.07)]
                     transition-all duration-200 cursor-pointer"
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default UserSidebarContent;