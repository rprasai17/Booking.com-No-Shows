Booking.com No-Shows
-----------------------------------------------------------------------------------
A Chrome extension designed to automate the process of marking no-show reservations on Booking.com's extranet platform. This extension helps property managers efficiently handle multiple no-show bookings while automatically skipping reservations with virtual credit cards or those that have already been paid.

Features
-----------------------------------------------------------------------------------

Automated no-show marking for multiple reservations
Automatically skips bookings with:
Virtual credit cards (VCC)
Successfully charged payments
Online paid reservations
Draggable widget interface
Real-time progress tracking
Status updates for processed and skipped reservations
Installation
Clone this repository or download the ZIP file
bash
Save
Copy
1
git clone https://github.com/yourusername/booking-com-no-shows.git
Open Chrome and navigate to chrome://extensions/
Enable "Developer mode" in the top right corner
Click "Load unpacked" and select the extension directory
Usage
Log in to your Booking.com extranet account
Open the reservations you want to process as no-shows in separate tabs
Click the extension icon in your Chrome toolbar to open the widget
Click "Process No-Shows" to start the automation
The extension will process each tab and provide status updates
Features in Detail
Automated Processing
Automatically identifies and clicks the "Mark as no-show" button
Selects "Yes" to waive no-show fees
Confirms the no-show marking
Smart Skipping
The extension automatically skips reservations that:

Have virtual credit cards attached
Have already been successfully charged
Were paid online by the guest
Progress Tracking
Real-time statistics for:

Successfully processed no-shows
VCC skipped reservations
Already paid reservations
Other skipped reservations
Technical Requirements
Google Chrome Browser
Access to Booking.com's extranet platform
Appropriate permissions to mark no-shows
Files Structure
Save
Copy
1
2
3
4
5
6
7
8
9
├── manifest.json
├── background.js
├── content.js
├── widget-styles.css
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
Permissions Required
activeTab: To interact with the current tab
scripting: To inject scripts into web pages
tabs: To access and modify browser tabs
Contributing
Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details

Disclaimer
This extension is not affiliated with, endorsed by, or connected to Booking.com. Use at your own discretion and in accordance with Booking.com's terms of service.

Support
For support, please open an issue in the GitHub repository.

Author
[Rupan Prasai]