const API_BASE = import.meta.env.VITE_API_URL || '';

// Named export too, so components ported from the Vietnam tree
// (`import { API_BASE } from ...`) work unchanged.
export { API_BASE };
export default API_BASE;
