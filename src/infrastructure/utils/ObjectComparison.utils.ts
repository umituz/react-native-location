/**
 * Infrastructure Layer - Object Comparison Utilities
 *
 * Deep comparison utilities for React hooks.
 * Used for stable reference generation.
 */

export class ObjectComparison {
    /**
     * İki objeyi derinlemesine karşılaştır
     */
    static deepEqual(obj1: unknown, obj2: unknown): boolean {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    /**
     * Stable string referans oluştur
     */
    static getStableReference(obj: unknown): string {
        return JSON.stringify(obj ?? {});
    }
}
