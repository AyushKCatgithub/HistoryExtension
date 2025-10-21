# HistoryExtension

A specialized web browser extension designed to save your last 20 visited pages into a local, richly formatted HTML file for easy offline reference and viewing.

This extension transforms your recent history into a portable, visually appealing document, complete with card-style previews and clickable links.

## ✨ Key Features

* **Local Data Export:** Automatically saves the last 20 visited pages to a static `.html` file on your local machine.
* **Rich Card Format:** Each saved link is displayed as a 'card' for superior readability and organization.
* **Visual Previews:** The cards include a preview of the page (likely fetched via a thumbnail or open graph data) to help you quickly recall the content.
* **Offline Access:** The generated `.html` file is completely standalone, allowing you to view and click the links even without an internet connection.
* **Clickable Links:** All saved cards contain fully functional links to the original web pages.

## 📁 Project Structure

The project is structured with standard files required for a modern browser extension:

| File Name | Purpose |
| :--- | :--- |
| `manifest.json` | **Manifest File:** Defines the extension's metadata, permissions (must include `history` and `tabs`), and the necessary background and popup scripts. |
| `popup.html` | **User Interface:** The HTML for the small toolbar popup. It likely contains the "Save History" button or configuration options. |
| `popup.js` | **Frontend Logic:** Handles button clicks in the popup and triggers the main history fetching and saving process. |
| `background.js` | **Core Logic (Service Worker):** The crucial script that uses the browser's History API to retrieve the last 20 pages, formats the data into the HTML card structure, and initiates the local file download. |
| `icon*.png` | **Extension Icons:** Icons for display in the browser. |

## 🚀 Installation and Usage

To install and run this extension locally (e.g., in Google Chrome or Microsoft Edge):

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/AyushKCatgithub/HistoryExtension.git](https://github.com/AyushKCatgithub/HistoryExtension.git)
    ```
2.  **Open your browser's extensions page:**
    * For Chrome/Edge: Navigate to `chrome://extensions` or `edge://extensions`.
3.  **Enable Developer Mode:**
    * Toggle the "Developer mode" switch on the top right.
4.  **Load the extension:**
    * Click the **"Load unpacked"** button.
    * Select the directory where you cloned this repository (`/HistoryExtension`).
5.  **Generate the History File:**
    * Click the extension's icon in your browser toolbar.
    * Use the controls in the popup (likely a single button) to trigger the history-saving process.
    * A local `.html` file will be downloaded to your default downloads folder, containing your last 20 pages.

## 🛠️ Requirements & Permissions

The functionality requires specific permissions in the `manifest.json` to access and save data:

* **`history`:** To read the user's browsing history data (URLs, titles, timestamps).
* **`tabs`:** Often required for complex history retrieval or to ensure page data is correct.
* **`downloads`:** To initiate the saving/downloading of the generated `.html` file.
