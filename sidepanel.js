document.getElementById('automateButton').addEventListener('click', async () => {
    const statusElement = document.getElementById('statusMessage');
    const progressContainer = document.getElementById('progressContainer');
    const processedCountElement = document.getElementById('processedCount');
    const skippedCountElement = document.getElementById('skippedCount');
    const paidCountElement = document.getElementById('paidCount');
    const vccCountElement = document.getElementById('vccCount');
    const automateButton = document.getElementById('automateButton');
    
    try {
      automateButton.disabled = true;
      const tabs = await chrome.tabs.query({
        url: "https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/booking.html*"
      });
  
      statusElement.className = 'status-message info';
      statusElement.style.display = 'block';
      progressContainer.style.display = 'block';
      statusElement.textContent = `Found ${tabs.length} booking tabs to check...`;
  
      let processedCount = 0;
      let skippedCount = 0;
      let vccCount = 0;
      let paidCount = 0;
  
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        
        await chrome.tabs.update(tab.id, { active: true });
        
        try {
          const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: checkAndAutomate
          });
  
          if (!result || !result[0] || !result[0].result) {
            skippedCount++;
            skippedCountElement.textContent = skippedCount;
            continue;
          }
  
          const { status, reason } = result[0].result;
          
          switch(status) {
            case 'processed':
              processedCount++;
              processedCountElement.textContent = processedCount;
              statusElement.textContent = `Processing tab ${i + 1} of ${tabs.length}...`;
              break;
            case 'vcc':
              vccCount++;
              vccCountElement.textContent = vccCount;
              statusElement.textContent = `Skipped tab ${i + 1} (Virtual Credit Card)`;
              break;
            case 'paid':
              paidCount++;
              paidCountElement.textContent = paidCount;
              statusElement.textContent = `Skipped tab ${i + 1} (Already Paid)`;
              break;
            default:
              skippedCount++;
              skippedCountElement.textContent = skippedCount;
          }
        } catch (tabError) {
          console.error('Error processing tab:', tabError);
          skippedCount++;
          skippedCountElement.textContent = skippedCount;
        }
  
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
  
      statusElement.textContent = `Complete! Processed: ${processedCount}, VCC: ${vccCount}, Paid: ${paidCount}, Other Skipped: ${skippedCount}`;
      statusElement.className = 'status-message success';
    } catch (error) {
      statusElement.textContent = `Error: ${error.message}`;
      statusElement.className = 'status-message error';
    } finally {
      automateButton.disabled = false;
    }
  });
  
  function checkAndAutomate() {
    return new Promise(async (resolve, reject) => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Debug function to log page state
      const logPageState = () => {
        console.log('Current page state:');
        console.log('URL:', window.location.href);
        console.log('All buttons on page:', document.querySelectorAll('button').length);
        console.log('Page content:', document.body.innerHTML);
        console.log('Viewport size:', window.innerWidth, window.innerHeight);
        console.log('Document ready state:', document.readyState);
      };
  
      // Enhanced element waiting with mutation observer
      const waitForElement = (selector, context = document, timeout = 15000) => {
        console.log(`Waiting for element: ${selector}`);
        return new Promise((resolve) => {
          // First immediate check
          const element = context.querySelector(selector);
          if (element && element.offsetParent !== null) {
            console.log(`Element found immediately: ${selector}`);
            resolve(element);
            return;
          }
  
          // Set up mutation observer
          const observer = new MutationObserver((mutations, obs) => {
            const element = context.querySelector(selector);
            if (element && element.offsetParent !== null) {
              obs.disconnect();
              console.log(`Element found after mutation: ${selector}`);
              resolve(element);
            }
          });
  
          observer.observe(context, {
            childList: true,
            subtree: true,
            attributes: true
          });
  
          // Timeout
          setTimeout(() => {
            observer.disconnect();
            console.log(`Timeout waiting for element: ${selector}`);
            logPageState();
            resolve(null);
          }, timeout);
        });
      };
  
      // Find button by text using multiple strategies
      const findNoShowButton = async () => {
        console.log('Searching for no-show button...');
        logPageState();
  
        // Strategy 1: Direct button search
        const allButtons = Array.from(document.querySelectorAll('button'));
        console.log('Found buttons:', allButtons.map(b => ({
          text: b.textContent,
          classes: b.className,
          visible: b.offsetParent !== null
        })));
  
        const noShowButton = allButtons.find(button => 
          button.textContent.includes('Mark as a no-show') && 
          button.className.includes('bui-button--secondary') &&
          button.offsetParent !== null
        );
  
        if (noShowButton) {
          console.log('Found button via direct search');
          return noShowButton;
        }
  
        // Strategy 2: XPath search
        try {
          const xpath = "//button[contains(@class, 'bui-button--secondary')]//span[contains(text(), 'Mark as a no-show')]/ancestor::button[1]";
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          const buttonFromXPath = result.singleNodeValue;
          
          if (buttonFromXPath && buttonFromXPath.offsetParent !== null) {
            console.log('Found button via XPath');
            return buttonFromXPath;
          }
        } catch (e) {
          console.error('XPath search failed:', e);
        }
  
        return null;
      };
  
      try {
        console.log('Starting automation process...');
        console.log('Initial page state:');
        logPageState();
  
        // Wait for page load
        if (document.readyState !== 'complete') {
          console.log('Waiting for page load...');
          await new Promise(resolve => window.addEventListener('load', resolve));
        }
        await delay(2000);
  
        // Exclusion checks
        console.log('Checking for exclusions...');
        const exclusionElements = await Promise.all([
          waitForElement('span:contains("You successfully charged the total amount on this card")'),
          waitForElement('p.res-vcc-expiration'),
          document.body.innerText.includes('Virtual credit card'),
          document.body.innerText.includes('The guest has paid for this reservation online')
        ]);
  
        if (exclusionElements.some(el => el)) {
          console.log('Found exclusion:', exclusionElements);
          resolve({
            status: 'skipped',
            reason: 'Exclusion found'
          });
          return;
        }
  
        // Find and click no-show button
        console.log('Searching for no-show button...');
        const noShowButton = await findNoShowButton();
  
        if (!noShowButton) {
          console.log('No-show button not found');
          logPageState();
          resolve({ status: 'skipped', reason: 'No button found' });
          return;
        }
  
        console.log('Found no-show button:', noShowButton.outerHTML);
        noShowButton.click();
        await delay(2000);
  
        // Wait for modal
        console.log('Waiting for modal...');
        const modal = await waitForElement('.bui-modal__content');
        if (!modal) {
          console.log('Modal not found');
          resolve({ status: 'skipped', reason: 'Modal not found' });
          return;
        }
  
        // Find and click radio button
        console.log('Looking for radio button...');
        const radioButton = await waitForElement('input[id^="waive-no-show-fees-yes-"]', modal);
        if (!radioButton) {
          console.log('Radio button not found');
          resolve({ status: 'skipped', reason: 'Radio not found' });
          return;
        }
  
        console.log('Clicking radio button...');
        radioButton.click();
        radioButton.checked = true;
        await delay(1500);
  
        // Find and click confirm button
        console.log('Looking for confirm button...');
        const confirmButton = await waitForElement('button.bui-button--destructive');
        if (!confirmButton) {
          console.log('Confirm button not found');
          resolve({ status: 'skipped', reason: 'Confirm not found' });
          return;
        }
  
        console.log('Clicking confirm button...');
        confirmButton.click();
        await delay(2000);
  
        console.log('Process completed successfully');
        resolve({ status: 'processed', reason: 'Success' });
      } catch (error) {
        console.error('Error in automation:', error);
        logPageState();
        resolve({ status: 'skipped', reason: error.message });
      }
    });
  }