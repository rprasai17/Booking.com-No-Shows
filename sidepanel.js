// sidepanel.js
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

                switch (status) {
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

        // Function to wait for an element to be visible and fully loaded
        const waitForElement = async (selector, context = document, timeout = 5000) => {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const element = context.querySelector(selector);
                if (element && element.offsetParent !== null) { // Check if element is visible
                    return element;
                }
                await delay(100);
            }
            return null;
        };

        // Function to wait for modal to be fully loaded
        const waitForModal = async () => {
            const modal = await waitForElement('.bui-modal__content');
            if (!modal) return null;

            // Wait for modal content to be fully loaded
            await delay(500);
            return modal;
        };

        try {
            // Quick check for exclusions
            const exclusionTexts = [
                'Virtual credit card',
                'Virtual card balance',
                'You have successfully charged the total amount on this card',
                'The guest has paid for this reservation online'
            ];

            const pageText = document.body.innerText;
            for (const text of exclusionTexts) {
                if (pageText.includes(text)) {
                    resolve({
                        status: text.includes('Virtual') ? 'vcc' : 'paid',
                        reason: `Found text: ${text}`
                    });
                    return;
                }
            }

            // Check for VCC expiration element
            if (document.querySelector('p.res-vcc-expiration')) {
                resolve({ status: 'vcc', reason: 'VCC expiration found' });
                return;
            }

            // Find and click "Mark as no show" button
            const noShowButton = document.evaluate(
                "//button[contains(@class, 'bui-button--secondary') and .//span[text()='Mark as a no show']]",
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (!noShowButton) {
                resolve({ status: 'skipped', reason: 'No no-show button found' });
                return;
            }

            // Click no-show button and wait for modal
            noShowButton.click();
            await delay(800);

            // Wait for modal to appear and be fully loaded
            const modal = await waitForModal();
            if (!modal) {
                resolve({ status: 'skipped', reason: 'Modal did not appear' });
                return;
            }

            // Find the radio button within the modal context
            const radioButton = await waitForElement('input[id^="waive-no-show-fees-yes-"]', modal);
            if (!radioButton) {
                resolve({ status: 'skipped', reason: 'Radio button not found in modal' });
                return;
            }

            // Click radio button and ensure it's checked
            radioButton.click();
            radioButton.checked = true;
            await delay(500);

            // Wait for and click the final confirmation button within the modal
            const confirmButton = await waitForElement('button.bui-button--destructive', modal);
            if (!confirmButton) {
                resolve({ status: 'skipped', reason: 'Confirm button not found in modal' });
                return;
            }

            confirmButton.click();
            await delay(500);

            resolve({ status: 'processed', reason: 'Successfully processed' });
        } catch (error) {
            resolve({ status: 'skipped', reason: error.message });
        }
    });
}