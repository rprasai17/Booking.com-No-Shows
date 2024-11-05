document.getElementById('automateButton').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: automateClicks
    });
  });
  
  function automateClicks() {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    async function performClicks() {
      try {
        // Click the "Mark as no show" button
        const noShowButton = document.querySelector('button.bui-button--secondary.bui-button--wide');
        if (noShowButton) {
          noShowButton.click();
          await delay(500); // Wait for modal to appear
          
          // Click the radio button
          const radioButton = document.querySelector('#waive-no-show-fees-yes-5165260522');
          if (radioButton) {
            radioButton.click();
            await delay(500);
            
            // Click the final confirmation button
            const confirmButton = document.querySelector('button.bui-button--destructive');
            if (confirmButton) {
              confirmButton.click();
            } else {
              throw new Error("Confirmation button not found");
            }
          } else {
            throw new Error("Radio button not found");
          }
        } else {
          throw new Error("No show button not found");
        }
      } catch (error) {
        console.error("Automation failed:", error.message);
      }
    }
    
    performClicks();
  }