import React from 'react';
import chatbotApi from '../../api/chatbotApi';

const createActionProvider = (user) => {
    class ActionProvider {
        constructor(createChatBotMessage, setStateFunc) {
            this.createChatBotMessage = createChatBotMessage;
            this.setState = setStateFunc;
            this.user = user;
        }

        // --- Helper to create and update state with a bot message ---
        updateChatbotState(message, stateChanges = {}) {
            this.setState((prevState) => ({
                ...prevState,
                ...stateChanges,
                messages: [...prevState.messages, message],
            }));
        }

        // --- Helper to get contextual options ---
        getOptions = () => {
            const guestOptions = [
                // THIS NOW CALLS THE NEW DEDICATED HANDLER
                { text: 'Our Services', handler: this.showServiceOptions, id: 1 },
                { text: 'Payment Options', handler: this.handlePaymentInquiry, id: 2 },
                { text: 'How to Book', handler: this.handleBookingInquiry, id: 3 },
            ];
            
            if (!this.user) {
                return guestOptions;
            }

            if (this.user.role === 'admin') {
                return [
                    { text: 'My Profile', handler: this.handleProfileInquiry, id: 4 },
                    { text: 'Total Bookings', handler: this.handleAdminTotalBookings, id: 5 },
                    { text: 'Pending Bookings', handler: this.handleAdminPendingBookings, id: 6 },
                    { text: 'Total Revenue', handler: this.handleAdminRevenue, id: 7 },
                    { text: 'View Services List', handler: this.showServiceOptions, id: 1 }, // Added for admin
                ];
            } else { // Regular User
                return [
                    { text: 'My Profile', handler: this.handleProfileInquiry, id: 8 },
                    { text: 'My Bookings', handler: this.handleUserBookings, id: 9 },
                    { text: 'Upcoming Bookings', handler: this.handleUserUpcomingServices, id: 10 },
                    { text: 'My Loyalty Points', handler: this.handleUserLoyaltyPoints, id: 11 },
                     // THIS NOW CALLS THE NEW DEDICATED HANDLER
                    { text: 'Our Services', handler: this.showServiceOptions, id: 1 },
                ];
            }
        }
        
        // --- NEW: Dedicated action to show the service options widget ---
        showServiceOptions = async () => {
            try {
                const response = await chatbotApi.get('/chatbot/services');
                const services = response.data.data;

                if (services && services.length > 0) {
                    const botMessage = this.createChatBotMessage(
                        "Of course! Here are our services. Select one to see more details.",
                        { widget: 'serviceOptions' }
                    );
                    this.updateChatbotState(botMessage, { services }); // Pass services to state for the widget
                } else {
                    this.updateChatbotState(this.createChatBotMessage("We don't have any services listed right now."));
                }
            } catch (error) {
                console.error("Chatbot API Error:", error);
                this.updateChatbotState(this.createChatBotMessage("Sorry, I couldn't fetch our services right now. Please try again in a moment."));
            }
        };

        // --- Action to show help options ---
        handleHelp = () => {
            const options = this.getOptions();
            const botMessage = this.createChatBotMessage(
                "No problem, here are some things I can help with:",
                { widget: 'generalOptions' }
            );
            this.updateChatbotState(botMessage, { options });
        };
        
        // --- Generic Actions ---
        greet = () => {
            const options = this.getOptions();
            const greetingMessage = this.createChatBotMessage(
                "Hello! How can I assist you today?",
                { widget: 'generalOptions' }
            );
            this.updateChatbotState(greetingMessage, { options });
        }

        handleUnknown = () => {
            const options = this.getOptions();
            const message = this.createChatBotMessage(
                "I'm sorry, I don't understand. Maybe one of these options will help?",
                { widget: 'generalOptions' }
            );
            this.updateChatbotState(message, { options });
        }
        
        handleInitialOptions = (payload) => {
             if (payload.initial) {
                const options = this.getOptions();
                const message = this.createChatBotMessage(
                    "Great! What would you like to know?",
                    { widget: 'generalOptions' }
                );
                 this.updateChatbotState(message, { options });
             }
        };

        handlePaymentInquiry = () => {
            const message = this.createChatBotMessage(
                <>
                    We offer multiple payment options for your convenience:
                    <p style={{margin: '4px 0'}}>- Cash on Delivery (COD)</p>
                    <p style={{margin: '4px 0'}}>- eSewa</p>
                    <p style={{margin: '4px 0'}}>- Khalti (Currently under construction)</p>
                </>
            );
            this.updateChatbotState(message);
        }

        // This function now handles typed messages like "tell me about services" or "oil change"
        handleServicesInquiry = async (message = "") => {
             try {
                const response = await chatbotApi.get('/chatbot/services');
                const services = response.data.data;
                const serviceNames = services.map(s => s.name.toLowerCase());
                
                const foundService = serviceNames.find(name => message.includes(name));

                // If user typed a specific service name, show its details
                if (foundService) {
                    this.handleServiceDetail(foundService);
                    return;
                }

                // Otherwise, if they just typed "service" or something similar, show the options
                this.showServiceOptions();

            } catch (error) {
                console.error("Chatbot API Error:", error);
                this.updateChatbotState(this.createChatBotMessage("Sorry, I couldn't fetch services right now."));
            }
        }

        handleServiceDetail = async (serviceName) => {
            try {
                const response = await chatbotApi.get('/chatbot/services');
                const service = response.data.data.find(s => s.name.toLowerCase() === serviceName.toLowerCase());

                if (service) {
                    const message = this.createChatBotMessage(
                        <>
                            <strong>{service.name}</strong>
                            <p>{service.description}</p>
                            <p><strong>Price:</strong> रु{service.price}</p>
                            <p><strong>Estimated Time:</strong> {service.duration}</p>
                        </>
                    );
                    this.updateChatbotState(message);
                } else {
                    this.handleUnknown();
                }
            } catch (error) {
                 this.updateChatbotState(this.createChatBotMessage("Sorry, I had trouble finding details for that service."));
            }
        };

        handleBookingInquiry = () => {
            this.updateChatbotState(this.createChatBotMessage("To book a service, please log in, go to the services page, and choose the one you need."));
        }

        handleProfileInquiry = async () => {
            if (!this.user) return this.updateChatbotState(this.createChatBotMessage("Please log in to view your profile."));

            try {
                const response = await chatbotApi.get('/chatbot/profile');
                const profileData = response.data.data;
                let profileMessage;

                if (this.user.role === 'admin') {
                    profileMessage = this.createChatBotMessage(<><strong>Admin Profile:</strong><p><strong>Workshop:</strong> {profileData.workshopName || 'N/A'}</p><p><strong>Owner:</strong> {profileData.ownerName || 'N/A'}</p><p><strong>Email:</strong> {profileData.email || 'N/A'}</p><p><strong>Phone:</strong> {profileData.phone || 'N/A'}</p><p><strong>Address:</strong> {profileData.address || 'N/A'}</p></>);
                } else {
                     profileMessage = this.createChatBotMessage(<><strong>Your Profile:</strong><p><strong>Name:</strong> {profileData.fullName || 'N/A'}</p><p><strong>Email:</strong> {profileData.email || 'N/A'}</p><p><strong>Phone:</strong> {profileData.phone || 'N/A'}</p><p><strong>Address:</strong> {profileData.address || 'N/A'}</p></>);
                }
                this.updateChatbotState(profileMessage);

            } catch (error) {
                 console.error("Chatbot Profile Error:", error);
                 this.updateChatbotState(this.createChatBotMessage("Sorry, I was unable to retrieve your profile information."));
            }
        }
        
        // --- Admin-Specific Actions ---
        handleAdminTotalBookings = async () => {
            if (this.user?.role !== 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/admin-dashboard');
                const { totalBookings } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`You have a total of ${totalBookings} bookings in your system.`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch the total bookings count."));
            }
        }
        handleAdminPendingBookings = async () => {
            if (this.user?.role !== 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/admin-dashboard');
                const { pendingBookings, inProgressBookings } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`You have ${pendingBookings} pending and ${inProgressBookings} in-progress bookings.`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch admin data."));
            }
        }

        handleAdminRevenue = async () => {
            if (this.user?.role !== 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/admin-dashboard');
                const { totalRevenue } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`Your total revenue is रु${totalRevenue.toLocaleString()}.`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch your revenue data."));
            }
        }

        // --- User-Specific Actions ---
        handleUserBookings = async () => {
             if (!this.user || this.user.role === 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/user-dashboard');
                const { totalBookings } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`You have made a total of ${totalBookings} bookings with us.`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch your booking information."));
            }
        }
        
        handleUserUpcomingServices = async () => {
             if (!this.user || this.user.role === 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/user-dashboard');
                const { upcomingServices } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`You have ${upcomingServices} upcoming Booking(s) scheduled.`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch your upcoming bookings."));
            }
        }
        
        handleUserCompletedServices = async () => {
             if (!this.user || this.user.role === 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/user-dashboard');
                const { completedServices } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`You have ${completedServices} completed service(s).`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch your completed services."));
            }
        }

        handleUserLoyaltyPoints = async () => {
             if (!this.user || this.user.role === 'admin') return this.handleUnknown();
            try {
                const response = await chatbotApi.get('/chatbot/user-dashboard');
                const { loyaltyPoints } = response.data.data;
                this.updateChatbotState(this.createChatBotMessage(`You have ${loyaltyPoints} loyalty points.`));
            } catch (error) {
                this.updateChatbotState(this.createChatBotMessage("I couldn't fetch your loyalty points."));
            }
        }
    }
    return ActionProvider;
};

export default createActionProvider;