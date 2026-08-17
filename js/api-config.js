// Synergy Deals Limited — shared API base URL for pages that talk to the backend.
// Change this if the backend is deployed somewhere other than local dev.
window.SYNERGY_API_BASE = 'http://localhost:5000/api';

// Category slugs -> human-readable labels. Must stay in sync with backend/config/categories.js.
window.SYNERGY_CATEGORIES = {
  'branding': 'Branding & Promotional Materials',
  'office-supplies': 'General Office Supplies',
  'telecommunication': 'Telecommunication Equipment',
  'networking': 'WAN/LAN Networking',
  'ict-equipment': 'ICT Equipment',
  'construction-materials': 'Construction Materials',
  'electrical': 'Electrical Supplies',
};
