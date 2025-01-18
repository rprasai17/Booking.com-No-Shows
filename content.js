// content.js
let widget = null;
let currentProcessedCount = 0;
let currentSkippedCount = 0;
let currentVccCount = 0;
let currentPaidCount = 0;


// Add this function to content.js
function createWidget() {
  widget = document.createElement('div');
  widget.id = 'no-show-widget';
  widget.innerHTML = `
      <div class="widget-header">
          <h2 class="widget-title">No-Show Automator</h2>
          <div class="widget-controls">
              <button class="control-button" id="close-widget" title="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6L18 18"></path>
                  </svg>
              </button>
          </div>
      </div>
      <div class="widget-content">
          <div class="info-box">
              <p>This extension will skip bookings with:</p>
              <ol>
                  <li>Virtual credit cards</li>
                  <li>Successfully charged payments</li>
                  <li>Online paid reservations</li>
              </ol>
          </div>
          <button id="automateButton" class="button">
              <span>Process No-Shows</span>
          </button>
          <div id="statusMessage" class="status-message" style="display: none;"></div>
          <div id="progressContainer" class="progress-container" style="display: none;">
              <div class="progress-details">
                  <div class="stat">
                      <span class="label">Processed:</span>
                      <span id="processedCount" class="count success">0</span>
                  </div>
                  <div class="stat">
                      <span class="label">VCC Skipped:</span>
                      <span id="vccCount" class="count warning">0</span>
                  </div>
                  <div class="stat">
                      <span class="label">Paid Skipped:</span>
                      <span id="paidCount" class="count paid">0</span>
                  </div>
                  <div class="stat">
                      <span class="label">Other Skipped:</span>
                      <span id="skippedCount" class="count info">0</span>
                  </div>
              </div>
          </div>
      </div>
  `;
  document.body.appendChild(widget);

  // Close button functionality
  const closeButton = document.getElementById('close-widget');
  if (closeButton) {
      closeButton.addEventListener('click', (e) => {
          e.stopPropagation();
          widget.style.display = 'none';
      });
  }

  // Make widget draggable
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const header = widget.querySelector('.widget-header');
  if (header) {
      header.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
  }

  function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      if (e.target === header) {
          isDragging = true;
      }
  }

  function drag(e) {
      if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          xOffset = currentX;
          yOffset = currentY;
          setTranslate(currentX, currentY, widget);
      }
  }

  function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
  }

  // Add the automation button click handler
  const automateButton = document.getElementById('automateButton');
  if (automateButton) {
      automateButton.addEventListener('click', async () => {
          console.log('Automation button clicked');
          try {
              // Visual feedback
              automateButton.style.transform = 'scale(0.98)';
              setTimeout(() => {
                  automateButton.style.transform = 'scale(1)';
              }, 100);

              // Disable button while processing
              automateButton.disabled = true;

              // Update status message
              const statusElement = document.getElementById('statusMessage');
              if (statusElement) {
                  statusElement.style.display = 'block';
                  statusElement.className = 'status-message info';
                  statusElement.textContent = 'Starting automation...';
              }

              // Show progress container
              const progressContainer = document.getElementById('progressContainer');
              if (progressContainer) {
                  progressContainer.style.display = 'block';
              }

              // Send message to background script
              chrome.runtime.sendMessage({ 
                  action: "startAutomation",
                  url: window.location.href
              }).catch(error => {
                  console.error('Failed to send message:', error);
                  handleAutomationError('Failed to start automation: ' + error.message);
                  automateButton.disabled = false;
              });

          } catch (error) {
              console.error('Error in automation button click handler:', error);
              handleAutomationError(error.message);
              automateButton.disabled = false;
          }
      });
  }
}


// Utility functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           element.offsetParent !== null;
}

const observeDOM = (callback) => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                callback(mutation.addedNodes);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    return observer;
};

const waitForElement = async (selector, context = document, timeout = 10000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        const element = context.querySelector(selector);
        if (element && isElementVisible(element)) {
            await delay(500);
            return element;
        }
        await delay(200);
    }
    return null;
};

const findNoShowButton = async () => {
  console.log('Looking for no-show button...');
  
  // Wait for any loading states to complete
  await delay(1000);

  const buttonSelectors = [
      'button.bui-button--secondary.bui-button--wide',
      'button[type="button"].bui-button--secondary',
      'button.bui-button--secondary'
  ];

  for (const selector of buttonSelectors) {
      const buttons = Array.from(document.querySelectorAll(selector));
      for (const button of buttons) {
          if (button.textContent.includes('Mark as a no show') && ensureElementIsClickable(button)) {
              console.log('Found valid no-show button:', button.outerHTML);
              return button;
          }
      }
  }

  // Fallback to XPath
  try {
      const xpath = "//button[contains(@class, 'bui-button--secondary') and .//span[contains(text(), 'Mark as a no show')]]";
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const button = result.singleNodeValue;
      if (button && ensureElementIsClickable(button)) {
          console.log('Found button by XPath');
          return button;
      }
  } catch (e) {
      console.log('XPath search failed:', e);
  }

  console.log('No button found with any method');
  return null;
};

async function checkAndAutomate() {
  try {
      console.log('Starting automation check...');
      console.log('Current URL:', window.location.href);

      // Initial page load wait
      await delay(2000);

      // Check for VCC and paid status first
      const vccResult = await checkForVCC();
      if (vccResult) {
          return { status: 'vcc', reason: vccResult };
      }

      const paidResult = await checkForPaidStatus();
      if (paidResult) {
          return { status: 'paid', reason: paidResult };
      }

      // Find and click no-show button
      const noShowButton = await findNoShowButton();
      if (!noShowButton) {
          console.log('No no-show button found');
          return { status: 'skipped', reason: 'No no-show button found' };
      }

      // Ensure button is in viewport
      noShowButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(1000);

      // Click button and wait for modal
      console.log('Clicking no-show button...');
      noShowButton.click();
      
      // Wait longer for modal to appear and be fully loaded
      await delay(3000);

      // More specific modal selection
      const modal = document.querySelector('.bui-modal.bui-is-active');
      if (!modal) {
          console.log('Modal not found');
          return { status: 'skipped', reason: 'Modal not found' };
      }

      console.log('Modal found, looking for radio button...');

      // More specific radio button selection
      const radioButton = modal.querySelector('input[id^="waive-no-show-fees-yes-"]');
      if (!radioButton) {
          console.log('Radio button not found in modal');
          return { status: 'skipped', reason: 'Radio button not found' };
      }

      console.log('Radio button found, clicking...');
      radioButton.click();
      radioButton.checked = true;
      
      // Dispatch change event to ensure proper event handling
      radioButton.dispatchEvent(new Event('change', { bubbles: true }));
      
      await delay(2000);

      // More specific confirm button selection
      const confirmButton = modal.querySelector('button[type="submit"].bui-button--destructive');
      if (!confirmButton) {
          console.log('Confirm button not found in modal');
          return { status: 'skipped', reason: 'Confirm button not found' };
      }

      console.log('Confirm button found, clicking...');
      confirmButton.click();
      
      // Wait for confirmation
      await delay(3000);

      console.log('Successfully processed no-show');
      return { status: 'processed', reason: 'Success' };
  } catch (error) {
      console.error('Error in automation:', error);
      return { status: 'skipped', reason: error.message };
  }
}

function ensureElementIsClickable(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const isVisible = rect.width > 0 && 
                   rect.height > 0 && 
                   window.getComputedStyle(element).display !== 'none' &&
                   window.getComputedStyle(element).visibility !== 'hidden';
  
  if (!isVisible) return false;

  // Check if element is not disabled
  if (element.hasAttribute('disabled')) return false;

  // Check if element is not covered by other elements
  const elementAtPoint = document.elementFromPoint(
      rect.left + rect.width/2,
      rect.top + rect.height/2
  );

  return element.contains(elementAtPoint) || elementAtPoint.contains(element);
}

async function checkForVCC() {
    const vccSelectors = [
        'p.res-vcc-expiration',
        '.virtual-card-info',
        '[data-test-id="virtual-credit-card"]',
        '.vcc-details',
        '.virtual-card-details'
    ];

    for (const selector of vccSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log('VCC element found:', selector);
            return 'Virtual credit card element found';
        }
    }

    const paymentSection = document.querySelector('.payment-details, .payment-info, .card-details');
    if (paymentSection) {
        const paymentText = paymentSection.innerText;
        const vccMatches = [
            'Virtual credit card',
            'Virtual card balance:',
            'VCC Amount:',
            'Virtual Card Number:'
        ];

        for (const match of vccMatches) {
            if (paymentText.includes(match)) {
                return 'Virtual credit card text found';
            }
        }
    }

    return null;
}

async function checkForPaidStatus() {
    const paidMatches = [
        'You successfully charged the total amount on this card:',
        'The guest has paid for this reservation online',
        'Payment successfully processed'
    ];

    const pageText = document.body.innerText;
    for (const match of paidMatches) {
        if (pageText.includes(match)) {
            return 'Payment already processed';
        }
    }

    return null;
}



// Message Handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message.action);
  
  switch (message.action) {
      case "ping":
          sendResponse(true);
          break;
      case "toggleWidget":
          toggleWidget();
          sendResponse(true);
          break;
      case "automationStarted":
          console.log('Automation started with', message.tabCount, 'tabs');
          handleAutomationStarted(message.tabCount);
          sendResponse(true);
          break;
      case "processCurrentTab":
          console.log('Processing current tab', message.currentTab, 'of', message.totalTabs);
          handleProcessCurrentTab(message.currentTab, message.totalTabs).then(sendResponse);
          return true;
      case "updateProgress":
          console.log('Updating progress');
          handleProgressUpdate(message.result, message.currentTab, message.totalTabs);
          sendResponse(true);
          break;
      case "automationComplete":
          console.log('Automation complete');
          handleAutomationComplete();
          sendResponse(true);
          break;
      case "automationError":
          console.log('Automation error:', message.error);
          handleAutomationError(message.error);
          sendResponse(true);
          break;
  }
});

function handleAutomationStarted(tabCount) {
  const elements = {
      status: document.getElementById('statusMessage'),
      progress: document.getElementById('progressContainer'),
      button: document.getElementById('automateButton')
  };

  if (!elements.status || !elements.progress || !elements.button) {
      console.error('Required elements not found');
      return;
  }

  // Reset counters
  currentProcessedCount = 0;
  currentSkippedCount = 0;
  currentVccCount = 0;
  currentPaidCount = 0;

  // Update UI
  elements.status.className = 'status-message info';
  elements.status.style.display = 'block';
  elements.progress.style.display = 'block';
  elements.status.textContent = `Found ${tabCount} booking tabs to process...`;
  elements.button.disabled = true;

  // Reset counter displays
  ['processed', 'skipped', 'vcc', 'paid'].forEach(type => {
      const element = document.getElementById(`${type}Count`);
      if (element) element.textContent = '0';
  });
}

async function handleProcessCurrentTab(currentTab, totalTabs) {
  try {
      const result = await checkAndAutomate();
      return result;
  } catch (error) {
      console.error('Error processing tab:', error);
      return { status: 'skipped', reason: error.message };
  }
}

function handleProgressUpdate(result, currentTab, totalTabs) {
  const elements = {
      status: document.getElementById('statusMessage'),
      processed: document.getElementById('processedCount'),
      skipped: document.getElementById('skippedCount'),
      vcc: document.getElementById('vccCount'),
      paid: document.getElementById('paidCount')
  };

  if (!result) {
      currentSkippedCount++;
      elements.skipped.textContent = currentSkippedCount;
      return;
  }

  switch(result.status) {
      case 'processed':
          currentProcessedCount++;
          elements.processed.textContent = currentProcessedCount;
          elements.status.textContent = `Processing tab ${currentTab} of ${totalTabs}...`;
          break;
      case 'vcc':
          currentVccCount++;
          elements.vcc.textContent = currentVccCount;
          elements.status.textContent = `Skipped tab ${currentTab} (Virtual Credit Card)`;
          break;
      case 'paid':
          currentPaidCount++;
          elements.paid.textContent = currentPaidCount;
          elements.status.textContent = `Skipped tab ${currentTab} (Already Paid)`;
          break;
      default:
          currentSkippedCount++;
          elements.skipped.textContent = currentSkippedCount;
          elements.status.textContent = `Skipped tab ${currentTab} (${result.reason})`;
  }
}

function handleAutomationComplete() {
  const elements = {
      status: document.getElementById('statusMessage'),
      button: document.getElementById('automateButton')
  };

  if (elements.status && elements.button) {
      elements.status.textContent = `Complete! Processed: ${currentProcessedCount}, VCC: ${currentVccCount}, Paid: ${currentPaidCount}, Other Skipped: ${currentSkippedCount}`;
      elements.status.className = 'status-message success';
      elements.button.disabled = false;
  }
}

function handleAutomationError(error) {
  const elements = {
      status: document.getElementById('statusMessage'),
      button: document.getElementById('automateButton')
  };

  if (elements.status && elements.button) {
      elements.status.textContent = `Error: ${error}`;
      elements.status.className = 'status-message error';
      elements.button.disabled = false;
  }
}

// Widget Management
function toggleWidget() {
  if (widget) {
      widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
  } else {
      createWidget();
  }
}

// Initialize the widget
if (document.readyState === 'complete') {
  createWidget();
} else {
  window.addEventListener('load', createWidget);
}

// Start DOM observer
const observer = observeDOM((nodes) => {
  nodes.forEach(node => {
      if (node.classList && node.classList.contains('bui-modal__content')) {
          console.log('Modal detected dynamically');
      }
  });
});