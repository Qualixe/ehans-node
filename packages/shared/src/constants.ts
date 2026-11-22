/** Global API prefix (without leading slash) used by the backend and API clients. */
export const API_PREFIX = 'api/v1';

/** Header used to correlate a request across frontend, Nginx and backend logs. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Collection shown as the home page "Trending Items" grid (live: /collections/trendy-items). */
export const HOME_GRID_COLLECTION = 'trendy-items';
export const HOME_GRID_TITLE = 'Trending Items';
/** Products per "Show more" page in the home grid (live theme: 20). */
export const HOME_GRID_PAGE_SIZE = 20;

/** Products at or below this stock level count as "low stock" (glowy: shop.low_stock_threshold). */
export const LOW_STOCK_THRESHOLD = 5;
