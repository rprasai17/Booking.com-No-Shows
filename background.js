// background.js
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.includes('admin.booking.com')) {
      try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: "ping" }).catch(() => false);
          if (!response) {
              await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['content.js']
              });
              await chrome.scripting.insertCSS({
                  target: { tabId: tab.id },
                  files: ['widget-styles.css']
              });
          }
          await chrome.tabs.sendMessage(tab.id, { action: "toggleWidget" });
      } catch (error) {
          console.error('Error in background script:', error);
      }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startAutomation") {
      console.log('Received startAutomation message');
      
      // Query for all booking.com tabs
      chrome.tabs.query({
          url: "https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/booking.html*"
      }, async (tabs) => {
          try {
              console.log(`Found ${tabs.length} tabs to process`);
              
              // Notify content script that automation is starting
              await chrome.tabs.sendMessage(sender.tab.id, {
                  action: "automationStarted",
                  tabCount: tabs.length
              });

              // Process each tab
              for (let i = 0; i < tabs.length; i++) {
                  const tab = tabs[i];
                  console.log(`Processing tab ${i + 1} of ${tabs.length}`);

                  // Activate the tab
                  await chrome.tabs.update(tab.id, { active: true });
                  
                  try {
                      // Process the current tab
                      const result = await chrome.tabs.sendMessage(tab.id, {
                          action: "processCurrentTab",
                          currentTab: i + 1,
                          totalTabs: tabs.length
                      });

                      // Update progress
                      await chrome.tabs.sendMessage(sender.tab.id, {
                          action: "updateProgress",
                          result: result,
                          currentTab: i + 1,
                          totalTabs: tabs.length
                      });
                  } catch (error) {
                      console.error('Error processing tab:', error);
                  }

                  // Wait between tabs
                  await new Promise(resolve => setTimeout(resolve, 2000));
              }

              // Notify completion
              await chrome.tabs.sendMessage(sender.tab.id, {
                  action: "automationComplete"
              });
          } catch (error) {
              console.error('Error in automation:', error);
              await chrome.tabs.sendMessage(sender.tab.id, {
                  action: "automationError",
                  error: error.message
              });
          }
      });

      // Return true to indicate we'll respond asynchronously
      return true;
  }
});