// «Save» on a paper in «کتابخانه‌ی دنت‌کست» (dentcast_cabinet_search.html).
//
// The cabinet is a plain inline-script page; this module is its one door into
// the Plus graph. It hands the paper to the collections picker as a «رفرنس»
// pin (see addReferenceTo in collections.js), which also owns the three
// states: a guest is asked to log in, a free reader sees the premium gate, a
// subscriber picks (or makes) a board.
import { openCollectionPicker } from './collections.js?v=240';

window.dcCabinetSave = (paper) => openCollectionPicker({ reference: paper });
document.dispatchEvent(new CustomEvent('dc:cabinet-save-ready'));
