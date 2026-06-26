const createMessageParser = (user) => {
    class MessageParser {
        constructor(actionProvider) {
            this.actionProvider = actionProvider;
            this.user = user;
        }

        parse(message) {
            const lowerCaseMessage = message.toLowerCase();

            // Handle the case of initial options being clicked
            if (message.includes("initial")) {
                this.actionProvider.handleInitialOptions(JSON.parse(message));
                return;
            }

            // --- ADD THIS BLOCK ---
            if (lowerCaseMessage.includes("help") || lowerCaseMessage.includes("options") || lowerCaseMessage === "?") {
                this.actionProvider.handleHelp();
            } 
            // --- END ADD ---

            // Check for the most specific phrases first to avoid incorrect matches.
            // Admin-Specific Commands
            else if (lowerCaseMessage.includes("total bookings")) {
                this.actionProvider.handleAdminTotalBookings();
            } else if (lowerCaseMessage.includes("pending") || lowerCaseMessage.includes("orders")) {
                this.actionProvider.handleAdminPendingBookings();
            } else if (lowerCaseMessage.includes("revenue") || lowerCaseMessage.includes("earnings")) {
                this.actionProvider.handleAdminRevenue();
            }
            // User-Specific Commands
            else if (lowerCaseMessage.includes("my bookings")) {
                this.actionProvider.handleUserBookings();
            } else if (lowerCaseMessage.includes("upcoming")) {
                this.actionProvider.handleUserUpcomingServices();
            } else if (lowerCaseMessage.includes("completed")) {
                this.actionProvider.handleUserCompletedServices();
            } else if (lowerCaseMessage.includes("loyalty") || lowerCaseMessage.includes("points")) {
                this.actionProvider.handleUserLoyaltyPoints();
            }
            // General Commands
            else if (lowerCaseMessage.includes("profile") || lowerCaseMessage.includes("my info")) {
                this.actionProvider.handleProfileInquiry();
            } else if (lowerCaseMessage.includes("service")) {
                this.actionProvider.handleServicesInquiry(lowerCaseMessage);
            } else if (lowerCaseMessage.includes("book")) {
                this.actionProvider.handleBookingInquiry();
            } else if (lowerCaseMessage.includes("payment")) {
                this.actionProvider.handlePaymentInquiry();
            } else if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes("hi")) {
                this.actionProvider.greet();
            }
            // Fallback for unrecognized input
            else {
                this.actionProvider.handleUnknown();
            }
        }
    }
    return MessageParser;
};

export default createMessageParser;