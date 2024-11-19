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
      
      // Function to wait for page load and dynamic content
      const waitForContent = async () => {
        const startTime = Date.now();
        while (Date.now() - startTime < 10000) { // 10 second timeout
          if (document.querySelector('button.bui-button--secondary')) {
            await delay(1000); // Additional delay for dynamic content
            return true;
          }
          await delay(500);
        }
        return false;
      };
  
      // Function to find button by exact text
      const findNoShowButton = () => {
        const buttons = Array.from(document.querySelectorAll('button.bui-button--secondary.bui-button--wide'));
        return buttons.find(button => {
          const spanText = button.querySelector('span span');
          return spanText && spanText.textContent.trim() === 'Mark as a no-show';
        });
      };
  
      try {
        console.log('Starting automation process...');
        
        // Wait for content to load
        if (!await waitForContent()) {
          console.log('Page content did not load in time');
          resolve({ status: 'skipped', reason: 'Page not loaded' });
          return;
        }
  
        // Check for page text indicating payment
        const pageText = document.body.innerText;
        
        // Check for already charged
        if (pageText.includes('You successfully charged the total amount on this card')) {
          console.log('Found successful charge text');
          resolve({ 
            status: 'paid',
            reason: 'Payment already charged'
          });
          return;
        }
  
        // Check for virtual card
        if (pageText.includes('Virtual credit card') || 
            pageText.includes('Virtual card balance') ||
            document.querySelector('p.res-vcc-expiration')) {
          console.log('Found virtual card');
          resolve({ 
            status: 'vcc',
            reason: 'Virtual credit card'
          });
          return;
        }
  
        // Check for online payment
        if (pageText.includes('The guest has paid for this reservation online')) {
          console.log('Found online payment');
          resolve({ 
            status: 'paid',
            reason: 'Paid online'
          });
          return;
        }
  
        // Find and click no-show button
        console.log('Looking for no-show button...');
        const noShowButton = findNoShowButton();
  
        if (!noShowButton) {
          console.log('No-show button not found');
          resolve({ status: 'skipped', reason: 'Button not found' });
          return;
        }
  
        console.log('Clicking no-show button...');
        noShowButton.click();
        await delay(2000);
  
        // Wait for modal
        const modal = await new Promise(resolve => {
          let attempts = 0;
          const checkModal = () => {
            const modal = document.querySelector('.bui-modal__content');
            if (modal) {
              resolve(modal);
            } else if (attempts++ < 10) {
              setTimeout(checkModal, 500);
            } else {
              resolve(null);
            }
          };
          checkModal();
        });
  
        if (!modal) {
          console.log('Modal did not appear');
          resolve({ status: 'skipped', reason: 'Modal not found' });
          return;
        }
  
        // Find and click radio button
        console.log('Looking for radio button...');
        const radioButton = modal.querySelector('input[id^="waive-no-show-fees-yes-"][type="radio"]');
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
        const confirmButton = modal.querySelector('button.bui-button--destructive');
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
        resolve({ status: 'skipped', reason: error.message });
      }
    });
  }