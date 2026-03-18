/**
 * Infrastructure Layer - Accuracy Utilities
 *
 * Accuracy formatting and validation utilities.
 * Extracted from LocationUtils for single responsibility.
 */

export class AccuracyUtils {
    private static readonly EXCELLENT_THRESHOLD = 10;
    private static readonly GOOD_THRESHOLD = 50;
    private static readonly FAIR_THRESHOLD = 100;
    private static readonly DEFAULT_MAX_ACCURACY = 100;

    /**
     * Accuracy değerini formatla
     */
    static format(accuracy: number | null | undefined): string {
        if (accuracy === null || accuracy === undefined) {
            return "Unknown";
        }

        if (accuracy < this.EXCELLENT_THRESHOLD) {
            return `Excellent (±${Math.round(accuracy)}m)`;
        }
        if (accuracy < this.GOOD_THRESHOLD) {
            return `Good (±${Math.round(accuracy)}m)`;
        }
        if (accuracy < this.FAIR_THRESHOLD) {
            return `Fair (±${Math.round(accuracy)}m)`;
        }
        return `Poor (±${Math.round(accuracy)}m)`;
    }

    /**
     * Accuracy değeri geçerli mi?
     */
    static isValid(
        accuracy: number | null | undefined,
        maxAccuracy = this.DEFAULT_MAX_ACCURACY
    ): boolean {
        if (accuracy === null || accuracy === undefined) {
            return false;
        }

        if (!Number.isFinite(accuracy)) {
            return false;
        }

        return accuracy > 0 && accuracy <= maxAccuracy;
    }
}
