# Booking.com No-Shows 🏨

A Chrome extension designed to automate the process of marking no-show reservations on Booking.com's extranet platform. This extension helps property managers efficiently handle multiple no-show bookings while automatically skipping reservations with virtual credit cards or those that have already been paid.

## ✨ Features

* **Automated No-Show Processing**
  * Handles multiple reservations simultaneously
  * Smart detection and processing algorithms
  * Streamlined workflow automation

* **Intelligent Booking Detection**
  * Automatically identifies and skips:
    * Virtual credit card (VCC) bookings
    * Successfully charged payments
    * Online paid reservations

* **User-Friendly Interface**
  * Draggable widget for convenient positioning
  * Real-time progress tracking
  * Detailed status updates for all processed bookings

## 🚀 Installation

1. Clone this repository or download the ZIP file
```bash
git clone https://github.com/rprasai17/booking-com-no-shows.git
```

2. Navigate to Chrome Extensions
   * Open Chrome and go to `chrome://extensions/`
   * Enable **"Developer mode"** in the top right corner
   * Click **"Load unpacked"** and select the extension directory

## 💡 Usage

1. Access your Booking.com extranet account
2. Open desired no-show reservations in separate tabs
3. Launch the extension widget from your Chrome toolbar
4. Click **"Process No-Shows"** to begin automation
5. Monitor real-time processing status and results

## 🔍 Features in Detail

### **Automated Processing**
* Intelligent "Mark as no-show" button detection
* Automatic fee waiver selection
* Streamlined confirmation process

### **Smart Skipping Logic**
The extension automatically bypasses:
* Virtual credit card reservations
* Pre-charged bookings
* Guest online payments

### **Progress Monitoring**
Real-time tracking of:
* ✅ Successfully processed no-shows
* 🔄 VCC skipped reservations
* 💰 Pre-paid booking detections
* ⏭️ Other skipped cases

## 🛠️ Technical Requirements

* Google Chrome Browser
* Booking.com extranet access
* No-show marking permissions

## 📁 Files Structure

```
├── manifest.json
├── background.js
├── content.js
├── widget-styles.css
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 🔐 Required Permissions

* `activeTab`: Tab interaction capabilities
* `scripting`: Webpage script injection
* `tabs`: Browser tab management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch:
```bash
git checkout -b feature/AmazingFeature
```
3. Commit your changes:
```bash
git commit -m 'Add some AmazingFeature'
```
4. Push to the branch:
```bash
git push origin feature/AmazingFeature
```
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**Important:** This extension is not affiliated with, endorsed by, or connected to Booking.com. Use at your own discretion and in accordance with Booking.com's terms of service.

## 💬 Support

For support, please [open an issue](https://github.com/rprasai17/booking-com-no-shows/issues) in the GitHub repository.

## 👤 Author

[Rupan Prasai]

---

