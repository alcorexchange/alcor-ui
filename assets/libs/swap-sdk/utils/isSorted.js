"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSorted = void 0;
/**
 * Determines if a tick list is sorted
 * @param list The tick list
 * @param comparator The comparator
 * @returns true if sorted
 */
function isSorted(list, comparator) {
    for (let i = 0; i < list.length - 1; i++) {
        if (comparator(list[i], list[i + 1]) > 0) {
            return false;
        }
    }
    return true;
}
exports.isSorted = isSorted;
