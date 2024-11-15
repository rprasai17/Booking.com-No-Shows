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
      
      // Enhanced element waiting function with logging
      const waitForElement = async (selector, context = document, timeout = 5000) => {
        console.log(`Waiting for element: ${selector}`);
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
          const element = context.querySelector(selector);
          if (element && element.offsetParent !== null) {
            console.log(`Found element: ${selector}`);
            await delay(300);
            return element;
          }
          await delay(100);
        }
        console.log(`Timeout waiting for element: ${selector}`);
        return null;
      };
  
      // Function to find button by exact text content
      const findButtonByText = (text) => {
        const spans = Array.from(document.querySelectorAll('button span'));
        const targetSpan = spans.find(span => span.textContent.trim() === text);
        return targetSpan ? targetSpan.closest('button.bui-button--secondary.bui-button--wide') : null;
      };
  
      try {
        // First check for the specific span text
        const chargedSpan = document.evaluate(
          "//span[contains(text(), 'You successfully charged the total amount on this card')]",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;
  
        if (chargedSpan) {
          console.log('Found successful charge text');
          resolve({ 
            status: 'paid',
            reason: 'Payment already charged'
          });
          return;
        }
  
        // Then check for other exclusion texts
        const exclusionTexts = [
          'Virtual credit card',
          'Virtual card balance',
          'The guest has paid for this reservation online'
        ];
  
        const pageText = document.body.innerText;
        for (const text of exclusionTexts) {
          if (pageText.includes(text)) {
            console.log(`Exclusion found: ${text}`);
            resolve({ 
              status: text.includes('Virtual') ? 'vcc' : 'paid',
              reason: `Found text: ${text}`
            });
            return;
          }
        }
  
        // Check for VCC expiration
        if (document.querySelector('p.res-vcc-expiration')) {
          console.log('VCC expiration found');
          resolve({ status: 'vcc', reason: 'VCC expiration found' });
          return;
        }
  
        // Find no-show button using exact text match
        console.log('Looking for no-show button...');
        const noShowButton = findButtonByText('Mark as a no-show');
  
        if (!noShowButton) {
          console.log('No-show button not found');
          resolve({ status: 'skipped', reason: 'No matching no-show button found' });
          return;
        }
  
        // Click the button
        console.log('Clicking no-show button...');
        noShowButton.click();
        await delay(1200);
  
        // Wait for modal
        const modal = await waitForElement('.bui-modal__content');
        if (!modal) {
          resolve({ status: 'skipped', reason: 'Modal did not appear after clicking button' });
          return;
        }
        await delay(1000);
  
        // Find and click radio button
        const radioButton = await waitForElement('input[id^="waive-no-show-fees-yes-"][type="radio"]', modal);
        if (!radioButton) {
          console.log('Radio button not found in modal');
          resolve({ status: 'skipped', reason: 'Radio button not found in modal' });
          return;
        }
  
        console.log('Clicking radio button...');
        radioButton.click();
        radioButton.checked = true;
        await delay(800);
  
        // Find and click confirm button
        const confirmButton = await waitForElement('button.bui-button--destructive');
        if (!confirmButton) {
          console.log('Confirm button not found');
          resolve({ status: 'skipped', reason: 'Confirm button not found in modal' });
          return;
        }
  
        console.log('Clicking confirm button...');
        confirmButton.click();
        await delay(1000);
  
        console.log('Successfully processed');
        resolve({ status: 'processed', reason: 'Successfully processed' });
      } catch (error) {
        console.error('Error in checkAndAutomate:', error);
        resolve({ status: 'skipped', reason: error.message });
      }
    });
  }