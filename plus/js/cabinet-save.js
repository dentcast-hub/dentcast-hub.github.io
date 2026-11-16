// The cabinet page's (dentcast_cabinet_search.html) one door into the Plus
// graph: «Save» on a paper, and the premium full-text search.
//
// The cabinet is a plain inline-script page; this module is that door.
// «Save» hands the paper to the collections picker as a «رفرنس» pin (see
// addReferenceTo in collections.js), which also owns the three states: a
// guest is asked to log in, a free reader sees the premium gate, a subscriber
// picks (or makes) a board.
import { openCollectionPicker } from './collections.js?v=247';
import { api } from './api.js?v=247';

window.dcCabinetSave = (paper) => openCollectionPicker({ reference: paper });
// Full text: resolves to {results, indexed}, or null for a guest, a free
// reader or an unreachable API — the page then simply has no full-text part.
window.dcCabinetFulltext = (q) => api.cabinetFulltext(q).catch(() => null);
document.dispatchEvent(new CustomEvent('dc:cabinet-save-ready'));
